// systems/spawning.js - Enemy spawning system
console.log('=== SPAWNING.JS IS LOADING ===');


/*
===========================================
AVAILABLE ENEMIES (from data.js enemyDatabase)
===========================================

TIER 0-1 (Early Game):
  - goblin          : Basic melee enemy
  - slime           : Low HP, magic resistant
  - bat             : Fast, low HP

TIER 1-2 (Mid Game):
  - skeleton        : Undead, can revive once
  - spider          : Web shot ability
  - wraith          : Phase strike teleport
  - zombie          : High HP, slow
  - orc             : Strong melee

TIER 2-3 (Late Game):
  - gargoyle        : High defense
  - imp             : Magic caster
  - golem           : Very high HP/defense
  - spectre         : Magic damage

ELITE VARIANTS:
  - goblin_elite    : War cry buff ability
  - skeleton_elite  : Summons skeleton minions
  - orc_elite       : High stats

===========================================
AVAILABLE ENCOUNTERS (from data.js encounterTypes)
===========================================

GOBLIN GROUPS:
  - goblin_scouts       : 2 goblins, loose formation (level 1+)
  - goblin_patrol       : 4 goblins, cluster formation (level 2+)
  - goblin_warband      : 7 goblins + 1 elite, cluster (level 4+)

SKELETON GROUPS:
  - skeleton_patrol     : 3 skeletons, wave formation (level 3+)
  - skeleton_horde      : 8 skeletons, wave formation (level 5+)

MIXED/OTHER:
  - slime_colony        : 8 slimes, cluster (level 2+)
  - spider_nest         : 6 spiders, loose (level 3+)
  - bat_swarm           : 12 bats, chaos (level 3+)
  - mixed_dungeon_mob   : 3 skeletons, 2 spiders, 2 zombies (level 5+)
  - undead_legion       : 10 skeletons, 2 wraiths, chaos (level 7+)
  - orc_raiders         : 4 orcs, wave (level 6+)

FORMATIONS:
  - loose    : Spread out in area
  - cluster  : Tight group around center
  - wave     : Line formation
  - chaos    : Random scatter in large area

===========================================
*/

// Default spawn config for maps without explicit configuration

    // ... rest of your code



// Default spawn config for maps without explicit configuration
const defaultSpawnConfig = {
    spawnRate: 0.08,
    maxEnemies: 8,
    singleSpawns: [
        { type: 'goblin', weight: 0.5 },
        { type: 'slime', weight: 0.3 },
        { type: 'bat', weight: 0.2 }
    ],
    encounters: ['goblin_scouts', 'goblin_patrol'],
    encounterChance: 0.3
};

// DQ3-Style progression map configuration
const mapSpawnConfig = {
    // ACT 1 - Starting Area (Levels 1-8)
    'Overworld': {
        spawnRate: 0.00,
        maxEnemies: 6,
        singleSpawns: [
            { type: 'slime', weight: 0.7 },
            { type: 'bat', weight: 0.3 }
        ],
        encounters: ['slime_colony'],
        encounterChance: 0.2
    },
    
    'Forest': {
        spawnRate: 0.10,
        maxEnemies: 10,
        singleSpawns: [
            { type: 'goblin', weight: 0.5 },
            { type: 'spider', weight: 0.3 },
            { type: 'bat', weight: 0.2 }
        ],
        encounters: ['goblin_patrol', 'spider_nest', 'bat_swarm'],
        encounterChance: 0.5
    },
    
    // ACT 1 - First Dungeon
    'Dungeon1': {
        spawnRate: 0.12,
        maxEnemies: 10,
        singleSpawns: [
            { type: 'goblin', weight: 0.4 },
            { type: 'skeleton', weight: 0.3 },
            { type: 'spider', weight: 0.3 }
        ],
        encounters: ['goblin_patrol', 'skeleton_patrol'],
        encounterChance: 0.5
    },
    
    // Safe zones - no spawns
    'town': { spawnRate: 0, maxEnemies: 0, singleSpawns: [], encounters: [] },
    'Video_Store': { spawnRate: 0, maxEnemies: 0, singleSpawns: [], encounters: [] },
    'Bar': { spawnRate: 0, maxEnemies: 0, singleSpawns: [], encounters: [] }
};

// Main spawn attempt function
function trySpawnEnemy() {
    // Get spawn config, use default if map not configured yet
    const spawnConfig = mapSpawnConfig[gameState.currentMap] || defaultSpawnConfig;
    
    // No spawns if rate is 0
    if (spawnConfig.spawnRate === 0) return;
    
    // At max enemies
    if (gameState.enemies.length >= spawnConfig.maxEnemies) return;
    
    // Spawn roll
    if (Math.random() < spawnConfig.spawnRate) {
        // Encounter vs single spawn
        if (Math.random() < spawnConfig.encounterChance && spawnConfig.encounters.length > 0) {
            // ENCOUNTER SPAWN
            const viableEncounters = getAvailableEncountersForLevel(
                gameState.player.level, 
                spawnConfig.encounters
            );
            
            if (viableEncounters.length === 0) {
                spawnSingleEnemy();
                return;
            }
            
            const encounterType = selectRandomEncounter(viableEncounters);
            
            // Find spawn location far from player
            let attempts = 0;
            while (attempts < 20) {
                const x = Math.floor(Math.random() * gameState.world.width);
                const y = Math.floor(Math.random() * gameState.world.height);
                const distX = Math.abs(x - gameState.player.x);
                const distY = Math.abs(y - gameState.player.y);
                const distance = Math.sqrt(distX * distX + distY * distY);
                
                if (distance >= 8 && isValidSpawnPosition(x, y)) {
                    spawnEncounter(encounterType, x, y);
                    break;
                }
                attempts++;
            }
        } else {
            // SINGLE SPAWN
            spawnSingleEnemy();
        }
    }
}

// Spawn a single random enemy
function spawnSingleEnemy() {
    // Get spawn config, use default if map not configured yet
    const spawnConfig = mapSpawnConfig[gameState.currentMap] || defaultSpawnConfig;
    
    if (!spawnConfig || spawnConfig.singleSpawns.length === 0) return;
    
    // Weighted random selection
    const totalWeight = spawnConfig.singleSpawns.reduce((sum, s) => sum + s.weight, 0);
    let roll = Math.random() * totalWeight;
    let selectedType = spawnConfig.singleSpawns[0].type;
    
    for (const spawn of spawnConfig.singleSpawns) {
        roll -= spawn.weight;
        if (roll <= 0) {
            selectedType = spawn.type;
            break;
        }
    }
    
    // Find valid spawn position
    let attempts = 0;
    while (attempts < 20) {
        const x = Math.floor(Math.random() * gameState.world.width);
        const y = Math.floor(Math.random() * gameState.world.height);
        const distX = Math.abs(x - gameState.player.x);
        const distY = Math.abs(y - gameState.player.y);
        const distance = Math.sqrt(distX * distX + distY * distY);
        
        if (distance >= 5 && isValidSpawnPosition(x, y)) {
            if (!enemyDatabase[selectedType]) {
                console.error(`Missing enemy in database: ${selectedType}`);
                return;
            }
            spawnEnemyAt(selectedType, x, y);
            addMessage(`${enemyDatabase[selectedType].name} appears!`);
            break;
        }
        attempts++;
    }
}

console.log('=== SPAWNING.JS LOADED ===');
console.log(`Configured ${Object.keys(mapSpawnConfig).length} map spawn tables`);