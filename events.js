// events.js - Event and Quest System for Goblinheart
console.log('=== EVENTS.JS IS LOADING ===');

/**
 * EVENT SYSTEM EXPLANATION:
 * 
 * Each event has two parts:
 * 1. canTrigger() - Returns true/false. Checks if conditions are met.
 * 2. onTrigger() - Runs when canTrigger returns true. Does the thing.
 * 
 * The checkEvents() function runs through all events and fires any
 * whose conditions are met. We call checkEvents() at key moments:
 * - After player moves
 * - After player performs an action
 * - In rest hooks (see below)
 * 
 * REST HOOK SYSTEM:
 * - beforeRest hooks run BEFORE rest happens (can cancel rest)
 * - afterRest hooks run AFTER rest completes (for day advancement, etc.)
 * 
 * This keeps event logic separate from game logic.
 */

// ===================================================================
// REST HOOKS - Keep the rest() function clean
// ===================================================================

// Story-specific items (not in equipment.js)
const storyItems = {
    'magic_vhs': {
        id: 'magic_vhs',
        name: 'Unmarked VHS',
        description: 'A VHS tape covered in strange symbols. It feels wrong.',
        type: 'key_item',
        canEquip: false,
        canDrop: false,
        canSell: false,
        rarity: 'unique',
        tier: 0
    }
};

// Add story items to item database
Object.assign(itemDatabase, storyItems);

const restHooks = {
    /**
     * beforeRest - runs BEFORE rest happens
     * Return true to CANCEL the normal rest (for special handling)
     * Return false to continue with normal rest
     */
    beforeRest: [
        // VHS watching hook
        function checkVHSWatching(gameState, location) {
            const currentTile = gameState.world.tiles[gameState.player.y]?.[gameState.player.x];
            
            if (currentTile === 'B' && gameState.player.inventory.includes('magic_vhs')) {
                gameState.flags.tryingToRestWithVHS = true;
                checkEvents(gameState);
                
                // If we got transported, cancel normal rest
                if (gameState.flags.transported) {
                    gameState.flags.tryingToRestWithVHS = false;
                    return true; // Cancel rest
                }
                
                gameState.flags.tryingToRestWithVHS = false;
            }
            
            return false; // Continue with normal rest
        }
    ],
    
    /**
     * afterRest - runs AFTER rest completes
     * Good for advancing day counters, spawning events, etc.
     */
    afterRest: [
        // Day counter advancement
        function advanceDay(gameState, location) {
            if (location === 'bed') {
                gameState.dayCounter = (gameState.dayCounter || 0) + 1;
                console.log(`Day advanced to: ${gameState.dayCounter}`);
                
                // Reset daily flags
                gameState.dailyFlags = {
                    talkedToEddie: false,
                    visitedCoffeeShop: false,
                    wentToBar: false
                };
                
                // Show day number
                addMessage(`Day ${gameState.dayCounter}`, CGA.CYAN);
                
                // Check for events that trigger on new day
                checkEvents(gameState);
            }
        }
    ]
};

/**
 * Run all beforeRest hooks
 * Returns true if rest should be cancelled
 */
function runBeforeRestHooks(gameState, location) {
    for (const hook of restHooks.beforeRest) {
        try {
            const shouldCancel = hook(gameState, location);
            if (shouldCancel) {
                console.log('Rest cancelled by hook');
                return true;
            }
        } catch (error) {
            console.error('Error in beforeRest hook:', error);
        }
    }
    return false;
}

/**
 * Run all afterRest hooks
 */
function runAfterRestHooks(gameState, location) {
    restHooks.afterRest.forEach(hook => {
        try {
            hook(gameState, location);
        } catch (error) {
            console.error('Error in afterRest hook:', error);
        }
    });
}

// ===================================================================
// EVENT HANDLERS - Main quest and story events
// ===================================================================

const eventHandlers = {
    
    // ===== INTRO: VHS APPEARS AT WORK =====
    'vhs_appears': {
        /**
         * Conditions: Day 3+, haven't seen VHS yet, at Video_Store
         */
        canTrigger: (gameState) => {
            return gameState.dayCounter >= 3 && 
                   !gameState.flags.vhsAppeared &&
                   gameState.currentMap === 'Video_Store';
        },
        
        /**
         * Action: Place VHS in Video_Store as treasure
         */
        onTrigger: (gameState) => {
            console.log('EVENT: VHS appearing at Video_Store');
            
            gameState.flags.vhsAppeared = true;
            
            // Pick a location in the Video_Store for the VHS
            // ADJUST THESE COORDINATES to match your Video_Store map layout
            const vhsLocation = '8,5'; // Example: near Eddie's counter
            
            // Make sure treasureContents for this map exists
            if (!treasureContents['Video_Store']) {
                treasureContents['Video_Store'] = {};
            }
            
            // Add the VHS as a "treasure chest" at that location
            // (It will show as $ on the map)
            treasureContents['Video_Store'][vhsLocation] = {
                gold: 0,
                items: ['magic_vhs']
            };
            
            // Update the map tile to show treasure chest
            const [x, y] = vhsLocation.split(',').map(Number);
            const currentRow = gameState.world.tiles[y];
            gameState.world.tiles[y] = currentRow.substring(0, x) + '$' + currentRow.substring(x + 1);
            
            addMessage("Something's different about the store today...", CGA.CYAN);
            
            renderWorld();
        }
    },
    
    // ===== EDDIE COMMENTS ON VHS =====
    'eddie_vhs_dialogue': {
        /**
         * Conditions: VHS appeared, player is near Eddie, haven't talked yet
         */
        canTrigger: (gameState) => {
            if (!gameState.flags.vhsAppeared || gameState.flags.eddieCommentedOnVHS) {
                return false;
            }
            
            // Check if player is adjacent to Eddie (find Eddie NPC)
            const eddie = gameState.npcs.find(npc => npc.type === 'eddie_video_clerk');
            if (!eddie) return false;
            
            const distX = Math.abs(eddie.x - gameState.player.x);
            const distY = Math.abs(eddie.y - gameState.player.y);
            const isAdjacent = (distX <= 1 && distY <= 1) && !(distX === 0 && distY === 0);
            
            return isAdjacent;
        },
        
        /**
         * Action: Eddie mentions the weird tape
         */
        onTrigger: (gameState) => {
            console.log('EVENT: Eddie comments on VHS');
            
            gameState.flags.eddieCommentedOnVHS = true;
            
            addMessage("Eddie: 'Someone returned that tape this morning.'", CGA.WHITE);
            addMessage("Eddie: 'Never seen one like it. Weird symbols and all.'", CGA.WHITE);
            addMessage("Eddie: 'Check if it's damaged, will ya?'", CGA.WHITE);
        }
    },
    
    // ===== PICKED UP VHS =====
    'vhs_pickup': {
        /**
         * Conditions: Just picked up the VHS (checking inventory change)
         */
        canTrigger: (gameState) => {
            return gameState.player.inventory.includes('magic_vhs') &&
                   !gameState.flags.pickedUpVHS;
        },
        
        /**
         * Action: Ominous message and journal entry
         */
        onTrigger: (gameState) => {
            console.log('EVENT: Player picked up VHS');
            
            gameState.flags.pickedUpVHS = true;
            
            addMessage("The tape feels unnaturally cold in your hands.", CGA.MAGENTA);
            addMessage("You can't quite focus on the label...", CGA.MAGENTA);
            addMessage("Maybe you should watch it when you get home.", CGA.CYAN);
            
            // Add journal entry
            addJournalEntry('The Unmarked Tape', [
                { type: 'text', content: 'Found a strange VHS at work today. The label is covered in symbols I don\'t recognize.' },
                { type: 'text', content: 'Eddie said someone returned it this morning. Who rents tapes like this?' },
                { type: 'text', content: 'I should probably watch it when I get home. Make sure it\'s not damaged.' }
            ]);
        }
    },
    
    // ===== TRANSPORT: WATCHING THE VHS =====
    'vhs_transport': {
        /**
         * Conditions: At home in bed, have VHS, trying to rest
         */
        canTrigger: (gameState) => {
            // Check if on bed tile
            const currentTile = gameState.world.tiles[gameState.player.y]?.[gameState.player.x];
            const onBed = currentTile === 'B';
            
            // Check if has VHS and haven't transported yet
            const hasVHS = gameState.player.inventory.includes('magic_vhs');
            const notTransported = !gameState.flags.transported;
            
            // Check if player just tried to rest (flag set by beforeRest hook)
            const tryingToRest = gameState.flags.tryingToRestWithVHS || false;
            
            return onBed && hasVHS && notTransported && tryingToRest;
        },
        
        /**
         * Action: Transport sequence
         */
        onTrigger: (gameState) => {
            console.log('EVENT: VHS transport sequence starting');
            
            gameState.flags.transported = true;
            gameState.flags.tryingToRestWithVHS = false; // Clear the trigger flag
            
            transportSequence(gameState);
        }
    }
};

// ===================================================================
// EVENT SYSTEM CORE
// ===================================================================

/**
 * Check all events - called after player actions
 * Goes through each event and triggers any whose conditions are met
 */
function checkEvents(gameState) {
    // Loop through all event handlers
    Object.entries(eventHandlers).forEach(([eventId, handler]) => {
        try {
            // Check if event should trigger
            if (handler.canTrigger(gameState)) {
                console.log(`Triggering event: ${eventId}`);
                // Run the event
                handler.onTrigger(gameState);
            }
        } catch (error) {
            console.error(`Error in event ${eventId}:`, error);
        }
    });
}

// ===================================================================
// TRANSPORT SEQUENCE
// ===================================================================

/**
 * Transport sequence - the actual VHS watching scene
 * This is the big moment where player leaves Mansfield
 */
function transportSequence(gameState) {
    fadeToBlack(() => {
        addMessage("===================");
        addMessage("You can't stop thinking about that tape...");
        addMessage("You put it in the VCR.");
        addMessage("===================");
        
        setTimeout(() => {
            addMessage("Static fills the screen.", CGA.CYAN);
            
            setTimeout(() => {
                addMessage("The static forms patterns...", CGA.MAGENTA);
                
                setTimeout(() => {
                    addMessage("The patterns become symbols...", CGA.MAGENTA);
                    
                    setTimeout(() => {
                        addMessage("The symbols burn into your eyes...", CGA.MAGENTA);
                        
                        setTimeout(() => {
                            addMessage("===================");
                            addMessage("Everything goes white.");
                            addMessage("===================");
                            
                            setTimeout(() => {
                                // ===== ACTUAL TRANSPORT HAPPENS HERE =====
                                // CHANGE 'Dungeon1' to your goblin world map name
                                loadMap('Dungeon1'); 
                                
                                // Set spawn position in new world
                                // ADJUST THESE COORDINATES to your map's spawn point
                                gameState.player.x = 10;
                                gameState.player.y = 7;
                                
                                // Remove VHS from inventory (it's gone forever)
                                const vhsIndex = gameState.player.inventory.indexOf('magic_vhs');
                                if (vhsIndex > -1) {
                                    gameState.player.inventory.splice(vhsIndex, 1);
                                }
                                
                                // Clear any Mansfield-specific flags if needed
                                gameState.flags.inMansfield = false;
                                gameState.flags.inGoblinRealm = true;
                                
                                setTimeout(() => {
                                    clearFade();
                                    addMessage("===================");
                                    addMessage("You wake up on cold stone.");
                                    addMessage("This isn't your bedroom.");
                                    addMessage("This isn't Mansfield.");
                                    addMessage("===================");
                                    
                                    // Add journal entry about transport
                                    addJournalEntry('What Just Happened?', [
                                        { type: 'text', content: 'I watched the tape. I shouldn\'t have watched the tape.' },
                                        { type: 'text', content: 'Now I\'m... somewhere else. Stone walls. Cold air. The smell of damp earth.' },
                                        { type: 'text', content: 'Where am I? How do I get home?' }
                                    ]);
                                    
                                    renderWorld();
                                    updateExploration();
                                    updateStatus();
                                }, 500);
                            }, 2000);
                        }, 1500);
                    }, 1500);
                }, 1500);
            }, 1500);
        }, 1000);
    });
}

// ===================================================================
// INITIALIZATION
// ===================================================================

console.log('=== EVENTS.JS LOADED ===');
console.log(`Registered ${Object.keys(eventHandlers).length} event handlers`);
console.log(`Registered ${restHooks.beforeRest.length} beforeRest hooks`);
console.log(`Registered ${restHooks.afterRest.length} afterRest hooks`);