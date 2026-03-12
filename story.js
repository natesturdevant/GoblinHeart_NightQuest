// ===== STORY.JS - Minimal Narrative System =====
console.log('=== STORY.JS LOADING ===');

/**
 * GOBLINHEART STORY SYSTEM
 * 
 * ACTION (A): Talk to NPCs - shows dialogue based on flags
 * LOOK (L): Describe location - changes with story progress
 * 
 * Flags stored in: gameState.flags = {flag_name: true}
 */

const STORY = {
    
    // ==========================================
    // NPCs - Talk with ACTION button
    // ==========================================
    
    npcs: {
        
        eddie_video_clerk: {
            name: "Eddie",
            sprite: "villager_worker",
            talk: [
                // After watching VHS - multi-part conversation
                {
                    priority: 100,
                    when: {watched_vhs: true, eddie_part2: true, NOT_eddie_part3: true},
                    say: "EDDIE: 'The basement. That's where he went.'\n[Eddie won't say more.]",
                    set: 'eddie_part3'
                },
                {
                    priority: 99,
                    when: {watched_vhs: true, eddie_part1: true, NOT_eddie_part2: true},
                    say: "EDDIE: 'Robert Chen. Missing three weeks. Last seen here.'",
                    set: 'eddie_part2'
                },
                {
                    priority: 98,
                    when: {watched_vhs: true, NOT_eddie_part1: true},
                    say: "EDDIE: 'You watched it. I can tell. What did you see?'",
                    set: 'eddie_part1'
                },
                
                // Has VHS
                {
                    priority: 80,
                    when: {has_vhs: true, NOT_watched_vhs: true},
                    say: "EDDIE: 'Let me know what's on that tape!'"
                },
                
                // Give VHS
                {
                    priority: 60,
                    when: {met_eddie: true, NOT_has_vhs: true},
                    say: "EDDIE: 'Got this weird tape last week. No label.'\nEDDIE: 'Says \"WATCH ME\" in sharpie.'\n[He hands you a black VHS tape]",
                    give: 'magic_vhs',
                    set: 'has_vhs'
                },
                
                // First meeting
                {
                    priority: 0,
                    when: {},
                    say: "EDDIE: 'Hey! We're closed, but... you look like you need something.'\nEDDIE: 'I'm Eddie. I run this place.'",
                    set: 'met_eddie'
                }
            ]
        },
        
        bartender_npc: {
            name: "Bart",
            sprite: "villager_old",
            talk: [
                {
                    priority: 50,
                    when: {talked_to_bart: true},
                    say: "BART: 'Another round?'"
                },
                {
                    priority: 0,
                    when: {},
                    say: "BART: 'What'll it be?'",
                    set: 'talked_to_bart'
                }
            ]
        }
    },
    
    // ==========================================
    // LOCATIONS - Look around with L key
    // ==========================================
    
    locations: {
        
        Video_Store: {
            look: [
                {
                    when: {watched_vhs: true},
                    text: "The store feels wrong. Empty.\nEddie's not at the counter.\nThe back room door is ajar."
                },
                {
                    when: {has_magic_vhs: true},
                    text: "The store smells like old cardboard.\nFluorescent lights flicker.\nEddie keeps glancing at you."
                },
                {
                    when: {met_eddie: true},
                    text: "Midnight Video. Rows of VHS tapes.\nEddie's organizing the return bin."
                },
                {
                    when: {},
                    text: "Neon sign: 'MIDNIGHT VIDEO - We Never Close'\nFaded 80s movie posters in the windows.\nA guy in a Ghostbusters shirt behind the counter."
                }
            ]
        },
        
        Bar: {
            look: [
                {
                    when: {},
                    text: "The Hills. Old man bar.\nDim lighting. Neon beer signs.\nA few regulars hunched over their drinks."
                }
            ]
        },
        
        Overworld: {
            look: [
                {
                    when: {},
                    text: "Mansfield, Ohio. 1985.\nYou've lived here your whole life.\nIt's a little too familiar."
                }
            ]
        }
    },
    
    // ==========================================
    // RULES - Auto-trigger events
    // ==========================================
    
    rules: [
        {
            id: 'rule_vhs_appears_day3',
            when: {day: 3, NOT_vhs_appeared: true},
            do: [
                {message: "Something's different about the store today...", color: 'CYAN'},
                {set: 'vhs_appeared'}
            ]
        }
    ]
};

// ==========================================
// ENGINE FUNCTIONS
// ==========================================

function checkWhen(when) {
    if (!when || Object.keys(when).length === 0) return true;
    
    for (let key in when) {
        if (key.startsWith('NOT_')) {
            const flag = key.substring(4);
            if (gameState.flags && gameState.flags[flag]) return false;
        } else if (key === 'day') {
            if ((gameState.dayCounter || 1) < when[key]) return false;
        } else {
            if (!gameState.flags || !gameState.flags[key]) return false;
        }
    }
    return true;
}

function doAction(action) {
    if (action.set) {
        if (!gameState.flags) gameState.flags = {};
        gameState.flags[action.set] = true;
        console.log('FLAG SET:', action.set);
    }
    
    if (action.give) {
    gameState.player.inventory.push(action.give);
    if (!gameState.flags) gameState.flags = {};
    gameState.flags[`has_${action.give}`] = true;
    
    // Get pretty name from keyItems or itemDatabase
    const item = keyItems[action.give] || itemDatabase[action.give];
    const itemName = item?.name || action.give;
    const color = item?.rarity ? RARITY_COLORS[item.rarity] : CGA.CYAN;
    
    addMessage(`Received ${itemName}!`, color);
	}
    
    if (action.message) {
        const color = action.color ? CGA[action.color] : CGA.WHITE;
        addMessage(action.message, color);
    }
}

function checkStoryRules() {
    if (!gameState.firedRules) gameState.firedRules = {};
    
    STORY.rules.forEach((rule) => {
        if (gameState.firedRules[rule.id]) return;
        
        if (checkWhen(rule.when)) {
            console.log('RULE FIRED:', rule.id);
            rule.do.forEach(action => doAction(action));
            gameState.firedRules[rule.id] = true;
        }
    });
}

function getStoryNPC(npcId) {
    const npc = STORY.npcs[npcId];
    if (!npc) return null;
    
    const sorted = [...npc.talk].sort((a, b) => b.priority - a.priority);
    const match = sorted.find(entry => checkWhen(entry.when));
    
    if (match) {
        if (match.set) doAction({set: match.set});
        if (match.give) doAction({give: match.give});
        
        return {
            text: match.say,
            name: npc.name
        };
    }
    
    return null;
}

function getStoryLook(mapId) {
    const loc = STORY.locations[mapId];
    if (!loc || !loc.look) return null;
    
    const match = loc.look.find(entry => checkWhen(entry.when));
    return match ? match.text : null;
}

console.log('=== STORY.JS LOADED ===');