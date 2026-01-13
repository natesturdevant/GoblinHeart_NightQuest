// ===== RENDERING SYSTEM =====
// Extracted from game.js for better organization
// Handles all visual rendering, camera, and fade effects

/**
 * Calculate camera position to center on player
 * Clamps to world boundaries to prevent showing off-map areas
 * @returns {Object} - Camera position {x, y} in tile coordinates
 */
 
const TILE_SIZE = 24;
const VIEWPORT_WIDTH = 20;
const VIEWPORT_HEIGHT = 15;
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 360;
 
 
function getCameraPosition() {
    let camX = gameState.player.x - Math.floor(VIEWPORT_WIDTH / 2);
    let camY = gameState.player.y - Math.floor(VIEWPORT_HEIGHT / 2);
    camX = Math.max(0, Math.min(camX, gameState.world.width - VIEWPORT_WIDTH));
    camY = Math.max(0, Math.min(camY, gameState.world.height - VIEWPORT_HEIGHT));
    
    return { x: camX, y: camY };
}

let fogAnimationInProgress = false;

//============================================================================================
//  WORMHOLE EFFECT
//============================================================================================

// Wormhole effect state
let wormholeEffect = {
    active: false,
    particles: [],
    centerX: 0,
    centerY: 0,
    startTime: 0,
    duration: 4000, // 4 seconds
    onComplete: null
};

function startWormholeEffect(onComplete) {
    wormholeEffect.active = true;
    wormholeEffect.startTime = Date.now();
    wormholeEffect.onComplete = onComplete;
    wormholeEffect.particles = [];
    
    // Center of screen in tiles
    wormholeEffect.centerX = CANVAS_WIDTH / (2 * TILE_SIZE);
    wormholeEffect.centerY = CANVAS_HEIGHT / (2 * TILE_SIZE);
    
    // Create particles from all visible tiles
    for (let ty = 0; ty < Math.ceil(CANVAS_HEIGHT / TILE_SIZE); ty++) {
        for (let tx = 0; tx < Math.ceil(CANVAS_WIDTH / TILE_SIZE); tx++) {
            const worldX = tx;
            const worldY = ty;
            
            if (worldY >= 0 && worldY < gameState.world.height &&
                worldX >= 0 && worldX < gameState.world.width) {
                
                const tileChar = gameState.world.tiles[worldY][worldX];
                const sprite = tileTypes[tileChar]?.sprite || 'grass';
                
                // Calculate angle and distance from center
                const dx = tx - wormholeEffect.centerX;
                const dy = ty - wormholeEffect.centerY;
                const angle = Math.atan2(dy, dx);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                wormholeEffect.particles.push({
                    x: tx * TILE_SIZE,
                    y: ty * TILE_SIZE,
                    sprite: sprite,
                    angle: angle,
                    distance: distance,
                    orbitSpeed: 0.02 + Math.random() * 0.03, // Random spiral speed
                    pullSpeed: distance * 0.3, // Faster pull for further tiles
                    alpha: 1.0
                });
            }
        }
    }
    
    animateWormhole();
}

function animateWormhole() {
    if (!wormholeEffect.active) return;
    
    const elapsed = Date.now() - wormholeEffect.startTime;
    const progress = Math.min(elapsed / wormholeEffect.duration, 1.0);
    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Clear
    ctx.fillStyle = CGA.BLACK;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    wormholeEffect.particles.forEach(particle => {
        // Spiral inward
        particle.angle += particle.orbitSpeed;
        //particle.distance = Math.max(0, particle.distance - particle.pullSpeed * progress);
		particle.distance = Math.max(0, particle.distance - particle.pullSpeed * progress * 0.3);
        
        // Calculate new position
        const centerPixelX = wormholeEffect.centerX * TILE_SIZE;
        const centerPixelY = wormholeEffect.centerY * TILE_SIZE;
        
        particle.x = centerPixelX + Math.cos(particle.angle) * particle.distance * TILE_SIZE;
        particle.y = centerPixelY + Math.sin(particle.angle) * particle.distance * TILE_SIZE;
        
        // Fade out as they reach center
        particle.alpha = Math.max(0, 1 - (progress * 2));
        
        // Draw tile sprite
        ctx.globalAlpha = particle.alpha;
        const img = spriteImages[particle.sprite];
        if (img && img.complete) {
            ctx.drawImage(img, particle.x, particle.y, TILE_SIZE, TILE_SIZE);
        }
    });
    
    ctx.globalAlpha = 1.0;
    

    
    // Continue animation or complete
    if (progress < 1.0) {
        requestAnimationFrame(animateWormhole);
    } else {
        wormholeEffect.active = false;
        if (wormholeEffect.onComplete) {
            wormholeEffect.onComplete();
        }
    }
}
//==========================================================================
//  WORMHOLE EFFECT END
//==========================================================================

/**
 * Main rendering function - draws entire game world
 * Handles tiles, entities, NPCs, enemies, player, weather, fog of war, and weapon preview
 */
function renderWorld() {
    // Handle journal view mode
	
	//console.log('spriteImages exists?', typeof spriteImages !== 'undefined');
    //console.log('spriteImages keys:', spriteImages ? Object.keys(spriteImages).length : 0);
    //console.log('grass sprite:', spriteImages?.grass);
	
    if (gameState.viewMode === 'journal') {
        renderJournal();
        return;
    }
    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
	//console.log('Canvas size:', canvas.width, 'x', canvas.height);
    //console.log('Canvas visible?', canvas.offsetWidth, canvas.offsetHeight);
	
    const camera = getCameraPosition();
    
    // Clear with dark background
    ctx.fillStyle = '#001100';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	// Clear with dark background
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
				
							if (worldX === gameState.player.x && worldY === gameState.player.y) {
							console.log('Player tile:', {
								tileChar,
								tileType,
								sprite: tileType?.sprite,
								img: spriteImages[tileType?.sprite],
								imgComplete: spriteImages[tileType?.sprite]?.complete
							});
							}
				
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
                
                // Elite indicator - red border
                if (enemy.isElite) {
                    ctx.strokeStyle = '#FF0000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(viewX * TILE_SIZE + 1, viewY * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                }
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
    
    // Render weather (from weather.js)
    renderWeather();
    
    // Render weapon preview (from combat.js)
    renderWeaponPreview();
    
    // Render fog of war
    if (gameState.fogOfWarEnabled) {
        const mapKey = gameState.currentMap;
        const explored = gameState.exploredTiles[mapKey] || new Set();
        
        // Iterate over the viewport tiles
        for (let viewY = 0; viewY < VIEWPORT_HEIGHT; viewY++) {
            for (let viewX = 0; viewX < VIEWPORT_WIDTH; viewX++) {
                const worldX = viewX + camera.x;
                const worldY = viewY + camera.y;
                const key = `${worldX},${worldY}`;
                
                // Only draw fog if the tile has not been explored
                if (!explored.has(key)) {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(viewX * TILE_SIZE, viewY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }
}

// ===== FADE EFFECTS =====

/**
 * Fade effect that progressively covers tiles in a color
 * Creates a cascading reveal/conceal effect radiating from player
 * @param {string} color - CGA color name: 'BLACK', 'WHITE', 'CYAN', 'MAGENTA'
 * @param {boolean} inward - true = fade to player, false = fade from player
 * @param {number} speed - milliseconds between tiers (default 100)
 * @param {function} callback - optional callback when fade completes
 */
function fadeEffect(color = 'BLACK', inward = true, speed = 100, callback = null) {
    const mapKey = gameState.currentMap;
    const mapData = maps[mapKey];
    if (!mapData) return;
    
    // Lock player input during fade
    gameState.fadeInProgress = true;
    
    const fadeColor = CGA[color] || CGA.BLACK;
    
    // Create temporary fade overlay storage
    if (!gameState.fadeOverlay) {
        gameState.fadeOverlay = {};
    }
    gameState.fadeOverlay[mapKey] = new Set();
    
    // Get camera bounds
    const camera = getCameraPosition();
    const viewMinX = camera.x;
    const viewMinY = camera.y;
    const viewMaxX = camera.x + VIEWPORT_WIDTH;
    const viewMaxY = camera.y + VIEWPORT_HEIGHT;
    
    // Group ONLY VISIBLE tiles by distance from player
    const groupedByDistance = new Map();
    
    for (let y = viewMinY; y < viewMaxY; y++) {
        for (let x = viewMinX; x < viewMaxX; x++) {
            // Make sure we're within map bounds
            if (x >= 0 && x < mapData.tiles[0].length && 
                y >= 0 && y < mapData.tiles.length) {
                
                const key = `${x},${y}`;
                const distance = Math.round(Math.hypot(x - gameState.player.x, y - gameState.player.y));
                
                if (!groupedByDistance.has(distance)) {
                    groupedByDistance.set(distance, []);
                }
                groupedByDistance.get(distance).push(key);
            }
        }
    }
    
    // Sort distances
    const sortedDistances = Array.from(groupedByDistance.keys()).sort((a, b) => 
        inward ? b - a : a - b  // Reverse order if fading inward
    );
    
    let delay = 0;
    
    sortedDistances.forEach(distance => {
        const tilesInTier = groupedByDistance.get(distance);
        
        setTimeout(() => {
            if (gameState.currentMap !== mapKey) return;
            
            // Add tiles to fade overlay
            tilesInTier.forEach(key => {
                gameState.fadeOverlay[mapKey].add(key);
            });
            
            // Render with fade overlay
            renderWorldWithFade(fadeColor);
            
            // If this is the last tier, call callback
            if (distance === sortedDistances[sortedDistances.length - 1]) {
                if (callback) {
                    setTimeout(() => {
                        callback();
                        // Unlock player input after callback completes
                        gameState.fadeInProgress = false;
                    }, speed);
                } else {
                    // No callback, unlock immediately after last tier
                    setTimeout(() => {
                        gameState.fadeInProgress = false;
                    }, speed);
                }
            }
        }, delay);
        
        delay += speed;
    });
}

/**
 * Render world with fade overlay applied
 * Called by fadeEffect to show progressive fade
 * @param {string} fadeColor - Color to fade with
 */
function renderWorldWithFade(fadeColor) {
    // Call normal render first
    renderWorld();
    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const camera = getCameraPosition();
    const mapKey = gameState.currentMap;
    
    if (!gameState.fadeOverlay || !gameState.fadeOverlay[mapKey]) return;
    
    const fadedTiles = gameState.fadeOverlay[mapKey];
    
    // Draw fade overlay
    for (let viewY = 0; viewY < VIEWPORT_HEIGHT; viewY++) {
        for (let viewX = 0; viewX < VIEWPORT_WIDTH; viewX++) {
            const worldX = viewX + camera.x;
            const worldY = viewY + camera.y;
            const key = `${worldX},${worldY}`;
            
            if (fadedTiles.has(key)) {
                ctx.fillStyle = fadeColor;
                ctx.fillRect(viewX * TILE_SIZE, viewY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

/**
 * Clear the fade overlay and unlock player input
 */
function clearFade() {
    if (gameState.fadeOverlay) {
        gameState.fadeOverlay[gameState.currentMap] = new Set();
    }
    gameState.fadeInProgress = false;
    renderWorld();
}

// ===== CONVENIENCE FADE FUNCTIONS =====

/**
 * Fade to black (inward from edges)
 * @param {function} callback - Optional callback when fade completes
 */
function fadeToBlack(callback) {
    fadeEffect('BLACK', true, 80, callback);
}

/**
 * Fade from black (outward from player)
 * @param {function} callback - Optional callback when fade completes
 */
function fadeFromBlack(callback) {
    fadeEffect('BLACK', false, 80, callback);
}

/**
 * Fade to white (inward from edges)
 * @param {function} callback - Optional callback when fade completes
 */
function fadeToWhite(callback) {
    fadeEffect('WHITE', true, 80, callback);
}

/**
 * Fade from white (outward from player)
 * @param {function} callback - Optional callback when fade completes
 */
function fadeFromWhite(callback) {
    fadeEffect('WHITE', false, 80, callback);
}

/**
 * Fade out then fade in (useful for transitions)
 * @param {string} color - Color to fade with (default 'BLACK')
 * @param {function} callback - Optional callback between fade out/in
 */
function fadeOutIn(color = 'BLACK', callback = null) {
    fadeEffect(color, true, 80, () => {
        setTimeout(() => {
            clearFade();
            if (callback) callback();
        }, 200);
    });
}