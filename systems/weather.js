// ===== WEATHER SYSTEM =====
// Extracted from game.js for better organization

/**
 * Weather particle class - represents individual rain/snow/etc particles
 */
class WeatherParticle {
    constructor(type) {
        this.type = type;
        this.reset();
    }
    
    reset() {
        this.x = Math.random() * VIEWPORT_WIDTH * TILE_SIZE;
        this.y = -TILE_SIZE;
        
        if (this.type === 'rain') {
            this.speed = 8 + Math.random() * 4;
            this.length = 8 + Math.random() * 8;
            this.thickness = 1;
            this.color = CGA.LIGHTGRAY;
            this.alpha = 0.6;
        } else if (this.type === 'snow') {
            this.speed = 1 + Math.random() * 2;
            this.size = 4;
            this.sway = (Math.random() - 0.5) * 0.5;
            this.color = CGA.WHITE;
            this.alpha = 0.9;
        } else if (this.type === 'storm') {
            this.speed = 12 + Math.random() * 7;
            this.length = 12 + Math.random() * 12;
            this.thickness = 2;
            this.color = CGA.CYAN;
            this.alpha = 0.9;
        } else if (this.type === 'acid') {
            this.speed = 6 + Math.random() * 4;
            this.length = 6 + Math.random() * 8;
            this.thickness = 1;
            this.color = CGA.MAGENTA;
            this.alpha = 0.5;
        }
    }
    
    update() {
        this.y += this.speed;
        
        if (this.type === 'snow') {
            this.x += this.sway;
        }
        
        // Reset when off screen
        if (this.y > VIEWPORT_HEIGHT * TILE_SIZE) {
            this.reset();
        }
        
        // Wrap horizontally for snow
        if (this.type === 'snow') {
            if (this.x < 0) this.x = VIEWPORT_WIDTH * TILE_SIZE;
            if (this.x > VIEWPORT_WIDTH * TILE_SIZE) this.x = 0;
        }
    }
    
    draw(ctx) {
        const oldAlpha = ctx.globalAlpha;
        ctx.globalAlpha = this.alpha;
        
        if (this.type === 'rain' || this.type === 'storm' || this.type === 'acid') {
            // Draw as pixelated vertical lines (stack of squares)
            ctx.fillStyle = this.color;
            const pixels = Math.floor(this.length / 3); // How many pixels tall
            
            for (let i = 0; i < pixels; i++) {
                ctx.fillRect(
                    Math.floor(this.x), 
                    Math.floor(this.y + (i * 3)), 
                    4,  // 2 pixels wide
                    4   // 3 pixels tall per segment
                );
            }
        } else if (this.type === 'snow') {
            // Draw as pixels/small squares (already pixelated!)
            ctx.fillStyle = this.color;
            const pixelSize = Math.floor(this.size);
            ctx.fillRect(Math.floor(this.x), Math.floor(this.y), pixelSize, pixelSize);
        }
        
        ctx.globalAlpha = oldAlpha;
    }
}

/**
 * Set weather type and initialize particles
 * @param {string} type - 'none', 'rain', 'snow', 'storm', 'acid'
 * @param {number} particleCount - Optional particle count override
 */
function setWeather(type, particleCount = null) {
    // Stop existing animation
    if (gameState.weather.animationFrame) {
        cancelAnimationFrame(gameState.weather.animationFrame);
        gameState.weather.animationFrame = null;
    }
    
    // Update game flags for weather-dependent events
    if (!gameState.flags) gameState.flags = {};
    gameState.flags.is_raining = (type === 'rain');
    gameState.flags.is_snowing = (type === 'snow');
    gameState.flags.is_storming = (type === 'storm');
    
    gameState.weather.type = type;
    gameState.weather.particles = [];
    gameState.weather.lightningTimer = 0;
    
    if (type === 'none') {
        renderWorld(); // Clear any remaining particles
        return;
    }
    
    // Default particle counts
    if (!particleCount) {
        switch(type) {
            case 'rain': particleCount = 120; break;
            case 'snow': particleCount = 60; break;
            case 'storm': particleCount = 150; break;
            case 'acid': particleCount = 80; break;
            default: particleCount = 100;
        }
    }
    
    // Create particles spread across screen
    for (let i = 0; i < particleCount; i++) {
        const p = new WeatherParticle(type);
        p.y = Math.random() * VIEWPORT_HEIGHT * TILE_SIZE;
        gameState.weather.particles.push(p);
    }
    
    // Start animation
    gameState.weather.lastUpdate = performance.now();
    gameState.weather.animationFrame = requestAnimationFrame(animateWeather);
    
    console.log(`Weather set to: ${type} (${particleCount} particles)`);
}

/**
 * Animation loop for weather particles
 */
function animateWeather(timestamp) {
    if (gameState.weather.type === 'none') return;
    
    const delta = timestamp - gameState.weather.lastUpdate;
    
    // Update at ~60fps
    if (delta > 16) {
        // Update particles
        gameState.weather.particles.forEach(p => p.update());
        
        // Check for lightning in storms
        if (gameState.weather.type === 'storm') {
            gameState.weather.lightningTimer++;
            
            // Lightning every 180-480 frames (3-8 seconds at 60fps)
            if (gameState.weather.lightningTimer > (400 + Math.random() * 300)) {
                flashLightning();
                gameState.weather.lightningTimer = 0;
            }
        }
        
        // Re-render world with weather
        renderWorld();
        
        gameState.weather.lastUpdate = timestamp;
    }
    
    // Continue animation
    gameState.weather.animationFrame = requestAnimationFrame(animateWeather);
}

/**
 * Render weather particles on top of the world
 * Called by renderWorld() in rendering.js
 */
function renderWeather() {
    if (!gameState.weather || gameState.weather.type === 'none') return;
    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    gameState.weather.particles.forEach(p => p.draw(ctx));
}

/**
 * Flash lightning effect for storms
 */
function flashLightning() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Bright white flash
    ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Hold the flash longer, then fade
    setTimeout(() => {
        // Second flash (dimmer)
        ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        setTimeout(() => {
            renderWorld(); // Back to normal
        }, 180);
    }, 300);
    
    // Thunder message
    if (Math.random() < 0.5) {
        addMessage('*CRACK*', CGA.WHITE);
    } else {
        addMessage('*BOOM*', CGA.WHITE);
    }
}

/**
 * Cycle through weather types (debug/testing function)
 */
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