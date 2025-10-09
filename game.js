// ===== GAME STATE =====

const TILE_SIZE = 24;
const VIEWPORT_WIDTH = 20;
const VIEWPORT_HEIGHT = 15;

// At the top of game.js, after spriteImages
const journalImages = {};

function loadJournalImage(id, path) {
    const img = new Image();
    img.src = path;
    journalImages[id] = img;
    return img;
}

// Load your journal images
loadJournalImage('goblin_full', 'journal-images/goblin.png');
//loadJournalImage('dungeon_entrance', 'journal-images/dungeon.png');
// etc.


let gameState = {
    player: { 
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
    combat: { inCombat: false, turnCount: 0 },
    spellCasting: { active: false, selectedSpellIndex: 0, pendingSpell: null },
    enemies: [], 
    npcs: [],
    lootBags: [], 
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
    //world: { width: CONFIG.world.width, height: CONFIG.world.height, tiles: [...maps.overworld.tiles] }
	//world: { width: 20, height: 15, tiles: [...maps.overworld.tiles] }
	
	world: { width: 20, height: 15, tiles: [] }
	
	
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
                            if (msg) {
                                convertedSpecialLocations[mapId][key] = {
                                    message: msg,
                                    requiresSearch: requiresSearch
                                };
                            }
                            break;
                    }
                });
            }
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
    loadMap('Overworld');
    renderWorld();
	updateExploration()
    updateStatus();
    addMessage("Your quest begins!");
    addMessage("BUMP enemies or use TACTICAL mode (C)!");
    addMessage("Press M to open spellbook!");
    
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
}

function checkTransition() {
    const key = `${gameState.player.x},${gameState.player.y}`;
    const trans = mapTransitions[gameState.currentMap];
    if (trans && trans[key]) {
        const t = trans[key];
        addMessage("===================");
        addMessage(t.message);
        addMessage("===================");
        loadMap(t.map);
        gameState.player.x = t.x;
        gameState.player.y = t.y;
        renderWorld();
		updateExploration()
        updateStatus();
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
        hp: t.hp, 
        maxHp: t.maxHp, 
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
    const npcTemplate = npcDatabase[type];
    gameState.npcs.push({
        id: Math.random().toString(36).substr(2, 9),
        type: type,
        name: npcTemplate.name,
        sprite: npcTemplate.sprite,
        x: x,
        y: y,
        dialogue: npcTemplate.dialogue
    });
}

function trySpawnEnemy() {
    const mapData = maps[gameState.currentMap];
    if (!mapData.spawnRate || mapData.spawnRate === 0) return;
    if (gameState.enemies.length >= mapData.maxEnemies) return;
    if (Math.random() < mapData.spawnRate) {
        const roll = Math.random();
        let cumulative = 0;
        let selectedType = mapData.spawnTypes[0];
        for (let i = 0; i < mapData.spawnTypes.length; i++) {
            cumulative += mapData.spawnWeights[i];
            if (roll < cumulative) { selectedType = mapData.spawnTypes[i]; break; }
        }
        let attempts = 0;
        while (attempts < 20) {
            const x = Math.floor(Math.random() * gameState.world.width);
            const y = Math.floor(Math.random() * gameState.world.height);
            const distX = Math.abs(x - gameState.player.x);
            const distY = Math.abs(y - gameState.player.y);
            const distance = Math.sqrt(distX * distX + distY * distY);
            const tile = gameState.world.tiles[y][x];
            const occupied = gameState.enemies.some(e => e.x === x && e.y === y);
            if (distance >= 5 && tileTypes[tile].passable && !occupied) {
				if (!enemyDatabase[selectedType]) {
					console.error(`Missing enemy in database: ${selectedType}`);
					console.log('Available enemies:', Object.keys(enemyDatabase));
					return;
				}
                spawnEnemyAt(selectedType, x, y);
                addMessage(`${enemyDatabase[selectedType].name} appears!`);
                break;
            }
            attempts++;
        }
    }
}



// Convert sprite data URLs to Image objects (do this once at startup)
const spriteImages = {};
Object.keys(sprites).forEach(key => {
    const img = new Image();
    img.src = sprites[key];
    spriteImages[key] = img;
});

function getCameraPosition() {
    let camX = gameState.player.x - Math.floor(VIEWPORT_WIDTH / 2);
    let camY = gameState.player.y - Math.floor(VIEWPORT_HEIGHT / 2);
    camX = Math.max(0, Math.min(camX, gameState.world.width - VIEWPORT_WIDTH));
    camY = Math.max(0, Math.min(camY, gameState.world.height - VIEWPORT_HEIGHT));
	
	console.log('Player:', gameState.player.x, gameState.player.y);
    console.log('World size:', gameState.world.width, gameState.world.height);
    console.log('Camera:', camX, camY);
	
    return { x: camX, y: camY };
}

function renderWorld() {
    if (gameState.viewMode === 'journal') {
        renderJournal();
        return;
    }
    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const camera = getCameraPosition();
    
    ctx.fillStyle = '#001100';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Render tiles
    for (let viewY = 0; viewY < VIEWPORT_HEIGHT; viewY++) {
        for (let viewX = 0; viewX < VIEWPORT_WIDTH; viewX++) {
            const worldX = viewX + camera.x;
            const worldY = viewY + camera.y;
            
            if (worldX >= 0 && worldX < gameState.world.width && 
                worldY >= 0 && worldY < gameState.world.height) {
                
                const tileChar = gameState.world.tiles[worldY][worldX];
                const tileType = tileTypes[tileChar];
                const img = spriteImages[tileType.sprite];
                
                if (img && img.complete) {
                    ctx.drawImage(img, viewX * TILE_SIZE, viewY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }
    
    // Render loot bags
    gameState.lootBags.forEach(loot => {
        const viewX = loot.x - camera.x;
        const viewY = loot.y - camera.y;
        if (viewX >= 0 && viewX < VIEWPORT_WIDTH && viewY >= 0 && viewY < VIEWPORT_HEIGHT) {
            const img = spriteImages.lootbag;
            if (img && img.complete) {
                ctx.drawImage(img, viewX * TILE_SIZE, viewY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    });
    
    // Render NPCs
    gameState.npcs.forEach(npc => {
        const viewX = npc.x - camera.x;
        const viewY = npc.y - camera.y;
        if (viewX >= 0 && viewX < VIEWPORT_WIDTH && viewY >= 0 && viewY < VIEWPORT_HEIGHT) {
            const img = spriteImages[npc.sprite];
            if (img && img.complete) {
                ctx.drawImage(img, viewX * TILE_SIZE, viewY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    });
    
    // Render enemies
    gameState.enemies.forEach(enemy => {
        const viewX = enemy.x - camera.x;
        const viewY = enemy.y - camera.y;
        if (viewX >= 0 && viewX < VIEWPORT_WIDTH && viewY >= 0 && viewY < VIEWPORT_HEIGHT) {
            const img = spriteImages[enemy.sprite];
            if (img && img.complete) {
                ctx.drawImage(img, viewX * TILE_SIZE, viewY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    });
    
    // Render player
    const playerViewX = gameState.player.x - camera.x;
    const playerViewY = gameState.player.y - camera.y;
    const img = spriteImages.player;
    if (img && img.complete) {
        ctx.drawImage(img, playerViewX * TILE_SIZE, playerViewY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
    
    // RENDER FOG OF WAR
    if (gameState.fogOfWarEnabled) {
        const mapKey = gameState.currentMap;
        const explored = gameState.exploredTiles[mapKey] || new Set();
        const revealing = gameState.revealingTiles?.[mapKey] || new Map();
        
        for (let viewY = 0; viewY < VIEWPORT_HEIGHT; viewY++) {
            for (let viewX = 0; viewX < VIEWPORT_WIDTH; viewX++) {
                const worldX = viewX + camera.x;
                const worldY = viewY + camera.y;
                const key = `${worldX},${worldY}`;
                
                if (!explored.has(key)) {
                    // Completely unexplored - solid black
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(viewX * TILE_SIZE, viewY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                } else if (revealing.has(key)) {
                    // Currently revealing - fade in
                    const data = revealing.get(key);
                    const now = Date.now();
                    
                    if (now >= data.startTime) {
                        const alpha = 1 - data.progress; // Fade from black (1) to clear (0)
                        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                        ctx.fillRect(viewX * TILE_SIZE, viewY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    } else {
                        // Not started yet - still black
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(viewX * TILE_SIZE, viewY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    }
                }
                // else: fully revealed, draw nothing (tile is visible)
            }
        }
    }
}

function updateExploration() {
    if (!gameState.fogOfWarEnabled) return;
    
    const mapKey = gameState.currentMap;
    if (!gameState.exploredTiles[mapKey]) {
        gameState.exploredTiles[mapKey] = new Set();
    }
    if (!gameState.revealingTiles) {
        gameState.revealingTiles = {};
    }
    if (!gameState.revealingTiles[mapKey]) {
        gameState.revealingTiles[mapKey] = new Map();
    }
    
    const radius = gameState.explorationRadius;
    const px = gameState.player.x;
    const py = gameState.player.y;
    
    const newlyRevealed = [];
    
    // Mark all tiles within radius as explored
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const x = px + dx;
            const y = py + dy;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const key = `${x},${y}`;
            
            if (distance <= radius && 
                x >= 0 && x < gameState.world.width && 
                y >= 0 && y < gameState.world.height) {
                
                // If not already explored, add to revealing animation
                if (!gameState.exploredTiles[mapKey].has(key)) {
                    newlyRevealed.push({ key, distance });
                }
                gameState.exploredTiles[mapKey].add(key);
            }
        }
    }
    
    // Add newly revealed tiles to animation queue with staggered timing
    if (newlyRevealed.length > 0) {
        newlyRevealed.forEach(({ key, distance }) => {
            // Stagger based on distance from player (cascade effect)
            const delay = distance * 30; // 30ms per tile of distance
            gameState.revealingTiles[mapKey].set(key, {
                progress: 0,
                startTime: Date.now() + delay
            });
        });
        
        // Start animation loop if not already running
        if (!gameState.revealAnimationRunning) {
            gameState.revealAnimationRunning = true;
            animateReveal();
        }
    }
}

function animateReveal() {
    if (!gameState.fogOfWarEnabled) {
        gameState.revealAnimationRunning = false;
        return;
    }
    
    const mapKey = gameState.currentMap;
    const revealing = gameState.revealingTiles[mapKey];
    if (!revealing || revealing.size === 0) {
        gameState.revealAnimationRunning = false;
        return;
    }
    
    const now = Date.now();
    let stillAnimating = false;
    
    // Update progress for all revealing tiles
    revealing.forEach((data, key) => {
        if (now >= data.startTime) {
            const elapsed = now - data.startTime;
            const duration = 200; // 200ms reveal duration per tile
            data.progress = Math.min(1, elapsed / duration);
            
            if (data.progress < 1) {
                stillAnimating = true;
            }
        } else {
            stillAnimating = true; // Still waiting for delay
        }
    });
    
    // Remove completed animations
    revealing.forEach((data, key) => {
        if (data.progress >= 1) {
            revealing.delete(key);
        }
    });
    
    renderWorld();
    
    if (stillAnimating) {
        requestAnimationFrame(animateReveal);
    } else {
        gameState.revealAnimationRunning = false;
    }
}

// ===== STATS & STATUS =====
function calculateStats() {
    const stats = { ...gameState.player.baseStats };
    Object.values(gameState.equipment).forEach(itemId => {
        if (itemId && itemDatabase[itemId]) {
            const item = itemDatabase[itemId];
            stats.strength += item.stats.strength;
            stats.vitality += item.stats.vitality;
            stats.intelligence += item.stats.intelligence;
            stats.spirit += item.stats.spirit;
            stats.agility += item.stats.agility;
            stats.luck += item.stats.luck;
        }
    });
    return stats;
}

function updateStatus() {
    const stats = calculateStats();
    document.getElementById('playerHp').textContent = gameState.player.hp;
    document.getElementById('playerMaxHp').textContent = gameState.player.maxHp;
    document.getElementById('playerMp').textContent = gameState.player.mp;
    document.getElementById('playerMaxMp').textContent = gameState.player.maxMp;
    document.getElementById('playerLevel').textContent = gameState.player.level;
    document.getElementById('statusStrength').textContent = stats.strength;
    document.getElementById('playerGold').textContent = gameState.player.gold;
    document.getElementById('playerXp').textContent = gameState.player.xp;
    document.getElementById('playerXpNext').textContent = getXpForNextLevel();
}

function getXpForNextLevel() {
    return CONFIG.leveling.xpFormula(gameState.player.level);
}

function addMessage(msg) {
    const mb = document.getElementById('messageBox');
    mb.innerHTML += msg + '<br>';
    const lines = mb.innerHTML.split('<br>');
    if (lines.length > 9) {
        mb.innerHTML = lines.slice(-9).join('<br>');
    }
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
	
	
	if (locs && locs[key]) {
		const special = locs[key];
		const revealKey = `${gameState.currentMap}:${key}`;
		if (!special.requiresSearch && !gameState.revealedSpecials[revealKey]) {
			addMessage(special.message);
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
	updateExploration();
    checkTransition();
  
	
	
    //if (locs && locs[key]) addMessage(locs[key]);
    if (tileType.name === 'treasure chest') addMessage("Chest here! Press A.");
    const loot = gameState.lootBags.find(l => l.x === newX && l.y === newY);
    if (loot) addMessage("Loot here! Press A.");
    enemyTurn();
    if (gameState.player.weaponCooldown > 0) gameState.player.weaponCooldown--;
    gameState.player.stepCount++;
    if (gameState.player.stepCount % CONFIG.spawning.checkInterval === 0) trySpawnEnemy();
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
    
    const lootIdx = gameState.lootBags.findIndex(l => l.x === x && l.y === y);
    if (lootIdx !== -1) {
        const loot = gameState.lootBags[lootIdx];
        addMessage("Picked up loot!");
        if (loot.gold > 0) { gameState.player.gold += loot.gold; addMessage(`+${loot.gold} gold!`); }
        if (loot.items.length > 0) {
            loot.items.forEach(itemId => {
                gameState.player.inventory.push(itemId);
                addMessage(`Found ${itemDatabase[itemId].name}!`);
            });
        }
        gameState.lootBags.splice(lootIdx, 1);
        renderWorld();
        updateStatus();
        return;
    }
    
    const tileChar = gameState.world.tiles[y][x];
    const tileType = tileTypes[tileChar];
    const key = `${x},${y}`;
    if (tileType.name === 'treasure chest') {
        if (!gameState.collectedTreasures[gameState.currentMap]) {
            gameState.collectedTreasures[gameState.currentMap] = [];
        }
        if (gameState.collectedTreasures[gameState.currentMap].includes(key)) {
            addMessage("Already opened.");
            return;
        }
        const mapTreas = treasureContents[gameState.currentMap];
        const treas = mapTreas ? mapTreas[key] : null;
        if (treas) {
            addMessage("Opened chest!");
            if (treas.gold > 0) { gameState.player.gold += treas.gold; addMessage(`+${treas.gold} gold!`); }
            if (treas.items && treas.items.length > 0) {
                treas.items.forEach(itemId => {
                    gameState.player.inventory.push(itemId);
                    addMessage(`Found ${itemDatabase[itemId].name}!`);
                });
            }
            gameState.collectedTreasures[gameState.currentMap].push(key);
            gameState.world.tiles[y] = gameState.world.tiles[y].substring(0, x) + '.' + gameState.world.tiles[y].substring(x + 1);
            addMessage("Chest vanishes!");
            renderWorld();
            updateStatus();
            return;
        } else {
            addMessage("Empty chest!");
            return;
        }
    }
    
    const adjacentNPC = gameState.npcs.find(npc => {
        const distX = Math.abs(npc.x - x);
        const distY = Math.abs(npc.y - y);
        return (distX === 1 && distY === 0) || (distX === 0 && distY === 1);
    });
    
    if (adjacentNPC) {
        const npcTemplate = npcDatabase[adjacentNPC.type];
        if (npcTemplate.isShopkeeper) {
            openShop(adjacentNPC.type);
            return;
        }
        
        let selectedDialogue = adjacentNPC.dialogue[0].text;
        for (let i = adjacentNPC.dialogue.length - 1; i >= 0; i--) {
            const dialogueOption = adjacentNPC.dialogue[i];
            if (!dialogueOption.condition || dialogueOption.condition(gameState)) {
                selectedDialogue = dialogueOption.text;
                break;
            }
        }
        addMessage(`${adjacentNPC.name}: "${selectedDialogue}"`);
        return;
    }
    
    addMessage("Nothing here.");
}


function searchLocation() {
    const x = gameState.player.x;
    const y = gameState.player.y;
    const tileChar = gameState.world.tiles[y][x];
    const tileType = tileTypes[tileChar];
    addMessage(`You search: ${tileType.description}`);
    const key = `${x},${y}`;
    const locs = specialLocations[gameState.currentMap];
    if (locs && locs[key]) {
        const special = locs[key];
        if (special.requiresSearch) {
            addMessage(special.message);
        } else {
            addMessage("Something special here...");
        }
    }
}

function lookAround() {
    const mapData = maps[gameState.currentMap];
    addMessage(`=== ${mapData.name} ===`);
    
    if (gameState.currentMap === 'Overworld') {
        addMessage("A verdant wilderness stretches before you. Trees sway in the breeze, mountains loom in the distance, and mysterious waters flow through the land. Danger and treasure await the bold.");
    } else if (gameState.currentMap === 'Dungeon1') {
        addMessage("Dark stone corridors echo with distant sounds. The air is cold and damp. Ancient evil dwells in these depths. Only the brave dare venture deeper.");
    } else if (gameState.currentMap === 'town') {
        addMessage("Haven Village - a peaceful settlement. Cottages line the streets, smoke rises from chimneys. The townsfolk go about their daily lives. A safe haven from the dangers beyond.");
    }
}

// ===== COMBAT =====
function toggleCombatMode() {
    gameState.combat.inCombat = !gameState.combat.inCombat;
    if (gameState.combat.inCombat) {
        addMessage("=== TACTICAL MODE ===");
        addMessage("Arrows to attack. +25% dmg!");
    } else {
        addMessage("Tactical OFF.");
    }
}

function attemptAttack(dx, dy) {
    if (gameState.player.weaponCooldown > 0) {
        addMessage(`Cooldown: ${gameState.player.weaponCooldown} turns`);
        return false;
    }
    const weaponId = gameState.equipment.weapon;
    if (!weaponId) { addMessage("No weapon!"); return false; }
    const weapon = itemDatabase[weaponId];
    const pattern = weaponReach[weapon.weaponType];
    let coords = [];
    if (weapon.weaponType === weaponTypes.FLAIL) {
        coords = pattern.pattern.map(([ox, oy]) => ({ x: gameState.player.x + ox, y: gameState.player.y + oy }));
    } else if (weapon.weaponType === weaponTypes.BOW) {
        let distance = 1;
        while (distance <= 10) {
            const tx = gameState.player.x + (dx * distance);
            const ty = gameState.player.y + (dy * distance);
            if (tx < 0 || tx >= gameState.world.width || ty < 0 || ty >= gameState.world.height) break;
            const tile = gameState.world.tiles[ty][tx];
            if (!tileTypes[tile].passable) break;
            coords.push({ x: tx, y: ty });
            if (gameState.enemies.find(e => e.x === tx && e.y === ty)) break;
            distance++;
        }
    } else {
        if (dy < 0) {
            coords = pattern.pattern.filter(([ox, oy]) => ox === 0 && oy < 0).map(([ox, oy]) => ({ x: gameState.player.x + ox, y: gameState.player.y + oy }));
        } else if (dy > 0) {
            coords = pattern.pattern.filter(([ox, oy]) => ox === 0 && oy > 0).map(([ox, oy]) => ({ x: gameState.player.x + ox, y: gameState.player.y + oy }));
        } else if (dx < 0) {
            coords = pattern.pattern.filter(([ox, oy]) => ox < 0 && oy === 0).map(([ox, oy]) => ({ x: gameState.player.x + ox, y: gameState.player.y + oy }));
        } else if (dx > 0) {
            coords = pattern.pattern.filter(([ox, oy]) => ox > 0 && oy === 0).map(([ox, oy]) => ({ x: gameState.player.x + ox, y: gameState.player.y + oy }));
        }
    }
    let hits = 0;
    coords.forEach(coord => {
        const enemy = gameState.enemies.find(e => e.x === coord.x && e.y === coord.y);
        if (enemy) { dealDamage(gameState.player, enemy, false); hits++; }
    });
    if (hits === 0) addMessage("Swing at nothing!");
    gameState.player.weaponCooldown = pattern.cooldown;
    enemyTurn();
    if (gameState.player.weaponCooldown > 0) gameState.player.weaponCooldown--;
    renderWorld();
    updateStatus();
    return true;
}

function dealDamage(attacker, defender, isBump = false) {
    const aStats = attacker === gameState.player ? calculateStats() : attacker;
    const dStats = defender === gameState.player ? calculateStats() : defender;
    let dmg = Math.max(1, (aStats.strength * 2) - dStats.vitality);
    
    if (attacker.weakened) {
        dmg = Math.floor(dmg * (1 - attacker.weakenAmount));
    }
    
    if (attacker === gameState.player && !isBump) dmg = Math.floor(dmg * 1.25);
    const canCrit = (attacker === gameState.player && !isBump) || attacker !== gameState.player;
    if (canCrit) {
        const critChance = aStats.luck * 0.01;
        if (Math.random() < critChance) {
            dmg = Math.floor(dmg * 2);
            addMessage("CRIT!");
        }
    }
    
    if (defender === gameState.player && gameState.player.barrier > 0) {
        const absorbed = Math.min(dmg, gameState.player.barrier);
        gameState.player.barrier -= absorbed;
        dmg -= absorbed;
        addMessage(`Barrier absorbs ${absorbed} damage!`);
        if (gameState.player.barrier <= 0) {
            addMessage("Barrier shattered!");
        }
    }
    
    defender.hp -= dmg;
    const aName = attacker === gameState.player ? 'You' : attacker.name;
    const dName = defender === gameState.player ? 'you' : defender.name;
    const dmgType = isBump ? " (sloppy)" : "";
    if (dmg > 0) addMessage(`${aName} hit ${dName} for ${dmg}${dmgType}!`);
    if (defender.hp <= 0) {
        if (defender === gameState.player) {
            addMessage("DEFEATED!");
            handlePlayerDeath();
        } else {
            handleEnemyDefeat(defender);
        }
    }
}


function rollLoot(tierWeights) {
    const roll = Math.random();
    let cumulative = 0;
    for (const [tier, weight] of Object.entries(tierWeights)) {
        cumulative += weight;
        if (roll < cumulative) {
            const pool = lootPools[tier];
            if (pool && pool.length > 0) {
                return pool[Math.floor(Math.random() * pool.length)];
            }
        }
    }
    return null;
}

function handleEnemyDefeat(enemy) {
    addMessage(`${enemy.name} defeated!`);
    const eData = enemyDatabase[enemy.type];
    gameState.player.xp += eData.xp;
    addMessage(`+${eData.xp} XP!`);
    checkLevelUp();
    
    if (Math.random() < eData.lootChance) {
        const loot = eData.loot;
        const gold = Math.floor(Math.random() * (loot.gold[1] - loot.gold[0] + 1)) + loot.gold[0];
        const items = [];
        
        // Roll for items based on tier system
        for (let i = 0; i < loot.rolls; i++) {
            const item = rollLoot(loot.tierWeights);
            if (item) items.push(item);
        }
        
        if (gold > 0 || items.length > 0) {
            gameState.lootBags.push({ x: enemy.x, y: enemy.y, gold: gold, items: items });
            addMessage("Enemy dropped loot!");
        }
    }
    gameState.enemies = gameState.enemies.filter(e => e.id !== enemy.id);
}

function enemyTurn() {
    if (gameState.player.barrierTurns > 0) {
        gameState.player.barrierTurns--;
        if (gameState.player.barrierTurns <= 0) {
            gameState.player.barrier = 0;
        }
    }
    
    gameState.enemies.forEach(enemy => {
        if (enemy.weakenTurns > 0) {
            enemy.weakenTurns--;
            if (enemy.weakenTurns <= 0) {
                enemy.weakened = false;
                addMessage(`${enemy.name} recovers strength!`);
            }
        }
        
        const distX = Math.abs(enemy.x - gameState.player.x);
        const distY = Math.abs(enemy.y - gameState.player.y);
        const adj = (distX <= 1 && distY <= 1) && !(distX === 0 && distY === 0);
        if (adj && enemy.aggressive) {
            dealDamage(enemy, gameState.player, false);
        } else if (!adj) {
            let mx = 0, my = 0;
            if (enemy.aggressive) {
                mx = enemy.x < gameState.player.x ? 1 : (enemy.x > gameState.player.x ? -1 : 0);
                my = enemy.y < gameState.player.y ? 1 : (enemy.y > gameState.player.y ? -1 : 0);
            } else {
                if (Math.random() < 0.3) {
                    const dirs = [[-1,0], [1,0], [0,-1], [0,1]];
                    const dir = dirs[Math.floor(Math.random() * dirs.length)];
                    mx = dir[0]; my = dir[1];
                }
            }
            if (mx !== 0 || my !== 0) {
                const nx = enemy.x + mx;
                const ny = enemy.y + my;
                if (nx >= 0 && nx < gameState.world.width && ny >= 0 && ny < gameState.world.height) {
                    const tile = gameState.world.tiles[ny][nx];
                    const occ = gameState.enemies.some(e => e.x === nx && e.y === ny);
                    const pThere = nx === gameState.player.x && ny === gameState.player.y;
                    if (tileTypes[tile].passable && !occ && !pThere) {
                        enemy.x = nx; enemy.y = ny;
                    }
                }
            }
        }
    });
}

function handlePlayerDeath() {
	console.log('Current map name:', gameState.currentMap);
    addMessage("=== YOU DIED ===");
    const goldLost = Math.floor(gameState.player.gold * 0.5);
    gameState.player.gold -= goldLost;
    if (goldLost > 0) addMessage(`Lost ${goldLost} gold...`);
    const respawn = { 'Overworld': { x: 10, y: 7 }, 'Dungeon1': { x: 1, y: 1 }, 'town': { x: 7, y: 7 } };
    const pos = respawn[gameState.currentMap];
	console.log('Respawn pos:', pos);
    gameState.player.x = pos.x;
    gameState.player.y = pos.y;
    gameState.player.hp = Math.floor(gameState.player.maxHp * 0.5);
    gameState.combat.inCombat = false;
    gameState.enemies = [];
    gameState.lootBags = [];
    const spawns = enemySpawns[gameState.currentMap];
    if (spawns) { spawns.forEach(spawn => { spawnEnemyAt(spawn.type, spawn.x, spawn.y); }); }
    addMessage(`Respawned with ${gameState.player.hp} HP.`);
    renderWorld();
    updateStatus();
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
    document.getElementById('statAttack').textContent = stats.strength;
    document.getElementById('statDefense').textContent = stats.vitality;
    document.getElementById('statMagic').textContent = stats.intelligence;
    document.getElementById('statSpirit').textContent = stats.spirit;
    document.getElementById('statAgility').textContent = stats.agility;
    document.getElementById('statLuck').textContent = stats.luck;
    
    if (gameState.player.inventory.length === 0) {
        inv.innerHTML = '<div class="slot-empty">No items</div>';
        gameState.selectedItemIndex = -1;
    } else {
        inv.innerHTML = '';
        
        // Track which itemIds are equipped and which we've already marked
        const equippedItemIds = new Set(Object.values(gameState.equipment).filter(x => x !== null));
        const alreadyMarked = new Set();
        
        gameState.player.inventory.forEach((itemId, idx) => {
            const item = itemDatabase[itemId];
            const div = document.createElement('div');
            div.className = 'inventory-item';
            if (idx === gameState.selectedItemIndex) div.classList.add('selected');
            
            // Check if this itemId is equipped AND we haven't marked it yet
            const isEquipped = equippedItemIds.has(itemId) && !alreadyMarked.has(itemId);
            if (isEquipped) alreadyMarked.add(itemId);
            
            const eqText = isEquipped ? ' [EQUIPPED]' : '';
            let typeText = '';
            if (item.type === 'weapon' && item.weaponType) typeText = ` (${item.weaponType})`;
            else if (item.type === 'consumable' && item.onUse) typeText = ' [USE: U]';
            let statsText = '';
            if (item.canEquip) {
                const parts = [];
                if (item.stats.strength !== 0) parts.push(`STR${item.stats.strength > 0 ? '+' : ''}${item.stats.strength}`);
                if (item.stats.vitality !== 0) parts.push(`VIT${item.stats.vitality > 0 ? '+' : ''}${item.stats.vitality}`);
                if (item.stats.intelligence !== 0) parts.push(`INT${item.stats.intelligence > 0 ? '+' : ''}${item.stats.intelligence}`);
                if (item.stats.spirit !== 0) parts.push(`SPR${item.stats.spirit > 0 ? '+' : ''}${item.stats.spirit}`);
                if (item.stats.agility !== 0) parts.push(`AGI${item.stats.agility > 0 ? '+' : ''}${item.stats.agility}`);
                if (item.stats.luck !== 0) parts.push(`LUK${item.stats.luck > 0 ? '+' : ''}${item.stats.luck}`);
                if (parts.length > 0) statsText = `<div class="item-stats">${parts.join(', ')}</div>`;
            }
            div.innerHTML = `<div class="item-name">${item.name}${typeText}${eqText}</div>${statsText}<div class="item-desc">${item.description}</div>`;
            div.addEventListener('click', () => { gameState.selectedItemIndex = idx; updateInventoryDisplay(); });
            inv.appendChild(div);
        });
    }
    
    const slots = ['weapon', 'armor', 'accessory', 'special'];
    slots.forEach(slot => {
        const el = document.getElementById(`${slot}Slot`);
        const eqId = gameState.equipment[slot];
        if (eqId) {
            const item = itemDatabase[eqId];
            el.className = 'slot-equipped';
            el.textContent = item.name;
        } else {
            el.className = 'slot-empty';
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
    
    const slot = item.slot;
    
    // If THIS item type is already equipped, unequip it
    if (gameState.equipment[slot] === itemId) {
        gameState.equipment[slot] = null;
        addMessage(`Unequipped ${item.name}.`);
    } 
    // Check if this itemId is equipped in ANY slot (prevent duplicates)
    else if (Object.values(gameState.equipment).includes(itemId)) {
        addMessage(`You already have a ${item.name} equipped!`);
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
        updateInventoryDisplay();
        updateStatus();
    }
}

function dropItem() {
    if (gameState.selectedItemIndex < 0 || gameState.selectedItemIndex >= gameState.player.inventory.length) {
        addMessage("No item selected.");
        return;
    }
    const itemId = gameState.player.inventory[gameState.selectedItemIndex];
    const item = itemDatabase[itemId];
    
    // Check if item is equipped
    if (Object.values(gameState.equipment).includes(itemId)) {
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
    if (gameState.selectedItemIndex < 0) {
        gameState.selectedItemIndex = gameState.player.inventory.length - 1;
    } else if (gameState.selectedItemIndex >= gameState.player.inventory.length) {
        gameState.selectedItemIndex = 0;
    }
    updateInventoryDisplay();
}

// ===== SHOP =====
function openShop(shopkeeperType) {
    gameState.shopOpen = true;
    gameState.shopMode = 'buy';
    gameState.shopSelectedIndex = 0;
    gameState.currentShopkeeper = shopkeeperType;
    const panel = document.getElementById('shopPanel');
    panel.classList.add('active');
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
    const shopItems = document.getElementById('shopItems');
    document.getElementById('shopGold').textContent = gameState.player.gold;
    if (gameState.shopMode === 'buy') {
        const inventory = shopInventory[gameState.currentShopkeeper];
        if (!inventory || inventory.length === 0) {
            shopItems.innerHTML = '<div class="slot-empty">No items available</div>';
            return;
        }
        shopItems.innerHTML = '';
        inventory.forEach((shopItem, idx) => {
            const item = itemDatabase[shopItem.itemId];
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
    const inventory = shopInventory[gameState.currentShopkeeper];
    if (!inventory || gameState.shopSelectedIndex >= inventory.length) return;
    const shopItem = inventory[gameState.shopSelectedIndex];
    const item = itemDatabase[shopItem.itemId];
    if (gameState.player.gold < shopItem.price) {
        addMessage("Not enough gold!");
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
    const isEquipped = Object.values(gameState.equipment).includes(itemId);
    if (isEquipped) {
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

// ===== JOURNAL =====
function addJournalEntry(title, text) {
    gameState.journal.entries.push({
        title: title,
        text: text,
        timestamp: Date.now()
    });
}

function toggleJournal() {
    gameState.journal.open = !gameState.journal.open;
    gameState.viewMode = gameState.journal.open ? 'journal' : 'game';
    
    if (gameState.journal.open) {
        renderJournal();
    } else {
        // Remove the text overlay when closing journal
        const overlay = document.getElementById('journalTextOverlay');
        if (overlay) {
            overlay.remove();
        }
        renderWorld();
    }
}

// ===== JOURNAL =====
function addJournalEntry(title, blocks) {
    // blocks format: [{ type: 'text', content: '...' }, { type: 'image', sprite: 'goblin', width: 2, height: 2 }]
    gameState.journal.entries.push({
        title: title,
        timestamp: Date.now(),
        blocks: blocks
    });
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
    
    // Clear and draw dimmed background
    //ctx.fillStyle = '#001100';
    //ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Journal dimensions (in tiles)
    const jx = 2, jy = 1, jw = 16, jh = 13;
    
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
    
    // Title
    ctx.fillStyle = '#000';
    ctx.font = 'bold 10px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText(entry.title, contentX, contentY);
    contentY += 20;
    
    // Date
    ctx.font = '7px "Press Start 2P"';
    ctx.fillStyle = '#555';
    ctx.fillText(new Date(entry.timestamp).toLocaleDateString(), contentX, contentY);
    contentY += 25;
    
    // Blocks (text and images)
    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = '#000';
    const maxWidth = (jw - 2) * TILE_SIZE - 40;
    
    entry.blocks.forEach(block => {
        if (block.type === 'text') {
            const lines = wrapText(ctx, block.content, maxWidth);
            lines.forEach(line => {
                ctx.fillText(line, contentX, contentY);
                contentY += 14;
            });
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
            equipment: { weapon: null, armor: null, accessory: null, special: null },
            combat: { inCombat: false, turnCount: 0 },
            spellCasting: { active: false, selectedSpellIndex: 0, pendingSpell: null },
            enemies: [], 
            npcs: [],
            lootBags: [], 
            selectedItemIndex: -1, 
            collectedTreasures: {}, 
            inventoryOpen: false, 
            shopOpen: false,
            shopMode: 'buy',
            shopSelectedIndex: 0,
            currentShopkeeper: null,
            currentMap: 'Overworld', 
            mapStates: {},
            world: { width: gameState.world,width, height: gameState.world.height, tiles: [...maps.Overworld.tiles] }
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

// ===== EVENT HANDLERS =====
document.addEventListener('keydown', function(e) {
    // Spell panel controls
    if (gameState.spellCasting.active) {
        switch(e.key) {
            case 'ArrowUp': e.preventDefault(); moveSpellSelection(-1); break;
            case 'ArrowDown': e.preventDefault(); moveSpellSelection(1); break;
            case 'Enter': case 'c': case 'C': e.preventDefault(); castSpell(); break;
            case 'Escape': case 'm': case 'M': e.preventDefault(); toggleSpellPanel(); break;
        }
        return;
    }
    
    // Directional spell targeting
    if (gameState.spellCasting.pendingSpell) {
        switch(e.key) {
            case 'ArrowUp': e.preventDefault(); castDirectionalSpell(0, -1); break;
            case 'ArrowDown': e.preventDefault(); castDirectionalSpell(0, 1); break;
            case 'ArrowLeft': e.preventDefault(); castDirectionalSpell(-1, 0); break;
            case 'ArrowRight': e.preventDefault(); castDirectionalSpell(1, 0); break;
            case 'Escape': e.preventDefault(); gameState.spellCasting.pendingSpell = null; addMessage("Cancelled."); break;
        }
        return;
    }
    
    if (gameState.shopOpen) {
        switch(e.key) {
            case 'ArrowUp': e.preventDefault(); moveShopSelection(-1); break;
            case 'ArrowDown': e.preventDefault(); moveShopSelection(1); break;
            case 'Enter': case 'a': case 'A': e.preventDefault(); shopConfirm(); break;
            case 'Escape': e.preventDefault(); closeShop(); break;
        }
        return;
    }
    
    if (gameState.inventoryOpen) {
        switch(e.key) {
            case 'ArrowUp': e.preventDefault(); moveSelection(-1); break;
            case 'ArrowDown': e.preventDefault(); moveSelection(1); break;
            case 'e': case 'E': e.preventDefault(); equipItem(); break;
            case 'u': case 'U': e.preventDefault(); useItem(); break;
			case 'd': case 'D': e.preventDefault(); dropItem(); break;
            case 'i': case 'I': e.preventDefault(); toggleInventory(); break;
        }
        return;
    }
    
    if (gameState.combat.inCombat) {
        switch(e.key) {
            case 'ArrowUp': e.preventDefault(); attemptAttack(0, -1); break;
            case 'ArrowDown': e.preventDefault(); attemptAttack(0, 1); break;
            case 'ArrowLeft': e.preventDefault(); attemptAttack(-1, 0); break;
            case 'ArrowRight': e.preventDefault(); attemptAttack(1, 0); break;
            case 'c': case 'C': e.preventDefault(); toggleCombatMode(); break;
        }
        return;
    }
	
	// Add this in the main switch statement (not inside any if blocks)
	if (gameState.journal.open) {
		switch(e.key) {
			case 'ArrowLeft': e.preventDefault(); prevJournalPage(); break;
			case 'ArrowRight': e.preventDefault(); nextJournalPage(); break;
			case 'j': case 'J': case 'Escape': e.preventDefault(); toggleJournal(); break;
    }
    return;
}
    
    switch(e.key) {
        case 'ArrowUp': e.preventDefault(); movePlayer(0, -1); break;
        case 'ArrowDown': e.preventDefault(); movePlayer(0, 1); break;
        case 'ArrowLeft': e.preventDefault(); movePlayer(-1, 0); break;
        case 'ArrowRight': e.preventDefault(); movePlayer(1, 0); break;
        case 'a': case 'A': e.preventDefault(); performAction(); break;
        case 's': case 'S': e.preventDefault(); searchLocation(); break;
        case 'l': case 'L': e.preventDefault(); lookAround(); break;
        case 'i': case 'I': e.preventDefault(); toggleInventory(); break;
        case 'm': case 'M': e.preventDefault(); toggleSpellPanel(); break;
        case 'c': case 'C': e.preventDefault(); toggleCombatMode(); break;
        case 'w': case 'W': case ' ': e.preventDefault(); waitTurn(); break;
		case 'j': case 'J': e.preventDefault(); toggleJournal(); break;
		case 'f': case 'F': e.preventDefault(); gameState.fogOfWarEnabled = !gameState.fogOfWarEnabled; addMessage(gameState.fogOfWarEnabled ? "Fog of war ON" : "Fog of war OFF"); renderWorld(); break;
    }
	
	
});

document.getElementById('exportBtn').addEventListener('click', exportSave);
document.getElementById('importBtn').addEventListener('click', importSave);
document.getElementById('newGameBtn').addEventListener('click', newGame);
document.getElementById('buyModeBtn').addEventListener('click', () => switchShopMode('buy'));
document.getElementById('sellModeBtn').addEventListener('click', () => switchShopMode('sell'));

