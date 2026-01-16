// ===== GAME STATE =====




const journalImages = {};



// Initialize weather state structure
function initWeatherState() {
    return {
        type: 'none',
        particles: [],
        animationFrame: null,
        lastUpdate: 0,
        lightningTimer: 0
    };
}
// ===== BALANCE KNOBS (tweak difficulty on the fly) =====
const BALANCE_KNOBS = {
    enemyDamageMultiplier: 1.0,      // Enemy attacks deal X times damage
    playerHealingMultiplier: 1.0,    // Healing effects X times as effective
    enemyHpMultiplier: 1.0,          // Enemies spawn with X times HP
    magicItemChance: 0.35,           // Base chance for magic+ items (35%)
    xpMultiplier: 1.0,               // XP gains X times as much
    goldMultiplier: 1.0,             // Gold drops X times as much
    potionEffectiveness: 1.0         // Potions heal X times as much
};

function loadJournalImage(id, path) {
    const img = new Image();
    img.onload = () => {
        console.log(`✓ Loaded journal image: ${id} from ${path}`);
    };
    img.onerror = () => {
        console.error(`✗ FAILED to load journal image: ${id} from ${path}`);
    };
    img.src = path;
    journalImages[id] = img;
    return img;
}

// Load your journal images
loadJournalImage('goblin_full', 'journal-images/goblin.png');
loadJournalImage('video_store', 'journal-images/video_store.png');
loadJournalImage('HillsInt', 'journal-images/HillsInt.png');
loadJournalImage('Mansfield', 'journal-images/Mansfield.png');

// etc.


let gameState = {
    player: { 
		name: "Nate",
        x: 10, y: 7, 
        hp: CONFIG.player.startHP, 
        maxHp: CONFIG.player.startHP, 
        mp: CONFIG.player.startMP, 
        maxMp: CONFIG.player.startMP, 
        gold: CONFIG.player.startGold, 
        inventory: [], 
        knownSpells: [], 
        baseStats: { ...CONFIG.player.baseStats }, 
        weaponCooldown: 0, 
        stepCount: 0, 
        xp: 0, 
        level: 1, 
        barrier: 0, 
        barrierTurns: 0 
    },
	revealedSpecials: {},
    equipment: { weapon: null, armor: null, accessory: null, special: null },
	exploredTiles: {},  // Stores explored tiles per map
    fogOfWarEnabled: true,  // Debug toggle
    explorationRadius: 5,  // How far player can see
	weaponPreview: {
        active: false,
        tiles: []  // Array of {x, y} coordinates
    },
    combat: { inCombat: false, turnCount: 0 },
    spellCasting: { active: false, selectedSpellIndex: 0, pendingSpell: null },
    enemies: [], 
    npcs: [],
    lootBags: [], 
	flags: {},
    selectedItemIndex: -1, 
    collectedTreasures: {}, 
    inventoryOpen: false, 
    shopOpen: false,
    shopMode: 'buy',
    shopSelectedIndex: 0,
    currentShopkeeper: null,
    currentMap: 'Overworld', 
    mapStates: {},
	//journal: { open: false, entries: [] },  
	journal: { 
    open: false, 
    entries: [], 
    currentPage: 0,
    journalWidth: 16,  // tiles
    journalHeight: 11  // tiles
	},
    viewMode: 'game', 
	//=============================
    restSystem: {
        lastRestDay: 0,
        canCamp: true,
        campSupplies: 3
    },
    pendingInnRest: null,
	//=============================
	
	world: { width: 20, height: 15, tiles: [] },
	
	weather: {
        type: 'none',
        particles: [],
        animationFrame: null,
        lastUpdate: 0,
        lightningTimer: 0
    }

	
	
};



// ===== LDTK LOADER =====
async function loadLDtkProject(jsonPath) {
    try {
        const response = await fetch(jsonPath);
        const project = await response.json();
        
        const convertedMaps = {};
        const convertedTransitions = {};
        const convertedEnemySpawns = {};
        const convertedNPCSpawns = {};
        const convertedTreasures = {};
        const convertedSpecialLocations = {};
        
        project.levels.forEach(level => {
            const mapId = level.identifier;
            console.log('Loading level:', mapId);  
            // Find layers
            const tileLayer = level.layerInstances.find(l => l.__identifier === 'Tiles');
            const entityLayer = level.layerInstances.find(l => l.__identifier === 'Entities');
            
            if (!tileLayer) {
                console.warn(`No Tiles layer found for ${mapId}`);
                return;
            }
            
            // Convert tiles
            const width = tileLayer.__cWid;
            const height = tileLayer.__cHei;
            const tiles = [];
            
            for (let y = 0; y < height; y++) {
                let row = '';
                for (let x = 0; x < width; x++) {
                    const idx = x + y * width;
                    const tileValue = tileLayer.intGridCsv[idx];
                    row += LDTK_TO_CHAR[tileValue] || '.';
                }
                tiles.push(row);
            }
            
            // Get custom fields from level (MOVED HERE)
            const getLevelField = (name, defaultValue) => {
                const field = level.fieldInstances?.find(f => f.__identifier === name);
                return field?.__value ?? defaultValue;
            };
            
            // Store map data (USING CUSTOM FIELDS)
            convertedMaps[mapId] = {
                name: level.identifier,
                tiles: tiles,
                spawnRate: getLevelField('spawnRate', 0.08),
                spawnTypes: getLevelField('spawnTypes', ['goblin']),
                spawnWeights: getLevelField('spawnWeights', [1.0]),
                maxEnemies: getLevelField('maxEnemies', 8)
            };
			
			console.log(`${mapId} spawn config:`, convertedMaps[mapId].spawnTypes, convertedMaps[mapId].spawnWeights);
            
            // Initialize empty entity arrays
            convertedTransitions[mapId] = {};
            convertedEnemySpawns[mapId] = [];
            convertedNPCSpawns[mapId] = [];
            convertedTreasures[mapId] = {};
            convertedSpecialLocations[mapId] = {};
            
			
            // Convert entities if they exist
            if (entityLayer) {
                entityLayer.entityInstances.forEach(entity => {
                    const tileX = Math.floor(entity.px[0] / tileLayer.__gridSize);
                    const tileY = Math.floor(entity.px[1] / tileLayer.__gridSize);
                    const key = `${tileX},${tileY}`;
                    
                    // Helper to get field value
                    const getField = (name) => {
                        const field = entity.fieldInstances.find(f => f.__identifier === name);
                        return field ? field.__value : null;
                    };
                    
                    switch(entity.__identifier) {
                        case 'Transition':
                            convertedTransitions[mapId][key] = {
                                map: getField('to_map') || '',
                                x: getField('to_x') || 10,
                                y: getField('to_y') || 10,
                                message: getField('message') || ''
                            };
                            break;
                            
                        case 'NPC':
                            convertedNPCSpawns[mapId].push({
                                type: getField('npc_type') || 'villager',
                                x: tileX,
                                y: tileY
                            });
                            break;
                            
                        case 'Enemy':
                            convertedEnemySpawns[mapId].push({
                                type: getField('enemy_type') || 'goblin',
                                x: tileX,
                                y: tileY
                            });
                            break;
                            
                        case 'Treasure':
                            convertedTreasures[mapId][key] = {
                                gold: getField('gold') || 0,
                                items: getField('items') || []
                            };
                            break;
                            
                        case 'Special':
							const msg = getField('message');
							const requiresSearch = getField('requires_search') || false;
							const journalEntry = getField('journal_entry') || false;
							const journalTitle = getField('journal_title') || 'Discovery';
							if (msg) {
								convertedSpecialLocations[mapId][key] = {
								message: msg,
								requiresSearch: requiresSearch,
								journalEntry: journalEntry,
								journalTitle: journalTitle
								};
							}
						break;
                    }
                });
            }
			//===========
			if (entityLayer) {
				entityLayer.entityInstances.forEach(entity => {
					if (entity.__identifier === 'Treasure') {
						const tileX = Math.floor(entity.px[0] / tileLayer.__gridSize);
						const tileY = Math.floor(entity.px[1] / tileLayer.__gridSize);
            
            // Inject chest tile into the map
					tiles[tileY] = tiles[tileY].substring(0, tileX) + '$' + tiles[tileY].substring(tileX + 1);
					}
				});
			}
			//===========
        });
        
        return {
            maps: convertedMaps,
            mapTransitions: convertedTransitions,
            enemySpawns: convertedEnemySpawns,
            npcSpawns: convertedNPCSpawns,
            treasureContents: convertedTreasures,
            specialLocations: convertedSpecialLocations
        };
    } catch (error) {
        console.error('Failed to load LDtk project:', error);
        return null;
    }
}



	

// ===== INITIALIZATION =====
async function initializeGameWithLDtk() {
    const ldtkData = await loadLDtkProject('maps.ldtk');
    
    if (ldtkData) {
        // Load from LDtk
        maps = ldtkData.maps;
        mapTransitions = ldtkData.mapTransitions;
        enemySpawns = ldtkData.enemySpawns;
        npcSpawns = ldtkData.npcSpawns;
        treasureContents = ldtkData.treasureContents;
        specialLocations = ldtkData.specialLocations;
    } else {
        // Fallback to defaults if LDtk fails
        console.warn('Failed to load LDtk, using fallback map');
        maps = {
            'Overworld': {
                name: 'Overworld',
                tiles: Array(15).fill('.'.repeat(20)),
                spawnRate: 0.08,
                spawnTypes: ['goblin'],
                spawnWeights: [1.0],
                maxEnemies: 8
            }
        };
        mapTransitions = { 'Overworld': {} };
        enemySpawns = { 'Overworld': [] };
        npcSpawns = { 'Overworld': [] };
        treasureContents = { 'Overworld': {} };
        specialLocations = { 'Overworld': {} };
    }
    
    initGame();
}



function initGame() {
	const playerName = prompt("Hey, buddy! What's your name?", "Nate");
    gameState.player.name = playerName || "Nate"; // Fallback if they cancel
	gameState.dayCounter = 1;
    loadMap('Overworld');
    renderWorld();
	updateExploration()
    updateStatus();
    addMessage("Mansfield, Ohio. 1985.");
    addMessage("BUMP enemies or use TACTICAL mode (C)!");
    addMessage("Another in a long string of days.");
    
    addJournalEntry('First Blood', [
        { type: 'text', content: 'Encountered a fearsome goblin. Barely escaped!' },
        { type: 'image', imageId: 'goblin_full', width: 120, height: 120 },
        { type: 'text', content: 'Must grow stronger to survive these lands.' }
    ]);
}

// ===== MAP MANAGEMENT =====
function loadMap(mapName) {
    
	if (gameState.currentMap && gameState.currentMap !== mapName) {
        gameState.mapStates[gameState.currentMap] = [...gameState.world.tiles];
    }
    gameState.currentMap = mapName;
	
	const mapData = maps[mapName];
	
	console.log('mapData:', mapData);
	console.log('mapData.tiles type:', typeof mapData.tiles);
	console.log('mapData.tiles length:', mapData.tiles ? mapData.tiles.length : 'undefined');
	console.log('First tile row:', mapData.tiles ? mapData.tiles[0] : 'none');
	
	gameState.world.width = mapData.tiles[0].length;
    gameState.world.height = mapData.tiles.length;
	
   
    if (gameState.mapStates[mapName]) {
        gameState.world.tiles = [...gameState.mapStates[mapName]];
    } else {
        gameState.world.tiles = [...mapData.tiles];
        gameState.mapStates[mapName] = [...mapData.tiles];
    }
    gameState.enemies = [];
    gameState.npcs = [];
    gameState.lootBags = [];
    
    const spawns = enemySpawns[mapName];
    if (spawns) {
        spawns.forEach(spawn => { spawnEnemyAt(spawn.type, spawn.x, spawn.y); });
    }
    
    const npcSpawn = npcSpawns[mapName];
    if (npcSpawn) {
        npcSpawn.forEach(spawn => { spawnNPCAt(spawn.type, spawn.x, spawn.y); });
    }
    
    document.getElementById('currentMapName').textContent = mapData.name;
	document.getElementById('currentMapName').textContent = getMapDisplayName(mapName);
}


function checkTransition() {
    const key = `${gameState.player.x},${gameState.player.y}`;
    const trans = mapTransitions[gameState.currentMap];
    if (trans && trans[key]) {
        const t = trans[key];
        
        // Fade out before transition
        fadeToBlack(() => {
            addMessage("===================");
            addMessage(t.message);
            addMessage("===================");
            loadMap(t.map);
            gameState.player.x = t.x;
            gameState.player.y = t.y;
            
            // Fade in after transition
            setTimeout(() => {
                clearFade();
                renderWorld();
                updateExploration();
                updateStatus();
            }, 150);
        });
    }
}

// ===== SPAWNING =====
function spawnEnemyAt(type, x, y) {
    const t = enemyDatabase[type];
    gameState.enemies.push({
        id: Math.random().toString(36).substr(2, 9), 
        type: type, 
        name: t.name, 
        sprite: t.sprite, 
        x: x, 
        y: y,
        hp: Math.floor(t.hp * BALANCE_KNOBS.enemyHpMultiplier),        // FIXED: was eData, now t
        maxHp: Math.floor(t.maxHp * BALANCE_KNOBS.enemyHpMultiplier),  // FIXED: was eData, now t
        strength: t.strength, 
        vitality: t.vitality, 
        intelligence: t.intelligence,
        spirit: t.spirit, 
        agility: t.agility, 
        luck: t.luck, 
        speed: t.speed, 
        aggressive: t.aggressive
    });
}

function spawnNPCAt(type, x, y) {
    // Get NPC data from new dialogue system
    const npcData = getNPCData(type);
    
    if (!npcData) {
        console.error(`NPC "${type}" not found in dialogue database`);
        console.log('Available NPCs:', Object.keys(dialogueDatabase));
        return;
    }
    
    gameState.npcs.push({
        id: Math.random().toString(36).substr(2, 9),
        type: type,  // This is the unique NPC ID we look up in dialogueDatabase
        name: npcData.name,
        sprite: npcData.sprite,
        x: x,
        y: y
        // No more dialogue stored here - we look it up dynamically!
    });
}



function spawnEncounter(encounterType, centerX, centerY) {
    const encounter = encounterTypes[encounterType];
    if (!encounter) {
        console.error(`Unknown encounter type: ${encounterType}`);
        return;
    }
    
    // Calculate total enemy count
    const totalCount = encounter.enemies.reduce((sum, e) => sum + e.count, 0);
    
    // Generate formation positions
    const positions = generateFormation(encounter.formation, centerX, centerY, totalCount);
    
    if (positions.length === 0) {
        console.warn('Could not find valid positions for encounter');
        return;
    }
    
    // Spawn enemies
    let posIndex = 0;
    let spawnedCount = 0;
    
    encounter.enemies.forEach(enemyGroup => {
        for (let i = 0; i < enemyGroup.count; i++) {
            if (posIndex < positions.length) {
                const pos = positions[posIndex++];
                spawnEnemyAt(enemyGroup.type, pos.x, pos.y);
                spawnedCount++;
            }
        }
    });
    
    if (spawnedCount > 0) {
        addMessage(`${spawnedCount} enemies appear!`);
    }
}

function generateFormation(formationType, centerX, centerY, count) {
    const positions = [];
    const maxAttempts = 50;
    
    switch(formationType) {
        case 'cluster': // Tight group around center
            const radius = Math.ceil(Math.sqrt(count) / 2) + 1;
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    if (positions.length >= count) break;
                    const x = centerX + dx;
                    const y = centerY + dy;
                    if (isValidSpawnPosition(x, y)) {
                        positions.push({ x, y });
                    }
                }
                if (positions.length >= count) break;
            }
            break;
            
        case 'wave': // Line formation
            const direction = Math.random() > 0.5 ? 'horizontal' : 'vertical';
            const lineLength = Math.ceil(count / 2);
            
            for (let row = 0; row < 3 && positions.length < count; row++) {
                for (let i = -lineLength; i <= lineLength && positions.length < count; i++) {
                    const x = direction === 'horizontal' ? centerX + i : centerX + row;
                    const y = direction === 'vertical' ? centerY + i : centerY + row;
                    if (isValidSpawnPosition(x, y)) {
                        positions.push({ x, y });
                    }
                }
            }
            break;
            
        case 'loose': // Spread out in area
            let attempts = 0;
            while (positions.length < count && attempts < maxAttempts) {
                const x = centerX + Math.floor(Math.random() * 10) - 5;
                const y = centerY + Math.floor(Math.random() * 10) - 5;
                if (isValidSpawnPosition(x, y) && !positions.some(p => p.x === x && p.y === y)) {
                    positions.push({ x, y });
                }
                attempts++;
            }
            break;
            
        case 'chaos': // Random scatter in large area
            let chaosAttempts = 0;
            while (positions.length < count && chaosAttempts < maxAttempts) {
                const x = centerX + Math.floor(Math.random() * 16) - 8;
                const y = centerY + Math.floor(Math.random() * 16) - 8;
                if (isValidSpawnPosition(x, y) && !positions.some(p => p.x === x && p.y === y)) {
                    positions.push({ x, y });
                }
                chaosAttempts++;
            }
            break;
    }
    
    return positions;
}

function isValidSpawnPosition(x, y) {
    // Check bounds
    if (x < 0 || x >= gameState.world.width || y < 0 || y >= gameState.world.height) {
        return false;
    }
    
    // Check tile passability
    const tile = gameState.world.tiles[y][x];
    if (!tileTypes[tile]?.passable) {
        return false;
    }
    
    // Check if enemy already there
    if (gameState.enemies.some(e => e.x === x && e.y === y)) {
        return false;
    }
    
    // Check if player there
    if (gameState.player.x === x && gameState.player.y === y) {
        return false;
    }
    
    // Check if NPC there
    if (gameState.npcs.some(npc => npc.x === x && npc.y === y)) {
        return false;
    }
    
    return true;
}

function getAvailableEncountersForLevel(playerLevel, encounterList) {
    return Object.entries(encounterTypes)
        .filter(([id, encounter]) => {
            return encounter.minPlayerLevel <= playerLevel && 
                   encounterList.includes(id);
        })
        .map(([id, encounter]) => ({ id, weight: encounter.weight }));
}

function selectRandomEncounter(encounters) {
    const totalWeight = encounters.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;
    
    for (const encounter of encounters) {
        roll -= encounter.weight;
        if (roll <= 0) {
            return encounter.id;
        }
    }
    
    return encounters[0]?.id;
}


// Convert sprite data URLs to Image objects (do this once at startup)
const spriteImages = {};
Object.keys(sprites).forEach(key => {
    const img = new Image();
    img.src = sprites[key];
    spriteImages[key] = img;
});




/**
 * Triggers a cascading reveal by setting a long, staggered timer for each distance tier.
 * Only the setTimeout call is allowed to mark a tile as explored.
 * @param {string[]} newTilesToReveal - An array of map keys (e.g., "15,20")
 */
function applyReveals(newTilesToReveal) {
    if (newTilesToReveal.length === 0) return;
    
	fogAnimationInProgress = true;
	
    const mapKey = gameState.currentMap;
    
    // 1. Group tiles by distance tier
    const groupedByDistance = new Map();
    newTilesToReveal.forEach(key => {
        const [ax, ay] = key.split(',').map(Number);
        
        // Calculate the distance (rounded to the nearest whole tile for tiering)
        const distance = Math.round(Math.hypot(ax - gameState.player.x, ay - gameState.player.y));
        
        if (!groupedByDistance.has(distance)) {
            groupedByDistance.set(distance, []);
        }
        groupedByDistance.get(distance).push(key);
    });
    
    // 2. Sort the distance tiers
    const sortedDistances = Array.from(groupedByDistance.keys()).sort((a, b) => a - b);

    let delay = 0;
    // Set a very obvious delay, let's use 500ms (half a second) per tier for testing.
    // Once this works, you can set it back to a lower value like 100 or 150.
    const tierDelay = 500; 
    
    sortedDistances.forEach((distance, index) => {
        const tilesInTier = groupedByDistance.get(distance);

        // Schedule the reveal for all tiles in this tier
        setTimeout(() => {
            if (gameState.currentMap !== mapKey) return; // Safety check
            
            // !!! KEY CHANGE: Mark tiles as explored HERE, when the timer fires !!!
            tilesInTier.forEach(key => {
                gameState.exploredTiles[mapKey].add(key);
            });
            
            // Only call renderWorld() once per tier
            renderWorld(); 
			if (index === sortedDistances.length - 1) {
                fogAnimationInProgress = false;
            }
        }, delay);
        
        // Increment the delay for the next, farther tier
        delay += tierDelay;
    });
}

/**
 * Checks for tiles that *should* be revealed based on the circular radius.
 * These tiles are NOT marked as explored yet, only queued for animation.
 */
function updateExploration() {
    const mapKey = gameState.currentMap;
    const mapData = maps[mapKey];

    if (!mapData) return;
    
    if (!gameState.exploredTiles[mapKey]) {
        gameState.exploredTiles[mapKey] = new Set();
    }
    const explored = gameState.exploredTiles[mapKey];
    const newTilesToReveal = [];
    const radius = 5; // Fixed radius
    
    const mapWidth = mapData.tiles[0].length;
    const mapHeight = mapData.tiles.length;
    
    // FOW Disabled Logic: Mark everything as explored and return
    if (!gameState.fogOfWarEnabled) {
         for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                explored.add(`${x},${y}`);
            }
        }
        return;
    }

    // Iterate through a square region that encompasses the circle
    for (let yOffset = -radius; yOffset <= radius; yOffset++) {
        for (let xOffset = -radius; xOffset <= radius; xOffset++) {
            
            // Circular distance check
            if (Math.hypot(xOffset, yOffset) > radius) {
                continue; 
            }
            
            const tileX = gameState.player.x + xOffset;
            const tileY = gameState.player.y + yOffset;
            const key = `${tileX},${tileY}`;

            // Check map bounds
            if (tileX >= 0 && tileX < mapWidth && tileY >= 0 && tileY < mapHeight) {
                
                // If the tile is NOT explored, add it to the queue.
                if (!explored.has(key)) {
                    newTilesToReveal.push(key);
                }
                
                // !!! KEY CHANGE: DO NOT call explored.add(key) here !!!
                // The tile will only be added to 'explored' inside the applyReveals setTimeout.
            }
        }
    }
    
    // Pass only the new tiles to the cascade scheduler
    if (newTilesToReveal.length > 0) {
        applyReveals(newTilesToReveal);
    }
}


// ===== STATS & STATUS =====
function calculateStats() {
    const stats = { ...gameState.player.baseStats };
    
    Object.values(gameState.equipment).forEach(itemId => {
        if (itemId && itemDatabase[itemId]) {
            const item = itemDatabase[itemId];
            if (item.stats) {
                // Use || 0 to handle undefined stats
                stats.strength += (item.stats.strength || 0);
                stats.vitality += (item.stats.vitality || 0);
                stats.intelligence += (item.stats.intelligence || 0);
                stats.spirit += (item.stats.spirit || 0);
                stats.agility += (item.stats.agility || 0);
                stats.luck += (item.stats.luck || 0);
            }
        }
    });
    
    return stats;
}

function updateStatus() {
    const stats = calculateStats();
    document.getElementById('playerHp').textContent = gameState.player.hp || 0;
    document.getElementById('playerMaxHp').textContent = gameState.player.maxHp || 0;
    document.getElementById('playerMp').textContent = gameState.player.mp || 0;
    document.getElementById('playerMaxMp').textContent = gameState.player.maxMp || 0;
    document.getElementById('playerLevel').textContent = gameState.player.level || 1;
    //document.getElementById('statusStrength').textContent = stats.strength || 0;
	document.getElementById('statusStrength').textContent = `${gameState.player.x},${gameState.player.y}`;
    document.getElementById('playerGold').textContent = gameState.player.gold || 0;
    document.getElementById('playerXp').textContent = gameState.player.xp || 0;
    document.getElementById('playerXpNext').textContent = getXpForNextLevel();
}

function getXpForNextLevel() {
    return CONFIG.leveling.xpFormula(gameState.player.level);
}


function addMessage(msg, color = null) {
    const mb = document.getElementById('messageBox');
    if (color) {
        mb.innerHTML += `<span style="color: ${color};">${msg}</span><br>`;
    } else {
        mb.innerHTML += msg + '<br>';
    }
    const lines = mb.innerHTML.split('<br>');
    if (lines.length > 9) {
        mb.innerHTML = lines.slice(-9).join('<br>');
    }
	mb.scrollTop = mb.scrollHeight;
}

// ===== LEVEL UP =====
function checkLevelUp() {
    let xpNeeded = getXpForNextLevel();
    while (gameState.player.xp >= xpNeeded) {
        gameState.player.level++;
        gameState.player.xp -= xpNeeded;
        addMessage("=== LEVEL UP! ===");
        addMessage(`Now level ${gameState.player.level}!`);
        const gains = CONFIG.leveling.statGains;
        gameState.player.maxHp += gains.maxHp;
        gameState.player.maxMp += gains.maxMp;
        gameState.player.hp = gameState.player.maxHp;
        gameState.player.mp = gameState.player.maxMp;
        gameState.player.baseStats.strength += gains.strength;
        gameState.player.baseStats.vitality += gains.vitality;
        gameState.player.baseStats.intelligence += gains.intelligence;
        gameState.player.baseStats.spirit += gains.spirit;
        gameState.player.baseStats.agility += gains.agility;
        if (gameState.player.level % 5 === 0) {
            gameState.player.baseStats.luck += 1;
        }
        const milestones = CONFIG.leveling.milestones;
        if (milestones[gameState.player.level]) {
            const bonus = milestones[gameState.player.level];
            addMessage("*** MILESTONE! ***");
            if (bonus.maxHp) { gameState.player.maxHp += bonus.maxHp; gameState.player.hp = gameState.player.maxHp; addMessage(`+${bonus.maxHp} Max HP!`); }
            if (bonus.maxMp) { gameState.player.maxMp += bonus.maxMp; gameState.player.mp = gameState.player.maxMp; addMessage(`+${bonus.maxMp} Max MP!`); }
            if (bonus.strength) { gameState.player.baseStats.strength += bonus.strength; addMessage(`+${bonus.strength} STR!`); }
            if (bonus.vitality) { gameState.player.baseStats.vitality += bonus.vitality; addMessage(`+${bonus.vitality} VIT!`); }
            if (bonus.intelligence) { gameState.player.baseStats.intelligence += bonus.intelligence; addMessage(`+${bonus.intelligence} INT!`); }
            if (bonus.spirit) { gameState.player.baseStats.spirit += bonus.spirit; addMessage(`+${bonus.spirit} SPR!`); }
        }
        const luckGain = gameState.player.level % 5 === 0 ? " LUK+1" : "";
        addMessage(`HP+${gains.maxHp} MP+${gains.maxMp} STR+${gains.strength} VIT+${gains.vitality} INT+${gains.intelligence} SPR+${gains.spirit} AGI+${gains.agility}${luckGain}`);
        addMessage("HP and MP restored!");
        xpNeeded = getXpForNextLevel();
    }
    updateStatus();
    if (gameState.inventoryOpen) { updateInventoryDisplay(); }
}

//=======PLAYER MOVEMENT=========

function movePlayer(dx, dy) {
	const newX = gameState.player.x + dx;
    const newY = gameState.player.y + dy;
	const key = `${newX},${newY}`;
	const locs = specialLocations[gameState.currentMap];
	
	if (gameState.fadeInProgress) return;
	
	 if (gameState.pendingInnRest) {
        gameState.pendingInnRest = null;
        addMessage("Cancelled rest.");
    }
	
	
	if (locs && locs[key]) {
    const special = locs[key];
    const revealKey = `${gameState.currentMap}:${key}`;
		if (!special.requiresSearch && !gameState.revealedSpecials[revealKey]) {
			addMessage(special.message);
			
			// Add journal entry if flagged
			if (special.journalEntry) {
				addJournalEntry(special.journalTitle, [
					{ type: 'text', content: special.message }
				]);
			}
			
			gameState.revealedSpecials[revealKey] = true;
		}
	}
   
    if (newX < 0 || newX >= gameState.world.width || newY < 0 || newY >= gameState.world.height) {
        addMessage("Cannot go that way.");
        return;
    }
    const tileChar = gameState.world.tiles[newY][newX];
    const tileType = tileTypes[tileChar];
    if (!tileType.passable) {
        addMessage(`${tileType.name} blocks path.`);
        return;
    }
    const enemy = gameState.enemies.find(e => e.x === newX && e.y === newY);
    if (enemy) {
        if (gameState.equipment.weapon) {
            addMessage(`Bump attack ${enemy.name}!`);
            const stats = calculateStats();
            const hitChance = 0.7 + (stats.agility * 0.02);
            if (Math.random() < hitChance) {
                dealDamage(gameState.player, enemy, true);
                if (enemy.hp > 0) {
                    addMessage(`${enemy.name} counters!`);
                    dealDamage(enemy, gameState.player, false);
                }
            } else {
                addMessage("Miss!");
                dealDamage(enemy, gameState.player, false);
            }
            enemyTurn();
            if (gameState.player.weaponCooldown > 0) gameState.player.weaponCooldown--;
            renderWorld();
            updateStatus();
        } else {
            addMessage(`${enemy.name} blocks! Need weapon.`);
        }
        return;
    }
    gameState.player.x = newX;
    gameState.player.y = newY;
	checkEvents(gameState);
	updateExploration();
    checkTransition();
  
	
	
    //if (locs && locs[key]) addMessage(locs[key]);
    if (tileType.name === 'treasure chest') addMessage("Chest here! Press A.");
    const loot = gameState.lootBags.find(l => l.x === newX && l.y === newY);
    if (loot) addMessage("Loot here! Press A.");
    enemyTurn();
    if (gameState.player.weaponCooldown > 0) gameState.player.weaponCooldown--;
    gameState.player.stepCount++;
    //if (gameState.player.stepCount % CONFIG.spawning.checkInterval === 0) trySpawnEnemy();
	if (gameState.player.stepCount % 1 === 0) trySpawnEnemy();
	if (gameState.combat.inCombat && gameState.weaponPreview.active) {
        updateWeaponPreview();
    }
    renderWorld();
    updateStatus();
} 

function waitTurn() {
    addMessage("Waiting...");
    enemyTurn();
    if (gameState.player.weaponCooldown > 0) gameState.player.weaponCooldown--;
    renderWorld();
    updateStatus();
}

// ===== ACTIONS =====



function performAction() {
    const x = gameState.player.x;
    const y = gameState.player.y;
    
    // Check for loot bags
    if (handleLootBagPickup(x, y)) return;
    
    // Check for treasure chests
    if (handleTreasureChest(x, y)) return;
    
    // Check for adjacent NPCs
    if (handleNPCInteraction(x, y)) return;
    
    // Nothing found
    addMessage("Nothing here.");
    checkEvents(gameState);
}

// ===== LOOT BAG PICKUP =====
function handleLootBagPickup(x, y) {
    const lootIdx = gameState.lootBags.findIndex(l => l.x === x && l.y === y);
    if (lootIdx === -1) return false;
    
    const loot = gameState.lootBags[lootIdx];
    addMessage("Picked up loot!");
    
    if (loot.gold > 0) { 
        gameState.player.gold += loot.gold; 
        addMessage(`+${loot.gold} gold!`); 
    }
    
    if (loot.items.length > 0) {
        loot.items.forEach(itemId => {
            if (gameState.player.inventory.length >= CONFIG.player.maxInventorySize) {
                addMessage(`Inventory full! Left ${itemDatabase[itemId].name} on ground.`);
                gameState.lootBags.push({
                    x: x,
                    y: y,
                    gold: 0,
                    items: [itemId]
                });
            } else {
                gameState.player.inventory.push(itemId);
                const item = itemDatabase[itemId];
                const color = RARITY_COLORS[item.rarity || 'common'];
                addMessage(`Found ${item.name}!`, color);
            }
        });
    }
    
    gameState.lootBags.splice(lootIdx, 1);
    renderWorld();
    updateStatus();
    return true;
}

// ===== TREASURE CHEST OPENING =====
function handleTreasureChest(x, y) {
    const tileChar = gameState.world.tiles[y][x];
    const tileType = tileTypes[tileChar];
    
    if (tileType.name !== 'treasure chest') return false;
    
    const key = `${x},${y}`;
    
    // Initialize treasure tracking
    if (!gameState.collectedTreasures[gameState.currentMap]) {
        gameState.collectedTreasures[gameState.currentMap] = [];
    }
    
    // Already opened?
    if (gameState.collectedTreasures[gameState.currentMap].includes(key)) {
        addMessage("Already opened.");
        return true;
    }
    
    // Get chest contents
    const mapTreas = treasureContents[gameState.currentMap];
    const treas = mapTreas ? mapTreas[key] : null;
    
    if (!treas) {
        addMessage("Empty chest!");
        return true;
    }
    
    // Flavor text
    const chestMessages = [
        "The hinges creak as you pry it open...",
        "Jackpot! Your heart races.",
        "Inside: treasure. Outside: probably monsters.",
        "You pocket the loot nervously."
    ];
    addMessage(chestMessages[Math.floor(Math.random() * chestMessages.length)]);
    
    // Award gold
    if (treas.gold > 0) { 
        gameState.player.gold += treas.gold; 
        addMessage(`+${treas.gold} gold!`); 
    }
    
    // Award items
    if (treas.items && treas.items.length > 0) {
        treas.items.forEach(itemId => {
            // Check for chest drop loot strings
            if (itemId.startsWith('chest_drop_loot')) {
                handleChestDropLoot(itemId);
            } else {
                handleRegularChestItem(itemId);
            }
        });
    }
    
    // Mark as collected and remove chest
    gameState.collectedTreasures[gameState.currentMap].push(key);
    gameState.world.tiles[y] = gameState.world.tiles[y].substring(0, x) + '.' + gameState.world.tiles[y].substring(x + 1);
    addMessage("Chest vanishes!");
    
    renderWorld();
    updateStatus();
    return true;
}

// ===== CHEST LOOT HELPERS =====
function handleChestDropLoot(itemId) {
    // Parse format: chest_drop_loot:rare:3 = rare quality, 3 rolls
    const parts = itemId.split(':');
    const dropType = parts[1] || 'common';  // common/magic/rare/boss
    const rolls = parseInt(parts[2]) || 1;
    
    const lootDrops = rollChestLoot(dropType, rolls);
    lootDrops.forEach(lootId => {
        if (gameState.player.inventory.length >= CONFIG.player.maxInventorySize) {
            addMessage(`Inventory full! Left item on ground.`);
            gameState.lootBags.push({
                x: gameState.player.x,
                y: gameState.player.y,
                gold: 0,
                items: [lootId]
            });
        } else {
            gameState.player.inventory.push(lootId);
            const item = itemDatabase[lootId];
            const color = RARITY_COLORS[item.rarity || 'common'];
            addMessage(`Found ${item.name}!`, color);
        }
    });
}

function handleRegularChestItem(itemId) {
    if (!itemDatabase[itemId]) {
        console.error(`Item not found in database: ${itemId}`);
        addMessage(`Found unknown item: ${itemId}`);
        return;
    }
    
    if (gameState.player.inventory.length >= CONFIG.player.maxInventorySize) {
        addMessage(`Inventory full! Left ${itemDatabase[itemId].name} on ground.`);
        gameState.lootBags.push({
            x: gameState.player.x,
            y: gameState.player.y,
            gold: 0,
            items: [itemId]
        });
    } else {
        gameState.player.inventory.push(itemId);
        const item = itemDatabase[itemId];
        const color = RARITY_COLORS[item.rarity || 'common'];
        addMessage(`Found ${item.name}!`, color);
    }
}

// ===== NPC INTERACTION =====
function handleNPCInteraction(x, y) {
    const adjacentNPC = gameState.npcs.find(npc => {
        const distX = Math.abs(npc.x - x);
        const distY = Math.abs(npc.y - y);
        return (distX === 1 && distY === 0) || (distX === 0 && distY === 1);
    });
    
    if (!adjacentNPC) return false;
    
    const npcData = getNPCData(adjacentNPC.type);
    
    // Handle innkeepers
    if (adjacentNPC.type === 'innkeeper_molly' || adjacentNPC.type === 'villager_innkeeper') {
        handleInnkeeper(adjacentNPC);
        return true;
    }
    
    // Handle shopkeepers
    if (npcData && npcData.isShopkeeper) {
        openShop(adjacentNPC.type);
        return true;
    }
    
    // Regular dialogue
    const dialogue = getDialogue(adjacentNPC.type, gameState);
    if (dialogue) {
        addMessage(`<span style="color: ${CGA.MAGENTA};">${adjacentNPC.name}:</span> "${dialogue.text}"`);
    } else {
        addMessage(`<span style="color: ${CGA.MAGENTA};">${adjacentNPC.name}:</span> "..."`);
    }
    
    return true;
}

//==============REST HELPER FUNCTIONS===================


function rest(location = 'camp', cost = 0) {
    const currentTile = gameState.world.tiles[gameState.player.y][gameState.player.x];
    
    if (currentTile === 'B') {
        location = 'bed';
    }
    
    if (location === 'inn' && gameState.player.gold < cost) {
        addMessage("Not enough gold!", CGA.MAGENTA);
        return;
    }
    
    if (location === 'camp' && !canCampHere()) {
        return;
    }
    
	gameState.dayCounter = (gameState.dayCounter || 0) + 1;
    console.log(`Day advanced to: ${gameState.dayCounter}`);
	addMessage(`Day advanced to: ${gameState.dayCounter}`);
	
	checkEvents(gameState);
	
    // ===== BEFORE REST HOOKS =====
    if (runBeforeRestHooks(gameState, location)) {
        return; // Hook cancelled the rest (e.g., VHS transport)
    }
    // =============================
    
    if (location === 'inn') {
        gameState.player.gold -= cost;
        addMessage(`Paid ${cost} gold for a room.`);
    }
    
    fadeToBlack(() => {
        addMessage("===================");
        
        const restMessages = {
            inn: [
                "You sink into a soft bed...",
                "The innkeeper brings you warm soup.",
                "You drift off to the sound of crackling fire...",
                "You sleep peacefully through the night."
            ],
            bed: [
                "You collapse into your own bed...",
                "Home sweet home.",
                "You sleep soundly in familiar surroundings.",
                "You wake up refreshed in your safe house."
            ],
            camp: [
                "You set up camp under the stars...",
                "The campfire crackles softly.",
                "You rest fitfully on the hard ground...",
                "Dawn breaks. Time to move on."
            ]
        };
        
        const messages = restMessages[location];
        const message = messages[Math.floor(Math.random() * messages.length)];
        addMessage(message);
        
        const healPercent = location === 'inn' || location === 'bed' ? 1.0 : 0.6;
        
        const oldHp = gameState.player.hp;
        const oldMp = gameState.player.mp;
        
        const targetHp = Math.floor(gameState.player.maxHp * healPercent);
        const targetMp = Math.floor(gameState.player.maxMp * healPercent);

        gameState.player.hp = Math.max(gameState.player.hp, targetHp);
        gameState.player.mp = Math.max(gameState.player.mp, targetMp);

        const hpGained = gameState.player.hp - oldHp;
        const mpGained = gameState.player.mp - oldMp;

        if (hpGained > 0) addMessage(`HP restored: +${hpGained}`, CGA.CYAN);
        if (mpGained > 0) addMessage(`MP restored: +${mpGained}`, CGA.CYAN);
        
        if (gameState.combat.inCombat) {
            gameState.combat.inCombat = false;
            gameState.weaponPreview.active = false;
            gameState.weaponPreview.tiles = [];
        }
        
        if (gameState.restSystem) {
            gameState.restSystem.lastRestDay++;
        }
        
        addMessage("===================");
        
        // ===== AFTER REST HOOKS =====
        //runAfterRestHooks(gameState, location);
        // ============================
        
        setTimeout(() => {
            clearFade();
			checkEvents(gameState);
            renderWorld();
            updateStatus();
        }, 1000);
    });
}

function canCampHere() {
    const currentTile = gameState.world.tiles[gameState.player.y][gameState.player.x];
    if (currentTile === 'B') {
        return true;
    }
    
    const campableTiles = ['.', '`', ',', 's'];
    
    if (!campableTiles.includes(currentTile)) {
        addMessage("Cannot camp here! Need grass or sand.", CGA.MAGENTA);
        return false;
    }
    
    const nearbyEnemies = gameState.enemies.some(enemy => {
        const dist = Math.abs(enemy.x - gameState.player.x) + Math.abs(enemy.y - gameState.player.y);
        return dist <= 3;
    });
    
    if (nearbyEnemies) {
        addMessage("Too dangerous! Enemies nearby!", CGA.MAGENTA);
        return false;
    }
    
    if (gameState.currentMap === 'town') {
        addMessage("Cannot camp in town. Find an inn!", CGA.MAGENTA);
        return false;
    }
    
    return true;
}

function handleInnkeeper(npc) {
    const innCost = 50;
    addMessage(`${npc.name}: "A room for the night? 50 gold."`, CGA.WHITE);
    addMessage("Press 'R' to rest, or move away to cancel.", CGA.CYAN);
    gameState.pendingInnRest = {
        npcId: npc.id,
        cost: innCost
    };
}

//================END REST HELPER FUNCTIONS===================


function searchLocation() {
    const x = gameState.player.x;
    const y = gameState.player.y;
    const tileChar = gameState.world.tiles[y][x];
    const tileType = tileTypes[tileChar];
    const key = `${x},${y}`;
    const locs = specialLocations[gameState.currentMap];
    
    if (locs && locs[key]) {
        const special = locs[key];
        if (special.requiresSearch) {
            const revealKey = `${gameState.currentMap}:${key}`;
            
            // Always show the message when searching
            addMessage(special.message, CGA.CYAN);
            
            // Only trigger journal entry on first discovery
            if (!gameState.revealedSpecials[revealKey]) {
                if (special.journalEntry) {
                    addJournalEntry(special.journalTitle, [
                        { type: 'text', content: special.message }
                    ]);
                }
                gameState.revealedSpecials[revealKey] = true;
            }
        } else {
            addMessage(special.message, CGA.CYAN);
        }
    } else {
        // No special location - generic "nothing here" messages
        const nothingMessages = [
            "Nothing of interest here.",
            "You find nothing.",
            "Nothing but dust.",
			"Empty!",
			"Actually, not even dust.",
			"Nuts. No treasure.",
            "Your search turns up empty.",
            "There's nothing special here.",
            "You don't find anything useful."
        ];
        const msg = nothingMessages[Math.floor(Math.random() * nothingMessages.length)];
        addMessage(msg, CGA.LIGHTGRAY);
    }
}

function lookAround() {
    const mapData = maps[gameState.currentMap];
    const displayName = getMapDisplayName(gameState.currentMap);
    
    // Header with map name
    addMessage(`=== ${displayName} ===`);
    
    // Get description for current map
    const description = mapDescriptions[gameState.currentMap];
    
    if (description) {
        // Display all description lines
        description.forEach(line => addMessage(line));
    } else {
        // Fallback for maps without descriptions yet
        addMessage("You look around and take in your surroundings.");
        console.warn(`No description found for map: ${gameState.currentMap}`);
    }
    
    // Check if this map triggers a journal entry
    const journalEntry = mapJournalEntries[gameState.currentMap];
    if (journalEntry) {
        const entryAdded = addJournalEntry(journalEntry.title, journalEntry.blocks);
        if (entryAdded) {
            addMessage("Journal updated...");
        }
    }
}



function toggleMapView() {
    
	if (fogAnimationInProgress) {
        addMessage("Wait...", CGA.LIGHTGRAY);
        return;
    }
	
	gameState.mapViewOpen = !gameState.mapViewOpen;
    
    if (gameState.mapViewOpen) {
        renderMapView();
    } else {
        renderWorld();
    }
}

/* function renderMapView() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const mapKey = gameState.currentMap;
    const explored = gameState.exploredTiles[mapKey] || new Set();
    
    // Clear to black
    ctx.fillStyle = CGA.BLACK;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const tileSize = 4; // Tiny tiles for zoomed out view
    
    // Draw explored tiles
    for (let y = 0; y < gameState.world.height; y++) {
        for (let x = 0; x < gameState.world.width; x++) {
            const key = `${x},${y}`;
            
            if (explored.has(key)) {
                const tile = gameState.world.tiles[y][x];
                const isPassable = tileTypes[tile]?.passable;
                
                ctx.fillStyle = isPassable ? CGA.LIGHTGRAY : CGA.WHITE;
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
        }
    }
	
	const transitions = mapTransitions[gameState.currentMap];
		if (transitions) {
			Object.entries(transitions).forEach(([key, trans]) => {
			const [x, y] = key.split(',').map(Number);
        
        // Only show if explored
        if (explored.has(key)) {
            ctx.fillStyle = CGA.MAGENTA;
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
		});
		}	
		
		gameState.npcs.forEach(npc => {
    const key = `${npc.x},${npc.y}`;
    if (explored.has(key)) {
        ctx.fillStyle = '#0F0'; // Green
        ctx.fillRect(npc.x * tileSize, npc.y * tileSize, tileSize, tileSize);
    }
});
    
    // Player position (blinking cyan dot)
    ctx.fillStyle = CGA.CYAN;
    ctx.fillRect(gameState.player.x * tileSize, gameState.player.y * tileSize, tileSize, tileSize);
    
    // Map title
    ctx.fillStyle = CGA.CYAN;
    ctx.font = '8px "Press Start 2P"';
    //ctx.fillText(`MAP: ${getMapDisplayName(gameState.currentMap)}`, 10, 20);
    ctx.fillText('Press Tab to close', 10, canvas.height - 10);
} */

function renderMapView() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const mapKey = gameState.currentMap;
    const explored = gameState.exploredTiles[mapKey] || new Set();
    
    // Clear to black
    ctx.fillStyle = CGA.BLACK;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const tileSize = 4;
    
    // Calculate centering offset
    const mapPixelWidth = gameState.world.width * tileSize;
    const mapPixelHeight = gameState.world.height * tileSize;
    const offsetX = Math.floor((canvas.width - mapPixelWidth) / 2);
    const offsetY = Math.floor((canvas.height - mapPixelHeight) / 2);
    
	
	// Draw explored tiles
	for (let y = 0; y < gameState.world.height; y++) {
		for (let x = 0; x < gameState.world.width; x++) {
			const key = `${x},${y}`;
			
			if (explored.has(key)) {
				const tile = gameState.world.tiles[y][x];
				const isPassable = tileTypes[tile]?.passable;
				
				// Determine color ONCE
				if (tile === '~') {
					ctx.fillStyle = CGA.CYAN;
				} else {
					ctx.fillStyle = isPassable ? CGA.LIGHTGRAY : CGA.WHITE;
				}
				
				// Draw it
				ctx.fillRect(offsetX + x * tileSize, offsetY + y * tileSize, tileSize, tileSize);
			}
		}
	}
    
    // Draw transitions
    const transitions = mapTransitions[gameState.currentMap];
    if (transitions) {
        Object.entries(transitions).forEach(([key, trans]) => {
            const [x, y] = key.split(',').map(Number);
            if (explored.has(key)) {
                ctx.fillStyle = CGA.MAGENTA;
                ctx.fillRect(offsetX + x * tileSize, offsetY + y * tileSize, tileSize, tileSize);  // ADD offsetX/Y
            }
        });
    }
    
    // Draw treasure chests
    for (let y = 0; y < gameState.world.height; y++) {
        for (let x = 0; x < gameState.world.width; x++) {
            const key = `${x},${y}`;
            if (explored.has(key)) {
                const tile = gameState.world.tiles[y][x];
                if (tile === '$') {
                    ctx.fillStyle = '#FF0';
                    ctx.fillRect(offsetX + x * tileSize, offsetY + y * tileSize, tileSize, tileSize);  // ADD offsetX/Y
                }
            }
        }
    }
    
    // Draw NPCs
    gameState.npcs.forEach(npc => {
        const key = `${npc.x},${npc.y}`;
        if (explored.has(key)) {
            ctx.fillStyle = '#0F0';
            ctx.fillRect(offsetX + npc.x * tileSize, offsetY + npc.y * tileSize, tileSize, tileSize);  // ADD offsetX/Y
        }
    });
    
    // Player position
    ctx.fillStyle = CGA.CYAN;
    ctx.fillRect(offsetX + gameState.player.x * tileSize, offsetY + gameState.player.y * tileSize, tileSize, tileSize);  // ADD offsetX/Y
}

// ===== INVENTORY =====
function toggleInventory() {
    gameState.inventoryOpen = !gameState.inventoryOpen;
    const panel = document.getElementById('inventoryPanel');
    if (gameState.inventoryOpen) {
        panel.classList.add('active');
        if (gameState.player.inventory.length > 0 && gameState.selectedItemIndex === -1) {
            gameState.selectedItemIndex = 0;
        }
        updateInventoryDisplay();
    } else {
        panel.classList.remove('active');
    }
}

function updateInventoryDisplay() {
    const inv = document.getElementById('inventoryItems');
    const stats = calculateStats();
   
    // Update player stats display
    document.getElementById('statAttack').textContent = stats.strength || 0;
    document.getElementById('statDefense').textContent = stats.vitality || 0;
    document.getElementById('statMagic').textContent = stats.intelligence || 0;
    document.getElementById('statSpirit').textContent = stats.spirit || 0;
    document.getElementById('statAgility').textContent = stats.agility || 0;
    document.getElementById('statLuck').textContent = stats.luck || 0;
    
    // UPDATE INVENTORY HEADER WITH COUNT
    const invHeader = document.querySelector('.inventory-header');
    if (invHeader) {
        const count = gameState.player.inventory.length;
        const max = CONFIG.player.maxInventorySize;
        const colorStyle = count >= max ? 'color: #f00;' : '';
        invHeader.innerHTML = `INVENTORY & EQUIPMENT <span style="${colorStyle}">(${count}/${max})</span>`;
    }
    
    // Display inventory items
    if (gameState.player.inventory.length === 0) {
        inv.innerHTML = '<div class="slot-empty">No items</div>';
        gameState.selectedItemIndex = -1;
    } else {
        inv.innerHTML = '';
        
        const equippedItemIds = new Set(Object.values(gameState.equipment).filter(x => x !== null));
        const alreadyMarked = new Set();
        
        gameState.player.inventory.forEach((itemId, idx) => {
            const item = itemDatabase[itemId];
            const div = document.createElement('div');
            div.className = 'inventory-item';
            if (idx === gameState.selectedItemIndex) div.classList.add('selected');
            
            const isEquipped = equippedItemIds.has(itemId) && !alreadyMarked.has(itemId);
            if (isEquipped) alreadyMarked.add(itemId);
            
            // DIFFERENT INDICATORS FOR DIFFERENT TYPES
            let eqText = '';
            if (item.type === 'key_item') {
                eqText = ' 🔑';  // Key item indicator
            } else if (isEquipped) {
                eqText = ' ⚔';  // Equipped indicator
            }
            
            let typeText = '';
            if (item.type === 'weapon' && item.weaponType) {
                typeText = ` (${item.weaponType})`;
            } else if (item.type === 'consumable' && item.onUse) {
                typeText = ' [U]';
            } else if (item.type === 'key_item') {
                typeText = ' [KEY]';
            }
            
            // Build stats text - only show non-zero stats
            let statsText = '';
            if (item.canEquip && item.stats) {
                const parts = [];
                if ((item.stats.strength || 0) !== 0) parts.push(`STR${item.stats.strength > 0 ? '+' : ''}${item.stats.strength}`);
                if ((item.stats.vitality || 0) !== 0) parts.push(`VIT${item.stats.vitality > 0 ? '+' : ''}${item.stats.vitality}`);
                if ((item.stats.intelligence || 0) !== 0) parts.push(`INT${item.stats.intelligence > 0 ? '+' : ''}${item.stats.intelligence}`);
                if ((item.stats.spirit || 0) !== 0) parts.push(`SPR${item.stats.spirit > 0 ? '+' : ''}${item.stats.spirit}`);
                if ((item.stats.agility || 0) !== 0) parts.push(`AGI${item.stats.agility > 0 ? '+' : ''}${item.stats.agility}`);
                if ((item.stats.luck || 0) !== 0) parts.push(`LUK${item.stats.luck > 0 ? '+' : ''}${item.stats.luck}`);
                if (parts.length > 0) statsText = `<div class="item-stats">${parts.join(', ')}</div>`;
            }
            
            // COLOR BY RARITY
            const rarity = item.rarity || 'common';
            const color = RARITY_COLORS[rarity];
            
            div.innerHTML = `
                <div class="item-name" style="color: ${color};">${item.name}${eqText}${typeText}</div>
                ${statsText}
                <div class="item-desc">${item.description || ''}</div>
            `;
            
            div.addEventListener('click', () => { 
                gameState.selectedItemIndex = idx; 
                updateInventoryDisplay(); 
            });
            inv.appendChild(div);
        });
    }
    
    // Update equipment slots display
    const slots = ['weapon', 'offhand', 'helmet', 'armor', 'gloves', 'boots', 'ring1', 'ring2'];
    slots.forEach(slot => {
        const el = document.getElementById(`${slot}Slot`);
        const eqId = gameState.equipment[slot];
        if (eqId) {
            const item = itemDatabase[eqId];
            if (item) {
                const rarity = item.rarity || 'common';
                const color = RARITY_COLORS[rarity];
                el.className = 'slot-equipped';
                el.style.color = color;
                el.textContent = item.name;
            }
        } else {
            el.className = 'slot-empty';
            el.style.color = '';
            el.textContent = 'None';
        }
    });
}


function equipItem() {
    console.log('Current equipment:', JSON.stringify(gameState.equipment));
    console.log('Trying to equip:', gameState.player.inventory[gameState.selectedItemIndex]);
    
    if (gameState.selectedItemIndex < 0 || gameState.selectedItemIndex >= gameState.player.inventory.length) {
        addMessage("No item selected.");
        return;
    }
    const itemId = gameState.player.inventory[gameState.selectedItemIndex];
    const item = itemDatabase[itemId];
    if (!item.canEquip) { addMessage(`Cannot equip ${item.name}.`); return; }
    
    let slot = item.slot;
    
    // SPECIAL CASE: Rings can go in ring1 OR ring2
    if (item.type === 'ring') {
        // If clicking an already equipped ring, unequip it
        if (gameState.equipment.ring1 === itemId) {
            gameState.equipment.ring1 = null;
            addMessage(`Unequipped ${item.name}.`);
            updateInventoryDisplay();
            return;
        }
        if (gameState.equipment.ring2 === itemId) {
            gameState.equipment.ring2 = null;
            addMessage(`Unequipped ${item.name}.`);
            updateInventoryDisplay();
            return;
        }
        
        // Try to find an empty ring slot
        if (!gameState.equipment.ring1) {
            slot = 'ring1';
        } else if (!gameState.equipment.ring2) {
            slot = 'ring2';
        } else {
            // Both slots full - replace ring1
            const old = itemDatabase[gameState.equipment.ring1];
            addMessage(`Unequipped ${old.name}.`);
            slot = 'ring1';
        }
    }
    
    // If THIS item is already equipped in this slot, unequip it
    if (gameState.equipment[slot] === itemId) {
        gameState.equipment[slot] = null;
        addMessage(`Unequipped ${item.name}.`);
    } 
    // Check if this itemId is equipped in ANY slot (prevent duplicates)
    else if (Object.values(gameState.equipment).includes(itemId)) {
        addMessage(`You already have that item equipped!`);
        return;
    }
    // Something else is in this slot
    else if (gameState.equipment[slot]) {
        const old = itemDatabase[gameState.equipment[slot]];
        addMessage(`Unequipped ${old.name}.`);
        gameState.equipment[slot] = itemId;
        addMessage(`Equipped ${item.name}!`);
    } 
    // Slot is empty
    else {
        gameState.equipment[slot] = itemId;
        addMessage(`Equipped ${item.name}!`);
    }
    
    updateInventoryDisplay();
	if (gameState.combat.inCombat && gameState.weaponPreview.active) {
        updateWeaponPreview();
    }
}

function useItem() {
    if (gameState.selectedItemIndex < 0 || gameState.selectedItemIndex >= gameState.player.inventory.length) {
        addMessage("No item selected.");
        return;
    }
    const itemId = gameState.player.inventory[gameState.selectedItemIndex];
    const item = itemDatabase[itemId];
    if (!item.onUse) { addMessage(`Cannot use ${item.name}.`); return; }
    const consumed = item.onUse();
    if (consumed) {
        gameState.player.inventory.splice(gameState.selectedItemIndex, 1);
        if (gameState.selectedItemIndex >= gameState.player.inventory.length) {
            gameState.selectedItemIndex = Math.max(0, gameState.player.inventory.length - 1);
        }
        
        // Close inventory after using consumable
        if (gameState.inventoryOpen) {
            gameState.inventoryOpen = false;
            document.getElementById('inventoryPanel').classList.remove('active');
        }
        
        updateInventoryDisplay();
        updateStatus();
    }
}


function dropItem() {
    if (gameState.selectedItemIndex < 0 || 
        gameState.selectedItemIndex >= gameState.player.inventory.length) {
        addMessage("No item selected.");
        return;
    }
    
    const itemId = gameState.player.inventory[gameState.selectedItemIndex];
    const item = itemDatabase[itemId];
    
    // BLOCK KEY ITEMS
    if (item.canDrop === false) {
        addMessage("Cannot drop key items!", CGA.MAGENTA);
        return;
    }
    
    // Count how many of this item we have
    const itemCount = gameState.player.inventory.filter(id => id === itemId).length;
    const isEquipped = Object.values(gameState.equipment).includes(itemId);
    
    // Only block if this is the ONLY copy and it's equipped
    if (isEquipped && itemCount === 1) {
        addMessage("Cannot drop equipped items! Unequip first.");
        return;
    }
    
    // Create loot bag at player position
    gameState.lootBags.push({
        x: gameState.player.x,
        y: gameState.player.y,
        gold: 0,
        items: [itemId]
    });
    
    // Remove from inventory
    gameState.player.inventory.splice(gameState.selectedItemIndex, 1);
    addMessage(`Dropped ${item.name}.`);
    
    // Adjust selection
    if (gameState.selectedItemIndex >= gameState.player.inventory.length) {
        gameState.selectedItemIndex = Math.max(0, gameState.player.inventory.length - 1);
    }
    
    updateInventoryDisplay();
    renderWorld();
}


function moveSelection(dir) {
    if (gameState.player.inventory.length === 0) return;
    
    gameState.selectedItemIndex += dir;
    
    // Wrap around at edges
    if (gameState.selectedItemIndex < 0) {
        gameState.selectedItemIndex = gameState.player.inventory.length - 1;
    } else if (gameState.selectedItemIndex >= gameState.player.inventory.length) {
        gameState.selectedItemIndex = 0;
    }
    
    updateInventoryDisplay();
    
    // AUTO-SCROLL TO SELECTED ITEM
    // Wait a frame for the DOM to update
    setTimeout(() => {
        const selectedElement = document.querySelector('.inventory-item.selected');
        if (selectedElement) {
            selectedElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest'  // Only scroll if item is outside viewport
            });
        }
    }, 0);
}

// ===== SHOP =====

// Generate shop inventory on game start
function generateShopInventory() {
    const inventory = [];
    
    // Always have consumables
    inventory.push(
        { itemId: 'health_potion', price: 50 },
        { itemId: 'mana_potion', price: 40 },
        { itemId: 'town_portal', price: 100 }
    );
    
    // Add 3-5 random common/magic items - FIXED BASE IDS
    const commonBases = ['dagger', 'sword', 'leather_armor', 'cap', 'gloves', 'boots', 'ring'];
    for (let i = 0; i < 5; i++) {
        const baseId = commonBases[Math.floor(Math.random() * commonBases.length)];
        const rarity = Math.random() < 0.3 ? 'magic' : 'common';
        const generatedItem = generateMagicItem(baseId, rarity);
        
        if (generatedItem) {
            itemDatabase[generatedItem.id] = generatedItem;
            const basePrice = (generatedItem.tier + 1) * 50;
            const rarityMult = rarity === 'magic' ? 2 : 1;
            inventory.push({
                itemId: generatedItem.id,
                price: basePrice * rarityMult
            });
        }
    }
    
    // Add 1-2 spell scrolls
    const spells = ['spell_fire_bolt', 'spell_heal', 'spell_barrier', 'spell_weaken', 'spell_lightning'];
    const spell1 = spells[Math.floor(Math.random() * spells.length)];
    inventory.push({ itemId: spell1, price: 150 });
    
    return inventory;
}

function openShop(shopkeeperId) {
    // Generate fresh inventory if not already generated
    if (!gameState.generatedShops) gameState.generatedShops = {};
    if (!gameState.generatedShops[shopkeeperId]) {
        gameState.generatedShops[shopkeeperId] = generateShopInventory();
    }
    
    gameState.currentShopkeeper = shopkeeperId;
    gameState.shopOpen = true;
    gameState.shopMode = 'buy';
    gameState.shopSelectedIndex = 0;
    
    document.getElementById('shopPanel').classList.add('active');
    updateShopDisplay();
}

function closeShop() {
    gameState.shopOpen = false;
    gameState.currentShopkeeper = null;
    const panel = document.getElementById('shopPanel');
    panel.classList.remove('active');
}

function switchShopMode(mode) {
    gameState.shopMode = mode;
    gameState.shopSelectedIndex = 0;
    document.getElementById('buyModeBtn').classList.toggle('active', mode === 'buy');
    document.getElementById('sellModeBtn').classList.toggle('active', mode === 'sell');
    updateShopDisplay();
}

function updateShopDisplay() {
    console.log('updateShopDisplay called');
    console.log('shopMode:', gameState.shopMode);
    console.log('currentShopkeeper:', gameState.currentShopkeeper);
    console.log('generatedShops:', gameState.generatedShops);

    const shopItems = document.getElementById('shopItems');
    document.getElementById('shopGold').textContent = gameState.player.gold;

    if (gameState.shopMode === 'buy') {
        // Use generated shop inventory instead of shopInventory constant
        const inventory = gameState.generatedShops ? gameState.generatedShops[gameState.currentShopkeeper] : [];

        if (!inventory || inventory.length === 0) {
            shopItems.innerHTML = '<div class="slot-empty">No items available</div>';
            return;
        }

        shopItems.innerHTML = '';
        inventory.forEach((shopItem, idx) => {
            console.log('Processing item:', shopItem, 'idx:', idx);
            const item = itemDatabase[shopItem.itemId];
            console.log('Item from database:', item);

            if (!item) {
                console.error('ITEM NOT FOUND:', shopItem.itemId);
                return;
            }

            const div = document.createElement('div');
            div.className = 'shop-item';
            if (idx === gameState.shopSelectedIndex) div.classList.add('selected');

            const canAfford = gameState.player.gold >= shopItem.price;
            const priceColor = canAfford ? '#0f0' : '#f00';

            div.innerHTML = `
                <span class="shop-item-name">${item.name}</span>
                <span class="shop-item-price" style="color: ${priceColor};">${shopItem.price}G</span>
                <div class="item-desc">${item.description}</div>
            `;

            div.addEventListener('click', () => {
                gameState.shopSelectedIndex = idx;
                updateShopDisplay();
            });

            shopItems.appendChild(div);
            console.log('Appended div, shopItems now has', shopItems.children.length, 'children');
        });

    } else {
        if (gameState.player.inventory.length === 0) {
            shopItems.innerHTML = '<div class="slot-empty">No items to sell</div>';
            return;
        }

        shopItems.innerHTML = '';
        gameState.player.inventory.forEach((itemId, idx) => {
            const item = itemDatabase[itemId];
            const div = document.createElement('div');
            div.className = 'shop-item';
            if (idx === gameState.shopSelectedIndex) div.classList.add('selected');

            const isEquipped = Object.values(gameState.equipment).includes(itemId);
            let sellPrice = 0;
            const shopInv = shopInventory[gameState.currentShopkeeper];
            const shopItem = shopInv ? shopInv.find(si => si.itemId === itemId) : null;
            if (shopItem) {
                sellPrice = Math.floor(shopItem.price * 0.5);
            } else {
                sellPrice = 25;
            }

            const equippedText = isEquipped ? ' [EQUIPPED - CANNOT SELL]' : '';
            const priceColor = isEquipped ? '#888' : '#0f0';

            div.innerHTML = `
                <span class="shop-item-name">${item.name}${equippedText}</span>
                <span class="shop-item-price" style="color: ${priceColor};">${sellPrice}G</span>
                <div class="item-desc">${item.description}</div>
            `;

            div.addEventListener('click', () => {
                gameState.shopSelectedIndex = idx;
                updateShopDisplay();
            });

            shopItems.appendChild(div);
        });
    }
}



function moveShopSelection(direction) {
    const maxIndex = gameState.shopMode === 'buy' 
        ? shopInventory[gameState.currentShopkeeper].length - 1
        : gameState.player.inventory.length - 1;
    if (maxIndex < 0) return;
    gameState.shopSelectedIndex += direction;
    if (gameState.shopSelectedIndex < 0) {
        gameState.shopSelectedIndex = maxIndex;
    } else if (gameState.shopSelectedIndex > maxIndex) {
        gameState.shopSelectedIndex = 0;
    }
    updateShopDisplay();
}

function shopConfirm() {
    if (gameState.shopMode === 'buy') {
        buyItem();
    } else {
        sellItem();
    }
}

function buyItem() {
    const inventory = gameState.generatedShops[gameState.currentShopkeeper];
    if (!inventory || gameState.shopSelectedIndex >= inventory.length) return;
    
    const shopItem = inventory[gameState.shopSelectedIndex];
    const item = itemDatabase[shopItem.itemId];
    
    if (gameState.player.gold < shopItem.price) {
        addMessage("Not enough gold!");
        return;
    }
    
    // CHECK INVENTORY SPACE
    if (gameState.player.inventory.length >= CONFIG.player.maxInventorySize) {
        addMessage("Inventory full! Can't buy more items.");
        return;
    }
    
    gameState.player.gold -= shopItem.price;
    gameState.player.inventory.push(shopItem.itemId);
    addMessage(`Bought ${item.name} for ${shopItem.price}G!`);
    updateShopDisplay();
    updateStatus();
}

function sellItem() {
    if (gameState.shopSelectedIndex >= gameState.player.inventory.length) return;
    
    const itemId = gameState.player.inventory[gameState.shopSelectedIndex];
    const item = itemDatabase[itemId];
    
    // BLOCK KEY ITEMS
    if (item.canSell === false) {
        addMessage("Cannot sell key items!", CGA.MAGENTA);
        return;
    }
    
    // Count how many of this item we have
    const itemCount = gameState.player.inventory.filter(id => id === itemId).length;
    const isEquipped = Object.values(gameState.equipment).includes(itemId);
    
    // Only block if this is the ONLY copy and it's equipped
    if (isEquipped && itemCount === 1) {
        addMessage("Cannot sell equipped items! Unequip first.");
        return;
    }
    
    let sellPrice = 0;
    const shopInv = shopInventory[gameState.currentShopkeeper];
    const shopItem = shopInv ? shopInv.find(si => si.itemId === itemId) : null;
    if (shopItem) {
        sellPrice = Math.floor(shopItem.price * 0.5);
    } else {
        sellPrice = 25;
    }
    
    gameState.player.gold += sellPrice;
    gameState.player.inventory.splice(gameState.shopSelectedIndex, 1);
    addMessage(`Sold ${item.name} for ${sellPrice}G!`);
    
    if (gameState.shopSelectedIndex >= gameState.player.inventory.length) {
        gameState.shopSelectedIndex = Math.max(0, gameState.player.inventory.length - 1);
    }
    
    updateShopDisplay();
    updateStatus();
}

// ===== SPELL SYSTEM =====
function toggleSpellPanel() {
    gameState.spellCasting.active = !gameState.spellCasting.active;
    const panel = document.getElementById('spellPanel');
    if (gameState.spellCasting.active) {
        panel.classList.add('active');
        if (gameState.player.knownSpells.length > 0) {
            gameState.spellCasting.selectedSpellIndex = 0;
        }
        updateSpellDisplay();
    } else {
        panel.classList.remove('active');
        gameState.spellCasting.pendingSpell = null;
    }
}

function updateSpellDisplay() {
    const spellList = document.getElementById('spellList');
    document.getElementById('spellMp').textContent = gameState.player.mp;
    document.getElementById('spellMaxMp').textContent = gameState.player.maxMp;
    
    if (gameState.player.knownSpells.length === 0) {
        spellList.innerHTML = '<div class="slot-empty">No spells learned</div>';
        return;
    }
    
    spellList.innerHTML = '';
    gameState.player.knownSpells.forEach((spellId, idx) => {
        const spell = spellDatabase[spellId];
        const div = document.createElement('div');
        div.className = 'spell-item';
        if (idx === gameState.spellCasting.selectedSpellIndex) {
            div.classList.add('selected');
        }
        
        const canAfford = gameState.player.mp >= spell.mpCost;
        const costColor = canAfford ? '#00f' : '#f00';
        
        div.innerHTML = `
            <span class="spell-name">${spell.name}</span>
            <span class="spell-cost" style="color: ${costColor};">${spell.mpCost} MP</span>
            <div class="spell-desc">${spell.description}</div>
        `;
        
        div.addEventListener('click', () => {
            gameState.spellCasting.selectedSpellIndex = idx;
            updateSpellDisplay();
        });
        
        spellList.appendChild(div);
    });
}

function moveSpellSelection(direction) {
    if (gameState.player.knownSpells.length === 0) return;
    
    gameState.spellCasting.selectedSpellIndex += direction;
    
    if (gameState.spellCasting.selectedSpellIndex < 0) {
        gameState.spellCasting.selectedSpellIndex = gameState.player.knownSpells.length - 1;
    } else if (gameState.spellCasting.selectedSpellIndex >= gameState.player.knownSpells.length) {
        gameState.spellCasting.selectedSpellIndex = 0;
    }
    
    updateSpellDisplay();
}

function castSpell() {
    if (gameState.player.knownSpells.length === 0) return;
    
    const spellId = gameState.player.knownSpells[gameState.spellCasting.selectedSpellIndex];
    const spell = spellDatabase[spellId];
    
    if (gameState.player.mp < spell.mpCost) {
        addMessage("Not enough MP!");
        return;
    }
    
    if (spell.targeting === 'self') {
        gameState.player.mp -= spell.mpCost;
        spell.effect(gameState.player);
        toggleSpellPanel();
        enemyTurn();
        renderWorld();
        updateStatus();
    //} else if (spell.targeting === 'directional') {
    //    gameState.spellCasting.pendingSpell = spellId;
    //    addMessage(`${spell.name}: Choose direction!`);
    //    toggleSpellPanel();
    //}
	} else if (spell.targeting === 'directional') {
    gameState.spellCasting.pendingSpell = spellId;
    addMessage(`${spell.name}: Choose direction!`);
    // Manually close panel without clearing pendingSpell
    gameState.spellCasting.active = false;
    document.getElementById('spellPanel').classList.remove('active');
}
}

function castDirectionalSpell(dx, dy) {
    const spellId = gameState.spellCasting.pendingSpell;
    const spell = spellDatabase[spellId];
    
    gameState.player.mp -= spell.mpCost;
    
    const targetX = gameState.player.x + dx;
    const targetY = gameState.player.y + dy;
    const target = gameState.enemies.find(e => e.x === targetX && e.y === targetY);
    
    if (target) {
        spell.effect(gameState.player, target);
        if (target.hp <= 0) {
            handleEnemyDefeat(target);
        }
    } else {
        addMessage(`${spell.name} misses!`);
    }
    
    gameState.spellCasting.pendingSpell = null;
    enemyTurn();
    renderWorld();
    updateStatus();
}


function addJournalEntry(title, blocks) {
    // Check if entry with this title already exists
    const existingEntry = gameState.journal.entries.find(entry => entry.title === title);
    
    if (existingEntry) {
        // Entry already exists, don't add duplicate
        console.log(`Journal entry "${title}" already exists, skipping duplicate`);
        return false;
    }
    
    // Add new entry
    gameState.journal.entries.push({
        title: title,
        timestamp: Date.now(),
        blocks: blocks
    });
    
    console.log(`Added journal entry: "${title}"`);
    return true;
}

/**
 * Check if journal entry exists (helper function)
 * @param {string} title - Entry title to check
 * @returns {boolean} - true if exists
 */
function hasJournalEntry(title) {
    return gameState.journal.entries.some(entry => entry.title === title);
}

function toggleJournal() {
    gameState.journal.open = !gameState.journal.open;
    gameState.viewMode = gameState.journal.open ? 'journal' : 'game';
    
    if (gameState.journal.open) {
        gameState.journal.currentPage = 0;
        renderJournal();
    } else {
        const overlay = document.getElementById('journalTextOverlay');
        if (overlay) overlay.remove();
        const imageOverlay = document.getElementById('journalImageOverlay');
        if (imageOverlay) imageOverlay.remove();
        renderWorld();
    }
}

function nextJournalPage() {
    const maxPages = Math.max(0, gameState.journal.entries.length - 1);
    if (gameState.journal.currentPage < maxPages) {
        gameState.journal.currentPage++;
        renderJournal();
    }
}

function prevJournalPage() {
    if (gameState.journal.currentPage > 0) {
        gameState.journal.currentPage--;
        renderJournal();
    }
}

function renderJournal() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    
    // Journal dimensions (in tiles)
    const jx = 2, jy = 1, jw = 16, jh = 15; //just changed jh to 15 from 13: 12/5, longer journal
    
    // Draw paper background
    for (let y = 0; y < jh; y++) {
        for (let x = 0; x < jw; x++) {
            let sprite = 'paper';
            // Edges and corners
            if (y === 0 && x === 0) sprite = 'paper_corner_tl';
            else if (y === 0 && x === jw - 1) sprite = 'paper_corner_tr';
            else if (y === jh - 1 && x === 0) sprite = 'paper_corner_bl';
            else if (y === jh - 1 && x === jw - 1) sprite = 'paper_corner_br';
            else if (y === 0) sprite = 'paper_edge_top';
            else if (y === jh - 1) sprite = 'paper_edge_bottom';
            else if (x === 0) sprite = 'paper_edge_left';
            else if (x === jw - 1) sprite = 'paper_edge_right';
            
            if (spriteImages[sprite] && spriteImages[sprite].complete) {
                ctx.drawImage(spriteImages[sprite], 
                    (jx + x) * TILE_SIZE, 
                    (jy + y) * TILE_SIZE, 
                    TILE_SIZE, TILE_SIZE);
            }
        }
    }
    
    // Draw content
    if (gameState.journal.entries.length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '8px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('Empty journal...', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const entry = gameState.journal.entries[gameState.journal.currentPage];
    const contentX = (jx + 1) * TILE_SIZE + 10;
    let contentY = (jy + 1) * TILE_SIZE + 10;
    const maxWidth = (jw - 2) * TILE_SIZE - 40;
    
    // Title
    ctx.fillStyle = '#000';
    ctx.font = '12px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(entry.title, canvas.width / 2, contentY);
    contentY += 20;
    
    // Date
    ctx.font = '7px "Press Start 2P"';
    ctx.fillStyle = '#555';
    ctx.fillText(new Date(entry.timestamp).toLocaleDateString(), canvas.width / 2, contentY);
    contentY += 25;
    
    // Blocks (text and images)
    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = '#000';
    
    entry.blocks.forEach(block => {
        if (block.type === 'text') {
            const align = block.align || 'left';
            const lines = wrapText(ctx, block.content, maxWidth);
            
            // Save original alignment
            const originalAlign = ctx.textAlign;
            ctx.textAlign = align;
            
            lines.forEach(line => {
                let xPos = contentX;
                if (align === 'center') {
                    xPos = canvas.width / 2;
                } else if (align === 'right') {
                    xPos = contentX + maxWidth;
                }
                
                ctx.fillText(line, xPos, contentY);
                contentY += 14;
            });
            
            // Restore alignment
            ctx.textAlign = originalAlign;
            contentY += 5;
            
        } else if (block.type === 'image') {
            const img = journalImages[block.imageId];
            if (img && img.complete) {
                const imgW = block.width || 100;
                const imgH = block.height || 100;
                const imgX = contentX + (maxWidth - imgW) / 2; // Center image
                ctx.drawImage(img, imgX, contentY, imgW, imgH);
                contentY += imgH + 10;
            }
        }
    });
    
    // Page number
    ctx.fillStyle = '#666';
    ctx.font = '7px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(`Page ${gameState.journal.currentPage + 1} of ${gameState.journal.entries.length}`, 
        canvas.width / 2, (jy + jh) * TILE_SIZE - 15);
}

// Helper for text wrapping
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
}



function renderJournalContent(offsetX, offsetY, jw, jh) {
    const pixelX = offsetX * 24;
    const pixelY = offsetY * 24;
    const pixelWidth = jw * 24;
    const pixelHeight = jh * 24;
    
    // Remove old overlays
    let textOverlay = document.getElementById('journalTextOverlay');
    if (textOverlay) textOverlay.remove();
    let imageOverlay = document.getElementById('journalImageOverlay');
    if (imageOverlay) imageOverlay.remove();
    
    // Create image overlay (for sprite-based images)
    imageOverlay = document.createElement('div');
    imageOverlay.id = 'journalImageOverlay';
    imageOverlay.style.cssText = `
        position: absolute;
        left: ${pixelX + 48}px;
        top: ${pixelY + 48}px;
        width: ${pixelWidth - 96}px;
        height: ${pixelHeight - 96}px;
        pointer-events: none;
        z-index: 11;
    `;
    document.querySelector('.game-container').appendChild(imageOverlay);
    
    // Create text overlay
    textOverlay = document.createElement('div');
    textOverlay.id = 'journalTextOverlay';
    textOverlay.style.cssText = `
        position: absolute;
        left: ${pixelX + 48}px;
        top: ${pixelY + 48}px;
        width: ${pixelWidth - 96}px;
        height: ${pixelHeight - 96}px;
        color: #000;
        font-family: 'Press Start 2P', monospace;
        font-size: 7px;
        line-height: 1.6;
        overflow: hidden;
        pointer-events: none;
        z-index: 12;
    `;
    document.querySelector('.game-container').style.position = 'relative';
    document.querySelector('.game-container').appendChild(textOverlay);
    
    let content = '';
    
    if (gameState.journal.entries.length === 0) {
        content += '<div style="text-align: center; color: #666; margin-top: 30px; font-size: 6px;">Empty journal...</div>';
    } else {
        const entry = gameState.journal.entries[gameState.journal.currentPage];
        content += `<div style="margin-bottom: 10px;">`;
        content += `<div style="color: #000; font-size: 8px; font-weight: bold; margin-bottom: 5px;">${entry.title}</div>`;
        content += `<div style="color: #555; font-size: 6px; margin-bottom: 10px;">${new Date(entry.timestamp).toLocaleDateString()}</div>`;
        
        let currentY = 35; // Start after title and date
        
        entry.blocks.forEach(block => {
            if (block.type === 'text') {
                content += `<div style="color: #000; font-size: 7px; margin-bottom: 10px;">${block.content}</div>`;
                // Estimate text height: ~12px per line, estimate lines based on character count
                const estimatedLines = Math.ceil(block.content.length / 45);
                currentY += estimatedLines * 12 + 10;
            } else if (block.type === 'image') {
                // Render sprite-based image at current Y position
                const imgWidth = block.width || 2;
                const imgHeight = block.height || 2;
                const centerX = Math.floor((pixelWidth - 96 - (imgWidth * 24)) / 2);
                
                for (let iy = 0; iy < imgHeight; iy++) {
                    for (let ix = 0; ix < imgWidth; ix++) {
                        const imgTile = document.createElement('div');
                        imgTile.style.cssText = `
                            position: absolute;
                            left: ${centerX + ix * 24}px;
                            top: ${currentY + iy * 24}px;
                            width: 24px;
                            height: 24px;
                            background-image: url(${sprites[block.sprite]});
                            background-size: 24px 24px;
                            image-rendering: pixelated;
                        `;
                        imageOverlay.appendChild(imgTile);
                    }
                }
                // Reserve space for the image in text flow
                content += `<div style="height: ${imgHeight * 24 + 10}px;"></div>`;
                currentY += imgHeight * 24 + 10;
            }
        });
        
        content += `</div>`;
        
        // Page navigation at bottom
        const pageInfo = `Page ${gameState.journal.currentPage + 1} of ${gameState.journal.entries.length}`;
        content += `<div style="position: absolute; bottom: 20px; left: 0; right: 0; text-align: center; color: #666; font-size: 6px;">${pageInfo}</div>`;
        content += '<div style="position: absolute; bottom: 5px; left: 0; right: 0; text-align: center; color: #666; font-size: 6px;">← → pages | J close</div>';
    }
    
    textOverlay.innerHTML = content;
}


// ===== SAVE/LOAD =====
function exportSave() {
    try {
        const data = JSON.stringify(gameState, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `goblinheart_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        addMessage("Saved!");
    } catch (e) {
        addMessage("Save failed.");
    }
}

function importSave() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                try {
                    const loaded = JSON.parse(ev.target.result);
                    gameState = loaded;
                    loadMap(gameState.currentMap);
                    renderWorld();
                    updateStatus();
                    addMessage("Loaded!");
                } catch (err) {
                    addMessage("Load failed.");
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function newGame() {
    if (confirm("Start new game?")) {
        gameState = {
            player: { 
				name: "Nate",
                x: 10, y: 7, 
                hp: CONFIG.player.startHP, 
                maxHp: CONFIG.player.startHP, 
                mp: CONFIG.player.startMP, 
                maxMp: CONFIG.player.startMP, 
                gold: CONFIG.player.startGold, 
                inventory: [], 
                knownSpells: [], 
                baseStats: { ...CONFIG.player.baseStats }, 
                weaponCooldown: 0, 
                stepCount: 0, 
                xp: 0, 
                level: 1, 
                barrier: 0, 
                barrierTurns: 0 
            },
            equipment: { 
				weapon: null, 
				offhand: null,    
				helmet: null,     
				armor: null, 
				gloves: null,     
				boots: null,    
				ring1: null,     
				ring2: null      
			},
            combat: { inCombat: false, turnCount: 0 },
            spellCasting: { active: false, selectedSpellIndex: 0, pendingSpell: null },
            enemies: [], 
            npcs: [],
            lootBags: [], 
			flags: {},
            selectedItemIndex: -1, 
            collectedTreasures: {}, 
            inventoryOpen: false, 
            shopOpen: false,
            shopMode: 'buy',
            shopSelectedIndex: 0,
            currentShopkeeper: null,
            currentMap: 'Overworld', 
            mapStates: {},
            world: { width: gameState.world.width, height: gameState.world.height, tiles: [...maps.Overworld.tiles] }
        };
        document.getElementById('messageBox').innerHTML = '';
        document.getElementById('inventoryPanel').classList.remove('active');
        document.getElementById('spellPanel').classList.remove('active');
        loadMap('Overworld');
        renderWorld();
        updateStatus();
        addMessage("New quest begins!");
    }
}

// ===== KEYBOARD INPUT SYSTEM =====

// Key binding registry
const keyBindings = {
    // Navigation
    movement: {
        'ArrowUp': { dir: [0, -1] },
        'ArrowDown': { dir: [0, 1] },
        'ArrowLeft': { dir: [-1, 0] },
        'ArrowRight': { dir: [1, 0] }
    },
    
    // Actions
    actions: {
        'a': performAction,
        'A': performAction,
        's': searchLocation,
        'S': searchLocation,
        'l': lookAround,
        'L': lookAround,
        'w': waitTurn,
        'W': waitTurn,
        ' ': waitTurn,
		'r': () => {
            if (gameState.pendingInnRest) {
                rest('inn', gameState.pendingInnRest.cost);
                gameState.pendingInnRest = null;
            } else {
                rest('camp', 0);
            }
        },
        'R': () => {
            if (gameState.pendingInnRest) {
                rest('inn', gameState.pendingInnRest.cost);
                gameState.pendingInnRest = null;
            } else {
                rest('camp', 0);
            }
        },
    },
    
    // UI Toggles
    ui: {
        'i': toggleInventory,
        'I': toggleInventory,
        'm': toggleSpellPanel,
        'M': toggleSpellPanel,
        'j': toggleJournal,
        'J': toggleJournal,
        'c': toggleCombatMode,
        'C': toggleCombatMode,
        'f': toggleFogOfWar,
        'F': toggleFogOfWar,
		'Tab': toggleMapView,
		'p': cyclePalette

    },
	
	
    
    // Inventory actions
    inventory: {
        'ArrowUp': () => moveSelection(-1),
        'ArrowDown': () => moveSelection(1),
        'e': equipItem,
        'E': equipItem,
        'u': useItem,
        'U': useItem,
        'd': dropItem,
        'D': dropItem,
        'i': toggleInventory,
        'I': toggleInventory
    },
    
    // Shop actions
    shop: {
        'ArrowUp': () => moveShopSelection(-1),
        'ArrowDown': () => moveShopSelection(1),
        'Enter': shopConfirm,
        'Escape': closeShop
    },
    
    // Spell panel
    spellPanel: {
        'ArrowUp': () => moveSpellSelection(-1),
        'ArrowDown': () => moveSpellSelection(1),
        'Enter': castSpell,
        'c': castSpell,
        'C': castSpell,
        'Escape': toggleSpellPanel,
        'm': toggleSpellPanel,
        'M': toggleSpellPanel
    },
    
    // Spell targeting
    spellTarget: {
        'ArrowUp': () => castDirectionalSpell(0, -1),
        'ArrowDown': () => castDirectionalSpell(0, 1),
        'ArrowLeft': () => castDirectionalSpell(-1, 0),
        'ArrowRight': () => castDirectionalSpell(1, 0),
        'Escape': () => { gameState.spellCasting.pendingSpell = null; addMessage("Cancelled."); }
    },
    
    // Combat
    combat: {
        'ArrowUp': () => attemptAttack(0, -1),
        'ArrowDown': () => attemptAttack(0, 1),
        'ArrowLeft': () => attemptAttack(-1, 0),
        'ArrowRight': () => attemptAttack(1, 0),
        'c': toggleCombatMode,
        'C': toggleCombatMode
    },
    
    // Journal
    journal: {
        'ArrowLeft': prevJournalPage,
        'ArrowRight': nextJournalPage,
        'j': toggleJournal,
        'J': toggleJournal,
        'Escape': toggleJournal
    }
};

// Balance knob configuration
const balanceKnobBindings = {
    'Digit1': () => adjustKnob('enemyDamageMultiplier', 0.1, 'Enemy Damage', '#f00'),
    'Digit2': () => adjustKnob('enemyDamageMultiplier', -0.1, 'Enemy Damage', '#f00'),
    'Digit3': () => adjustKnob('enemyHpMultiplier', 0.1, 'Enemy HP', '#f00'),
    'Digit4': () => adjustKnob('enemyHpMultiplier', -0.1, 'Enemy HP', '#f00'),
    'Digit5': () => adjustKnob('playerHealingMultiplier', 0.1, 'Healing', '#0f0'),
    'Digit6': () => adjustKnob('playerHealingMultiplier', -0.1, 'Healing', '#0f0'),
    'Digit7': () => adjustKnob('magicItemChance', 0.05, 'Magic Items', '#00f', true),
    'Digit8': () => adjustKnob('magicItemChance', -0.05, 'Magic Items', '#00f', true),
    'Digit0': resetBalanceKnobs,
    'b': showBalanceKnobs,
    'B': showBalanceKnobs
};

// Helper functions
function adjustKnob(knob, delta, label, color, isPercent = false) {
    if (knob === 'magicItemChance') {
        BALANCE_KNOBS[knob] = Math.max(0, Math.min(1.0, Math.round((BALANCE_KNOBS[knob] + delta) * 100) / 100));
    } else {
        BALANCE_KNOBS[knob] = Math.max(0.1, Math.round((BALANCE_KNOBS[knob] + delta) * 10) / 10);
    }
    const display = isPercent ? `${(BALANCE_KNOBS[knob] * 100).toFixed(0)}%` : `${BALANCE_KNOBS[knob].toFixed(1)}x`;
    addMessage(`${label}: ${display}`, color);
}

function resetBalanceKnobs() {
    BALANCE_KNOBS.enemyDamageMultiplier = 1.0;
    BALANCE_KNOBS.playerHealingMultiplier = 1.0;
    BALANCE_KNOBS.enemyHpMultiplier = 1.0;
    BALANCE_KNOBS.magicItemChance = 0.35;
    BALANCE_KNOBS.xpMultiplier = 1.0;
    BALANCE_KNOBS.goldMultiplier = 1.0;
    BALANCE_KNOBS.potionEffectiveness = 1.0;
    addMessage('Balance knobs RESET to 1.0x', '#ff0');
}

function showBalanceKnobs() {
    addMessage('======= BALANCE KNOBS =======', '#ff0');
    addMessage(`Shift+1/2: Enemy Damage ${BALANCE_KNOBS.enemyDamageMultiplier.toFixed(1)}x`, '#f00');
    addMessage(`Shift+3/4: Enemy HP ${BALANCE_KNOBS.enemyHpMultiplier.toFixed(1)}x`, '#f00');
    addMessage(`Shift+5/6: Healing ${BALANCE_KNOBS.playerHealingMultiplier.toFixed(1)}x`, '#0f0');
    addMessage(`Shift+7/8: Magic Drops ${(BALANCE_KNOBS.magicItemChance * 100).toFixed(0)}%`, '#00f');
    addMessage(`XP: ${BALANCE_KNOBS.xpMultiplier.toFixed(1)}x | Gold: ${BALANCE_KNOBS.goldMultiplier.toFixed(1)}x`, '#ff0');
}

function toggleFogOfWar() {
    gameState.fogOfWarEnabled = !gameState.fogOfWarEnabled;
    addMessage(gameState.fogOfWarEnabled ? "Fog of war ON" : "Fog of war OFF");
    renderWorld();
}

function cycleWeather() {
    if (!gameState.weather) {
        gameState.weather = {
            type: 'none',
            particles: [],
            animationFrame: null,
            lastUpdate: 0,
            lightningTimer: 0
        };
    }
    const types = ['none', 'rain', 'snow', 'storm', 'acid'];
    const currentIndex = types.indexOf(gameState.weather.type);
    const nextType = types[(currentIndex + 1) % types.length];
    setWeather(nextType);
    addMessage(`Weather: ${nextType.toUpperCase()}`, CGA.CYAN);
}

// Determine current input mode
function getInputMode() {
    if (gameState.spellCasting.active) return 'spellPanel';
    if (gameState.spellCasting.pendingSpell) return 'spellTarget';
    if (gameState.shopOpen) return 'shop';
    if (gameState.inventoryOpen) return 'inventory';
    if (gameState.combat.inCombat) return 'combat';
    if (gameState.journal.open) return 'journal';
    return 'normal';
}

// ===== MAIN EVENT HANDLER =====
document.addEventListener('keydown', function(e) {
	
	if (e.ctrlKey || e.metaKey) {
        return; // Let browser handle it
    }
	
    // Block ALL input during fade effects
    if (gameState.fadeInProgress) {
        e.preventDefault();
        return;
    }
    
    // Handle Shift key combinations first
    if (e.shiftKey) {
        // Balance knobs
        if (balanceKnobBindings[e.code] || balanceKnobBindings[e.key]) {
            e.preventDefault();
            const handler = balanceKnobBindings[e.code] || balanceKnobBindings[e.key];
            handler();
            return;
        }
        
        // Weather cycling (Shift+W)
        if (e.key === 'w' || e.key === 'W') {
            e.preventDefault();
            cycleWeather();
            return;
        }
    }
    
    // Get current input mode
    const mode = getInputMode();
    
    // Handle based on mode
    if (mode === 'normal') {
        // Movement
        if (keyBindings.movement[e.key]) {
            e.preventDefault();
            const [dx, dy] = keyBindings.movement[e.key].dir;
            movePlayer(dx, dy);
            return;
        }
        
        // Actions
        if (keyBindings.actions[e.key]) {
            e.preventDefault();
            keyBindings.actions[e.key]();
            return;
        }
        
        // UI toggles
        if (keyBindings.ui[e.key]) {
            e.preventDefault();
            keyBindings.ui[e.key]();
            return;
        }
    } else {
        // Use mode-specific bindings
        const bindings = keyBindings[mode];
        if (bindings && bindings[e.key]) {
            e.preventDefault();
            bindings[e.key]();
            return;
        }
    }
});

const exportBtn = document.getElementById('exportBtn');
if (exportBtn) exportBtn.addEventListener('click', exportSave);

const importBtn = document.getElementById('importBtn');
if (importBtn) importBtn.addEventListener('click', importSave);

const newGameBtn = document.getElementById('newGameBtn');
if (newGameBtn) newGameBtn.addEventListener('click', newGame);

const buyModeBtn = document.getElementById('buyModeBtn');
if (buyModeBtn) buyModeBtn.addEventListener('click', () => switchShopMode('buy'));

const sellModeBtn = document.getElementById('sellModeBtn');
if (sellModeBtn) sellModeBtn.addEventListener('click', () => switchShopMode('sell'));

