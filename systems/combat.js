// ===== COMBAT SYSTEM =====
// Extracted from game.js for better organization
// Handles all combat mechanics, damage calculation, and enemy AI

/**
 * Toggle tactical combat mode
 * Enables precise weapon targeting and +25% damage bonus
 */
function toggleCombatMode() {
    gameState.combat.inCombat = !gameState.combat.inCombat;
    
    if (gameState.combat.inCombat) {
        addMessage("=== TACTICAL MODE ===");
        addMessage("Arrows to attack. +25% dmg!");
        
        // Only enable if config allows
        if (CONFIG.ui.showWeaponPreview) {
            gameState.weaponPreview.active = true;
            updateWeaponPreview();
        }
    } else {
        addMessage("Tactical OFF.");
        gameState.weaponPreview.active = false;
        gameState.weaponPreview.tiles = [];
    }
    
    renderWorld();
}

/**
 * Update weapon preview to show attack range
 * Calculates all tiles that current weapon can hit
 */
function updateWeaponPreview() {
    gameState.weaponPreview.tiles = [];
    
    const weaponId = gameState.equipment.weapon;
    if (!weaponId) {
        addMessage("No weapon equipped!");
        return;
    }
    
    const weapon = itemDatabase[weaponId];
    const pattern = weaponReach[weapon.weaponType];
    
    if (weapon.weaponType === weaponTypes.FLAIL) {
        // Flail hits all adjacent tiles
        pattern.pattern.forEach(([ox, oy]) => {
            const tx = gameState.player.x + ox;
            const ty = gameState.player.y + oy;
            if (tx >= 0 && tx < gameState.world.width && 
                ty >= 0 && ty < gameState.world.height) {
                gameState.weaponPreview.tiles.push({ x: tx, y: ty });
            }
        });
        
    } else if (weapon.weaponType === weaponTypes.BOW) {
        // Bow shoots in 4 directions until obstacle
        const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        
        directions.forEach(([dx, dy]) => {
            for (let distance = 1; distance <= 10; distance++) {
                const tx = gameState.player.x + (dx * distance);
                const ty = gameState.player.y + (dy * distance);
                
                // Check bounds
                if (tx < 0 || tx >= gameState.world.width || 
                    ty < 0 || ty >= gameState.world.height) {
                    break;
                }
                
                // Check if tile blocks projectiles
                const tile = gameState.world.tiles[ty][tx];
                if (!tileTypes[tile].passable) {
                    break;
                }
                
                gameState.weaponPreview.tiles.push({ x: tx, y: ty });
                
                // Stop at first enemy (arrow hits it)
                if (gameState.enemies.find(e => e.x === tx && e.y === ty)) {
                    break;
                }
            }
        });
        
    } else {
        // Standard melee weapons (sword, dagger, axe, staff, mace)
        // Show all tiles in their pattern
        pattern.pattern.forEach(([ox, oy]) => {
            const tx = gameState.player.x + ox;
            const ty = gameState.player.y + oy;
            if (tx >= 0 && tx < gameState.world.width && 
                ty >= 0 && ty < gameState.world.height) {
                gameState.weaponPreview.tiles.push({ x: tx, y: ty });
            }
        });
    }
}

/**
 * Render weapon preview overlay on canvas
 * Shows magenta borders around attackable tiles with pulsing effect
 */
function renderWeaponPreview() {
    if (!gameState.weaponPreview.active || 
        gameState.weaponPreview.tiles.length === 0) {
        return;
    }
    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const camera = getCameraPosition();
    
    // Create pulsing effect - oscillate between 0.4 and 0.9 alpha
    const time = Date.now() / 200;  // Adjust speed here (lower = faster)
    const pulse = 0.4 + (Math.abs(Math.sin(time)) * 0.5);
    
    gameState.weaponPreview.tiles.forEach(tile => {
        const viewX = tile.x - camera.x;
        const viewY = tile.y - camera.y;
        
        // Only render if tile is visible on screen
        if (viewX >= 0 && viewX < VIEWPORT_WIDTH && 
            viewY >= 0 && viewY < VIEWPORT_HEIGHT) {
            
            // Check if enemy is on this tile (for extra emphasis)
            const hasEnemy = gameState.enemies.some(e => e.x === tile.x && e.y === tile.y);
            
            if (hasEnemy) {
                // Enemy in range - draw filled rectangle with transparency
                ctx.fillStyle = CGA.MAGENTA;
                ctx.globalAlpha = pulse * 0.3;  // Subtle fill
                ctx.fillRect(
                    viewX * TILE_SIZE, 
                    viewY * TILE_SIZE, 
                    TILE_SIZE, 
                    TILE_SIZE
                );
            }
            
            // Draw border
            ctx.strokeStyle = CGA.MAGENTA;
            ctx.lineWidth = 2;
            ctx.globalAlpha = pulse;
            ctx.strokeRect(
                viewX * TILE_SIZE + 1, 
                viewY * TILE_SIZE + 1, 
                TILE_SIZE - 2, 
                TILE_SIZE - 2
            );
            
            // Reset alpha
            ctx.globalAlpha = 1.0;
        }
    });
}

/**
 * Attempt attack in direction (dx, dy) using equipped weapon
 * Handles weapon reach, cooldowns, and different weapon types
 * @param {number} dx - X direction (-1, 0, or 1)
 * @param {number} dy - Y direction (-1, 0, or 1)
 * @returns {boolean} - True if attack was executed
 */
function attemptAttack(dx, dy) {
    if (gameState.player.weaponCooldown > 0) {
        addMessage(`Cooldown: ${gameState.player.weaponCooldown} turns`);
        return false;
    }
    
    const weaponId = gameState.equipment.weapon;
    if (!weaponId) { 
        addMessage("No weapon!"); 
        return false; 
    }
    
    const weapon = itemDatabase[weaponId];
    const pattern = weaponReach[weapon.weaponType];
    let coords = [];
    
    if (weapon.weaponType === weaponTypes.FLAIL) {
        // Flail hits all adjacent tiles
        coords = pattern.pattern.map(([ox, oy]) => ({ 
            x: gameState.player.x + ox, 
            y: gameState.player.y + oy 
        }));
    } else if (weapon.weaponType === weaponTypes.BOW) {
        // Bow shoots in a line until obstacle
        let distance = 1;
        while (distance <= 10) {
            const tx = gameState.player.x + (dx * distance);
            const ty = gameState.player.y + (dy * distance);
            
            if (tx < 0 || tx >= gameState.world.width || 
                ty < 0 || ty >= gameState.world.height) break;
            
            const tile = gameState.world.tiles[ty][tx];
            if (!tileTypes[tile].passable) break;
            
            coords.push({ x: tx, y: ty });
            
            if (gameState.enemies.find(e => e.x === tx && e.y === ty)) break;
            distance++;
        }
    } else {
        // Standard melee weapons - hit in direction
        if (dy < 0) {
            coords = pattern.pattern.filter(([ox, oy]) => ox === 0 && oy < 0)
                .map(([ox, oy]) => ({ x: gameState.player.x + ox, y: gameState.player.y + oy }));
        } else if (dy > 0) {
            coords = pattern.pattern.filter(([ox, oy]) => ox === 0 && oy > 0)
                .map(([ox, oy]) => ({ x: gameState.player.x + ox, y: gameState.player.y + oy }));
        } else if (dx < 0) {
            coords = pattern.pattern.filter(([ox, oy]) => ox < 0 && oy === 0)
                .map(([ox, oy]) => ({ x: gameState.player.x + ox, y: gameState.player.y + oy }));
        } else if (dx > 0) {
            coords = pattern.pattern.filter(([ox, oy]) => ox > 0 && oy === 0)
                .map(([ox, oy]) => ({ x: gameState.player.x + ox, y: gameState.player.y + oy }));
        }
    }
    
    // Attack all enemies in range
    let hits = 0;
    coords.forEach(coord => {
        const enemy = gameState.enemies.find(e => e.x === coord.x && e.y === coord.y);
        if (enemy) { 
            dealDamage(gameState.player, enemy, false); 
            hits++; 
        }
    });
    
    if (hits === 0) addMessage("Swing at nothing!");
    
    gameState.player.weaponCooldown = pattern.cooldown;
    enemyTurn();
    
    if (gameState.player.weaponCooldown > 0) gameState.player.weaponCooldown--;
    
    if (gameState.combat.inCombat && gameState.weaponPreview.active) {
        updateWeaponPreview();
    }
    
    renderWorld();
    updateStatus();
    return true;
}

/**
 * Calculate and apply damage from attacker to defender
 * Handles crits, weakening, barriers, and damage multipliers
 * @param {Object} attacker - Attacker entity (player or enemy)
 * @param {Object} defender - Defender entity (player or enemy)
 * @param {boolean} isBump - Whether this is a bump attack (no bonus damage)
 */
function dealDamage(attacker, defender, isBump = false) {
    const aStats = attacker === gameState.player ? calculateStats() : attacker;
    const dStats = defender === gameState.player ? calculateStats() : defender;
    let dmg = Math.max(1, (aStats.strength * 2) - dStats.vitality);
    
    // Apply enemy damage knob when enemy attacks player
    if (attacker !== gameState.player && defender === gameState.player) {
        dmg = Math.floor(dmg * BALANCE_KNOBS.enemyDamageMultiplier);
    }
    
    // Apply enrage bonus
    if (attacker.enraged?.active) {
        dmg = Math.floor(dmg * attacker.enraged.damageBonus);
    }
    
    // Apply weakening debuff
    if (attacker.weakened) {
        dmg = Math.floor(dmg * (1 - attacker.weakenAmount));
    }
    
    // Tactical mode bonus (+25% damage)
    if (attacker === gameState.player && !isBump) dmg = Math.floor(dmg * 1.25);
    
    // Critical hit chance
    const canCrit = (attacker === gameState.player && !isBump) || attacker !== gameState.player;
    if (canCrit) {
        const critChance = aStats.luck * 0.01;
        if (Math.random() < critChance) {
            dmg = Math.floor(dmg * 2);
            addMessage("CRIT!");
        }
    }
    
    // Handle player barrier
    if (defender === gameState.player && gameState.player.barrier > 0) {
        const absorbed = Math.min(dmg, gameState.player.barrier);
        gameState.player.barrier -= absorbed;
        dmg -= absorbed;
        addMessage(`Barrier absorbs ${absorbed} damage!`);
        if (gameState.player.barrier <= 0) {
            addMessage("Barrier shattered!");
        }
    }
    
    // Apply damage
    defender.hp -= dmg;
    const aName = attacker === gameState.player ? 'You' : attacker.name;
    const dName = defender === gameState.player ? 'you' : defender.name;
    const dmgType = isBump ? " (sloppy)" : "";
    
    if (dmg > 0) addMessage(`${aName} hit ${dName} for ${dmg}${dmgType}!`);
    
    // Handle death
    if (defender.hp <= 0) {
        if (defender === gameState.player) {
            addMessage("DEFEATED!");
            handlePlayerDeath();
        } else {
            handleEnemyDefeat(defender);
        }
    }
}

/**
 * Handle enemy defeat - award XP, drop loot
 * @param {Object} enemy - Defeated enemy object
 */
function handleEnemyDefeat(enemy) {
    addMessage(`${enemy.name} defeated!`);
    const eData = enemyDatabase[enemy.type];
    
    console.log('Enemy defeated:', enemy.type);
    console.log('Enemy data:', eData);
    console.log('Loot chance:', eData.lootChance);
    
    // Award XP with multiplier
    const xpGain = Math.floor(eData.xp * BALANCE_KNOBS.xpMultiplier);
    gameState.player.xp += xpGain;
    addMessage(`+${xpGain} XP!`);
    checkLevelUp();
    
    // Roll for loot
    const lootRoll = Math.random();
    console.log('Loot roll:', lootRoll, 'vs', eData.lootChance);
    
    if (lootRoll < eData.lootChance) {
        console.log('LOOT DROPPED!');
        const lootConfig = eData.loot;
        console.log('Loot config:', lootConfig);
        
        // Gold with multiplier
        const baseGold = Math.floor(Math.random() * (lootConfig.gold[1] - lootConfig.gold[0] + 1)) + lootConfig.gold[0];
        const gold = Math.floor(baseGold * BALANCE_KNOBS.goldMultiplier);
        const items = [];
        
        // Roll for items
        for (let i = 0; i < lootConfig.rolls; i++) {
            console.log('Rolling for item', i + 1);
            const item = rollLoot(lootConfig.tierWeights);
            console.log('Rolled item:', item);
            if (item) items.push(item);
        }
        
        console.log('Total gold:', gold, 'Total items:', items);
        
        // Create loot bag if we got anything
        if (gold > 0 || items.length > 0) {
            gameState.lootBags.push({ 
                x: enemy.x, 
                y: enemy.y, 
                gold: gold, 
                items: items 
            });
            
            console.log('Loot bag created at', enemy.x, enemy.y);
            console.log('Current loot bags:', gameState.lootBags);
            
            if (gold > 0) {
                addMessage(`+${gold} gold!`);
            }
            
            items.forEach(itemId => {
                const item = itemDatabase[itemId];
                console.log('Item from database:', item);
                if (item) {
                    const rarity = item.rarity || 'common';
                    const color = RARITY_COLORS[rarity];
                    console.log('Adding message for', item.name, 'with color', color);
                    addMessage(`${item.name} dropped!`, color);
                }
            });
        }
    } else {
        console.log('No loot this time');
    }
    
    // Remove enemy from game
    gameState.enemies = gameState.enemies.filter(e => e.id !== enemy.id);
}

/**
 * Enemy AI turn - process all enemy actions
 * Handles movement, attacking, special abilities, and status effects
 */
function enemyTurn() {
    // Handle player barrier duration
    if (gameState.player.barrierTurns > 0) {
        gameState.player.barrierTurns--;
        if (gameState.player.barrierTurns <= 0) {
            gameState.player.barrier = 0;
        }
    }
    
    // Process each enemy
    gameState.enemies.forEach(enemy => {
        // Handle enraged status
        if (enemy.enraged?.active) {
            enemy.enraged.turnsRemaining--;
            if (enemy.enraged.turnsRemaining <= 0) {
                enemy.enraged.active = false;
                addMessage(`${enemy.name}'s rage subsides.`);
            }
        }
        
        // Try to use special ability first
        if (enemy.specialAbility?.effect) {
            if (enemy.specialAbility.effect(enemy)) {
                return; // Skip normal turn if ability activated
            }
        }
        
        // Handle weaken status
        if (enemy.weakenTurns > 0) {
            enemy.weakenTurns--;
            if (enemy.weakenTurns <= 0) {
                enemy.weakened = false;
                addMessage(`${enemy.name} recovers strength!`);
            }
        }
        
        // Calculate distance to player
        const distX = Math.abs(enemy.x - gameState.player.x);
        const distY = Math.abs(enemy.y - gameState.player.y);
        const adj = (distX <= 1 && distY <= 1) && !(distX === 0 && distY === 0);
        
        // If adjacent and aggressive, attack
        if (adj && enemy.aggressive) {
            dealDamage(enemy, gameState.player, false);
        } else if (!adj) {
            // Not adjacent, so try to move
            let mx = 0, my = 0;
            
            if (enemy.aggressive) {
                // Move toward player
                mx = enemy.x < gameState.player.x ? 1 : (enemy.x > gameState.player.x ? -1 : 0);
                my = enemy.y < gameState.player.y ? 1 : (enemy.y > gameState.player.y ? -1 : 0);
            } else {
                // Random movement
                if (Math.random() < 0.3) {
                    const dirs = [[-1,0], [1,0], [0,-1], [0,1]];
                    const dir = dirs[Math.floor(Math.random() * dirs.length)];
                    mx = dir[0]; 
                    my = dir[1];
                }
            }
            
            // Try to move if we have a direction
            if (mx !== 0 || my !== 0) {
                const nx = enemy.x + mx;
                const ny = enemy.y + my;
                
                // Check if new position is valid
                if (nx >= 0 && nx < gameState.world.width && ny >= 0 && ny < gameState.world.height) {
                    const tile = gameState.world.tiles[ny][nx];
                    const occ = gameState.enemies.some(e => e.x === nx && e.y === ny);
                    const pThere = nx === gameState.player.x && ny === gameState.player.y;
                    
                    if (tileTypes[tile].passable && !occ && !pThere) {
                        enemy.x = nx; 
                        enemy.y = ny;
                    }
                }
            }
        }
    });
}

/**
 * Handle player death - apply penalties and respawn
 */


function handlePlayerDeath() {
    console.log('Current map name:', gameState.currentMap);
    addMessage("=== YOU DIED ===");
    
    // Gold penalty
    const goldLost = Math.floor(gameState.player.gold * 0.5);
    gameState.player.gold -= goldLost;
    if (goldLost > 0) addMessage(`Lost ${goldLost} gold...`);  // FIXED
    
    // Respawn locations
    const respawn = { 
        'Overworld': { x: 10, y: 7 }, 
        'Dungeon1': { x: 1, y: 1 }, 
        'town': { x: 7, y: 7 } 
    };
    //const pos = respawn[gameState.currentMap];
    //console.log('Respawn pos:', pos);
	
	const pos = respawn[gameState.currentMap] || { x: 10, y: 7 };  // FIXED - fallback to Overworld
    console.log('Respawn pos:', pos);
    
    gameState.player.x = pos.x;
    gameState.player.y = pos.y;
    gameState.player.hp = Math.floor(gameState.player.maxHp * 0.5);
    
    // Reset combat state
    gameState.combat.inCombat = false;
    gameState.weaponPreview.active = false;
    gameState.weaponPreview.tiles = [];
    
    // Clear all enemies and loot
    gameState.enemies = [];
    gameState.lootBags = [];
    
    // Respawn initial enemies
    const spawns = enemySpawns[gameState.currentMap];
    if (spawns) { 
        spawns.forEach(spawn => { 
            spawnEnemyAt(spawn.type, spawn.x, spawn.y); 
        }); 
    }
    
    addMessage(`Respawned with ${gameState.player.hp} HP.`);  // FIXED
    renderWorld();
    updateStatus();
}