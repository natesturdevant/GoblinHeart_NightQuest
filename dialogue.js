// dialogue.js - NPC Dialogue System
console.log('=== DIALOGUE.JS IS LOADING ===');

const dialogueDatabase = 

{
  "elder_aldric": {
    "name": "Elder Aldric",
    "sprite": "villager_old",
    "lines": [
      {
        "text": "Welcome to Haven Village, traveler. May you find rest here.",
        "requires": {},
        "sets": {
          "met_aldric": true
        }
      },
      {
        "text": "You've grown stronger! Level {{level}} already! The village is safer with heroes like you nearby.",
        "requires": {
          "level": 5
        }
      },
      {
        "text": "You found the holy blade!!",
        "requires": {
          "flags": {},
          "hasItem": "shadowfang"
        }
      },
      {
        "text": "Hello again, adventurer!",
        "requires": {
          "flags": {
            "met_aldric": true
          }
        }
      },
      {
        "text": "Nasty weather we're having!",
        "requires": {
          "flags": {
            "is_storming": true
          }
        },
        "sets": {}
      }
    ],
    "isShopkeeper": true
  },
  "merchant_marcus": {
    "name": "Marcus",
    "sprite": "merchant",
    "isShopkeeper": true,
    "lines": [
      {
        "text": "Marcus here! Welcome to my shop. Take a look at my wares.",
        "requires": {},
        "sets": {
          "marcus_visited": true
        }
      }
    ]
  },
  "villager_female": {
    "name": "Ellen",
    "sprite": "villager_female",
    "isShopkeeper": false,
    "lines": [
      {
        "text": "Hello, {{name}}.",
        "requires": {},
        "sets": {
          "talked_before": true
        }
      }
    ]
  },
  "villager_blacksmith": {
    "name": "Blacksmith",
    "sprite": "villager_blacksmith",
    "isShopkeeper": false,
    "lines": [
      {
        "text": "Hello, traveler.",
        "requires": {},
        "sets": {
          "talked_before": true
        }
      }
    ]
  },
  "villager_wealthy": {
    "name": "Wealthy",
    "sprite": "villager_wealthy",
    "isShopkeeper": false,
    "lines": [
      {
        "text": "Hello, traveler.",
        "requires": {},
        "sets": {
          "talked_before": true
        }
      }
    ]
  },
  "eddie_video_clerk": {
    "name": "Eddie",
    "sprite": "villager_old",
    "isShopkeeper": false,
    "lines": [
      {
        "text": "Welcome to work, {{name}}. Sort these videos out.",
        "requires": {},
        "sets": {
          "talked_before": true
        },
        "journalEntry": {
          "title": "Eddie at the Video Dungeon",
          "blocks": [
            {
              "type": "text",
              "content": "I've known Eddie a long time. He's pretty chill as old dudes like him go.",
              "align": "right"
            }
          ]
        }
      },
      {
        "text": "I thought I told you to sort those videos.",
        "requires": {
          "flags": {
            "talked_before": true
          }
        }
      }
    ]
  },
  "villager_innkeeper": {
    "name": "Molly (Innkeeper)",
    "sprite": "villager_innkeeper",
    "isShopkeeper": false,
    "lines": [
      {
        "text": "Hello, {{name}}. Rest for 50 gold?",
        "requires": {},
        "sets": {
          "talked_before": true
        }
      }
    ]
  }
}

/**
 * Get the most appropriate dialogue line for an NPC based on game state
 * @param {string} npcId - The unique NPC identifier (e.g., "elder_aldric", "guard_tom")
 * @param {object} gameState - The current game state
 * @returns {object} - Dialogue object with text and any flag changes
 */
function getDialogue(npcId, gameState) {
    const npc = dialogueDatabase[npcId];
    if (!npc) {
        console.error(`NPC "${npcId}" not found in dialogue database`);
        return { text: "...", sets: null };
    }
    
    // Initialize flags if they don't exist
    if (!gameState.flags) {
        gameState.flags = {};
    }
    
    // Find the LAST line that matches all conditions
    // Lines should be ordered from least to most specific
    for (let i = npc.lines.length - 1; i >= 0; i--) {
        const line = npc.lines[i];
        if (meetsRequirements(line.requires, gameState)) {
            return processDialogue(line, gameState, npcId);
        }
    }
    
    // Fallback to first line if nothing matches
    return processDialogue(npc.lines[0], gameState, npcId);
}

/**
 * Check if player meets all requirements for a dialogue line
 * @param {object} requires - Requirements object
 * @param {object} gameState - Current game state
 * @returns {boolean}
 */
function meetsRequirements(requires, gameState) {
    if (!requires) return true;
    
    // Check level requirement
    if (requires.level !== undefined) {
        if (gameState.player.level < requires.level) {
            return false;
        }
    }
    
    // Check flag requirements
    if (requires.flags) {
        for (const [flag, requiredValue] of Object.entries(requires.flags)) {
            const currentValue = gameState.flags?.[flag];
            
            // Handle boolean flags
            if (typeof requiredValue === 'boolean') {
                if (Boolean(currentValue) !== requiredValue) {
                    return false;
                }
            }
            // Handle exact value matching
            else if (currentValue !== requiredValue) {
                return false;
            }
        }
    }
    
    // Check inventory requirements
    if (requires.hasItem) {
        if (!gameState.player.inventory.includes(requires.hasItem)) {
            return false;
        }
    }
    
    // Check gold requirement
    if (requires.gold !== undefined) {
        if (gameState.player.gold < requires.gold) {
            return false;
        }
    }
    
    return true;
}

/**
 * Process dialogue line - replace variables and set flags
 * @param {object} line - Dialogue line object
 * @param {object} gameState - Current game state
 * @param {string} npcId - The NPC ID for logging
 * @returns {object} - Processed dialogue with text and flag changes
 */
function processDialogue(line, gameState, npcId) {
    // Replace template variables like {{level}}, {{gold}}, etc.
    let text = line.text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        // Check player properties first
        if (gameState.player[key] !== undefined) {
            return gameState.player[key];
        }
        // Check flags
        if (gameState.flags?.[key] !== undefined) {
            return gameState.flags[key];
        }
        // Leave unchanged if not found
        return match;
    });
	
	if (line.journalEntry) {
        console.log('Journal entry found:', line.journalEntry);
        console.log('addJournalEntry function exists?', typeof addJournalEntry);
        
        if (typeof addJournalEntry === 'function') {
            console.log('Calling addJournalEntry...');
            addJournalEntry(line.journalEntry.title, line.journalEntry.blocks);
        } else {
            console.error('addJournalEntry function not found!');
        }
    }
    
    // Set flags if this line specifies any
    if (line.sets) {
        if (!gameState.flags) {
            gameState.flags = {};
        }
        Object.assign(gameState.flags, line.sets);
        console.log(`[${npcId}] Set flags:`, line.sets);
    }
    
    // TODO: Journal entry support (ready for future implementation)
    // if (line.journalEntry && typeof addJournalEntry === 'function') {
    //     addJournalEntry(line.journalEntry.title, line.journalEntry.blocks);
    // }
    
    return {
        text: text,
        sets: line.sets || null,
        npcName: dialogueDatabase[npcId]?.name || "Unknown"
    };
}

/**
 * Get NPC data by ID
 * @param {string} npcId - The NPC identifier
 * @returns {object} - NPC data object or null
 */
function getNPCData(npcId) {
    return dialogueDatabase[npcId] || null;
}

/**
 * Export dialogue database as JSON (for use with editor)
 * @returns {string} - JSON string of dialogue database
 */
function exportDialogueJSON() {
    return JSON.stringify(dialogueDatabase, null, 2);
}

/**
 * Import dialogue database from JSON (for use with editor)
 * @param {string} jsonString - JSON string to import
 * @returns {boolean} - Success status
 */
function importDialogueJSON(jsonString) {
    try {
        const imported = JSON.parse(jsonString);
        Object.assign(dialogueDatabase, imported);
        console.log('Dialogue database imported successfully');
        return true;
    } catch (e) {
        console.error('Failed to import dialogue:', e);
        return false;
    }
}

console.log('=== DIALOGUE.JS LOADED ===');
console.log(`Loaded ${Object.keys(dialogueDatabase).length} unique NPCs with dialogue`);