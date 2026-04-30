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
        chrissy_video_clerk: {
            name: "Chrissy",
            sprite: "villager_worker",
            talk: [
				{
					priority: 200,
					when: {watched_robocop: true, watched_tron: true, watched_thing: true, 
						   watched_rocky4: true, watched_karate_kid: true, NOT_final_conversation: true},
					say: "CHRISSY: 'You watched them all. Every single one.'\nCHRISSY: 'I knew you would.'\n[She smiles, but there's something sad in it]",
					set: 'final_conversation'
				},
				
				// Individual tape reactions
				{
					priority: 150,
					when: {watched_karate_kid: true, NOT_talked_after_karate_kid: true},
					say: "CHRISSY: 'Karate Kid, huh? The power of a good teacher.'\nCHRISSY: 'Sometimes you need someone to show you the way.'",
					set: 'talked_after_karate_kid'
				},
				{
					priority: 140,
					when: {watched_rocky4: true, NOT_talked_after_rocky4: true},
					say: "CHRISSY: 'Rocky IV. That speech at the end...'\nCHRISSY: 'If I can change, and you can change, everybody can change.'",
					set: 'talked_after_rocky4'
				},
				{
					priority: 130,
					when: {watched_thing: true, NOT_talked_after_thing: true},
					say: "CHRISSY: 'The Thing! God, that movie's terrifying.'\nCHRISSY: 'Not knowing who to trust. Who's real and who's not.'",
					set: 'talked_after_thing'
				},
				{
					priority: 120,
					when: {watched_tron: true, NOT_talked_after_tron: true},
					say: "CHRISSY: 'Tron! I love that one.'\nCHRISSY: 'A whole world inside the machine. Beautiful.'",
					set: 'talked_after_tron'
				},
				{
					priority: 110,
					when: {watched_robocop: true, NOT_talked_after_robocop: true},
					say: "CHRISSY: 'RoboCop! Nice choice.'\nCHRISSY: 'Half man, half machine. What's left of him, you know?'",
					set: 'talked_after_robocop'
				},
				
				// Has tape but hasn't watched - generic response
				{
					priority: 60,
					when: {has_rental_robocop: true},
					say: "CHRISSY: 'Let me know what you think of that one.'"
				},
				{
					priority: 60,
					when: {has_rental_tron: true},
					say: "CHRISSY: 'Let me know what you think of that one.'"
				},
				{
					priority: 60,
					when: {has_rental_thing: true},
					say: "CHRISSY: 'Let me know what you think of that one.'"
				},
				{
					priority: 60,
					when: {has_rental_rocky4: true},
					say: "CHRISSY: 'Let me know what you think of that one.'"
				},
				{
					priority: 60,
					when: {has_rental_karate_kid: true},
					say: "CHRISSY: 'Let me know what you think of that one.'"
				},
				
				// Night 5: Last night before she vanishes (multi-part)
				{
					priority: 105,
					when: {watched_thing: true, watched_tron: true, watched_robocop: true, 
						   watched_rocky4: true, night5_part2: true, NOT_night5_part3: true},
					say: "CHRISSY: 'Thanks for listening. See you tomorrow?'\n[She looks at you with an expression you can't quite read]",
					set: 'night5_part3'
				},
				{
					priority: 104,
					when: {watched_thing: true, watched_tron: true, watched_robocop: true, 
						   watched_rocky4: true, night5_part1: true, NOT_night5_part2: true},
					say: "CHRISSY: 'Sorry. That was weird. It's just...'\nCHRISSY: 'You ever feel like you're supposed to be somewhere else?'",
					set: 'night5_part2'
				},
				{
					priority: 103,
					when: {watched_thing: true, watched_tron: true, watched_robocop: true, 
						   watched_rocky4: true, NOT_night5_part1: true},
					say: "CHRISSY: 'I had the strangest dream last night.'\nCHRISSY: 'There was this... place. Like a fantasy world, but made out of VHS static.'",
					set: 'night5_part1'
				},
				
				// Night 4
				{
					priority: 102,
					when: {watched_thing: true, watched_tron: true, watched_robocop: true, NOT_night4: true},
					say: "CHRISSY: 'You know what I love about old movies?'\nCHRISSY: 'They believed in other worlds. Narnia. Oz. Tron.'\nCHRISSY: 'Now everything's ironic. Nobody believes anymore.'",
					set: 'night4'
				},
				
				// Night 3
				{
					priority: 101,
					when: {watched_thing: true, watched_tron: true, NOT_night3: true},
					say: "CHRISSY: 'You're here every night now. I like that.'\nCHRISSY: 'Feels like we're the last people who still do this.'\nCHRISSY: 'The ritual, I mean. Coming to a place. Talking to a person.'",
					set: 'night3'
				},
				
				// Night 2
				{
					priority: 100,
					when: {watched_tron: true, NOT_night2: true},
					say: "CHRISSY: 'Oh hey, you came back!'\nCHRISSY: 'Most people rent once and I never see them again.'",
					set: 'night2'
				},
				
				// First meeting
				{
					priority: 0,
					when: {},
					say: "CHRISSY: 'Hey. Welcome to Midnight Video.'\nCHRISSY: 'We never close. I'm Chrissy.'\nCHRISSY: 'Browse the shelves, grab whatever looks good.'",
					set: 'met_chrissy'
				}
            ]
        }
        // Add comma here if you add more NPCs later
    },  // ← CLOSE npcs object here
    
    // ==========================================
    // NPC POSITIONS - Story-based overrides
    // ==========================================
    
    npcPositions: {  // ← SEPARATE from npcs!
        chrissy_video_clerk: [
            {
                when: {in_isekai: true, reached_island2: true},
                map: 'Island_2_Town',
                x: 15,
                y: 8
            },
            {
                when: {in_isekai: true},
                map: 'Island_1_Beach',
                x: 5,
                y: 12
            },
            {
                when: {store_empty: true},
                map: null
            },
            {
                when: {},
                map: 'Video_Store',
                x: 8,
                y: 4
            }
        ]
    },
    
    // ==========================================
    // LOCATIONS - Look around with L key
    // ==========================================
    
    locations: {
        Video_Store: {
            look: [
                {
                    when: {store_empty: true, NOT_found_magic_vhs: true},
                    text: "The store is empty. Lights on, no one here.\nChrissy's jacket hangs on her chair.\nThe counter is unlocked."
                },
                {
                    when: {store_empty: true, found_magic_vhs: true},
                    text: "The empty store. Chrissy is gone.\nYou should take that tape home and watch it."
                },
                {
                    when: {watched_karate_kid: true},
                    text: "Midnight Video. Fluorescent buzz.\nChrissy looks up when you enter."
                },
                {
                    when: {met_chrissy: true},
                    text: "Midnight Video. Rows of VHS tapes.\nChrissy's at the counter, organizing returns."
                },
                {
                    when: {},
                    text: "MIDNIGHT VIDEO - We Never Close\nNeon sign buzzes. Movie posters in the windows.\nA girl with dark hair behind the counter."
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
            id: 'rule_chrissy_vanishes',
            when: {watched_karate_kid: true, NOT_store_empty: true},
            do: [
                {set: 'store_empty'},
                {message: "Something feels wrong.", color: 'CYAN'}
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
    console.log('getStoryNPC called with:', npcId);
    console.log('STORY.npcs:', STORY.npcs);
    
    const npc = STORY.npcs[npcId];
    console.log('Found NPC:', npc);
    
    if (!npc) return null;
    
    const sorted = [...npc.talk].sort((a, b) => b.priority - a.priority);
    const match = sorted.find(entry => checkWhen(entry.when));
    
    console.log('Matched dialogue:', match);
    
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

function getStoryNPCPosition(npcType) {
    const positions = STORY.npcPositions?.[npcType];
    if (!positions) return null;
    
    // Find first matching position (priority order - check highest priority first)
    const match = positions.find(pos => checkWhen(pos.when));
    return match || null;
}

console.log('=== STORY.JS LOADED ===');