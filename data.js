// Game Configuration

console.log('=== DATA.JS IS LOADING ===');
const CONFIG = {
    player: {
        startHP: 100,
        startMP: 50,
        startGold: 0,
        baseStats: { strength: 10, vitality: 8, intelligence: 6, spirit: 7, agility: 5, luck: 4 }
    },
    spawning: { enabled: true, checkInterval: 1, baseChance: 0.08 },
    leveling: {
        xpFormula: (level) => Math.floor(Math.pow(level, 2.5) * 10),
        statGains: { maxHp: 15, maxMp: 5, strength: 2, vitality: 1, intelligence: 1, spirit: 1, agility: 1, luck: 0 },
        milestones: {
            10: { strength: 5, vitality: 3 },
            20: { strength: 5, intelligence: 5, vitality: 3 },
            30: { maxHp: 50, maxMp: 20, strength: 10 },
            40: { strength: 10, vitality: 5, spirit: 5 },
            50: { maxHp: 100, strength: 15, intelligence: 10 },
            60: { strength: 20, vitality: 10, intelligence: 15, spirit: 10 }
        }
    },
    saveVersion: 'v7_ldtk'
};

// Color Palette
const CGA = {
    BLACK: '#000000',
    WHITE: '#FFFFFF',
    CYAN: '#00FFFF',
    MAGENTA: '#FF00FF',
    BROWN: '#AA5500',
    LIGHTGRAY: '#AAAAAA'
};



const LDTK_TO_CHAR = {
    1: '.', 2: '#', 3: '~', 4: 'T', 5: 'D', 6: 'G', 7: 'M', 8: '$',
    9: '>', 10: '<', 11: 'f', 12: 'w', 13: 't', 14: ',', 15: 'r',
    16: '=', 17: 's', 18: '`', 19: 'm', 20: 'P', 21: 'F', 22: 'I',
    23: '+', 24: '_'
};

// Weapon Types and Reach Patterns
const weaponTypes = { 
    SWORD: 'sword', 
    AXE: 'axe', 
    BOW: 'bow', 
    STAFF: 'staff', 
    DAGGER: 'dagger', 
    MACE: 'mace', 
    FLAIL: 'flail' 
};

const weaponReach = {
    [weaponTypes.DAGGER]: { pattern: [[0, -1], [1, 0], [0, 1], [-1, 0]], cooldown: 0, description: '1 tile, fast' },
    [weaponTypes.SWORD]: { pattern: [[0, -2], [0, -1], [2, 0], [1, 0], [0, 2], [0, 1], [-2, 0], [-1, 0]], cooldown: 0, description: '2 tiles forward' },
    [weaponTypes.AXE]: { pattern: [[0, -1], [1, 0], [0, 1], [-1, 0]], cooldown: 1, description: 'High damage, 1 turn cooldown' },
    [weaponTypes.FLAIL]: { pattern: [[-1,-1], [0,-1], [1,-1], [-1,0], [1,0], [-1,1], [0,1], [1,1]], cooldown: 2, description: 'Hits all adjacent, 2 turn cooldown' },
    [weaponTypes.STAFF]: { pattern: [[0, -3], [0, -2], [0, -1], [3, 0], [2, 0], [1, 0], [0, 3], [0, 2], [0, 1], [-3, 0], [-2, 0], [-1, 0]], cooldown: 0, description: '3 tiles forward' },
    [weaponTypes.BOW]: { pattern: [], cooldown: 0, description: 'Shoots until obstacle' },
    [weaponTypes.MACE]: { pattern: [[0, -1], [1, 0], [0, 1], [-1, 0]], cooldown: 0, description: '1 tile' }
};

// Sprite Generation
function createSprite(pattern, size = 16) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = CGA.BLACK;
    ctx.fillRect(0, 0, size, size);
    const pixelSize = size / 8;
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const pixel = pattern[y][x];
            if (pixel !== '0') {
                ctx.fillStyle = pixel;
                ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            }
        }
    }
    return canvas.toDataURL();
}

// Sprite Patterns
const spritePatterns = {
    grass: [['0','0','0','C','0','0','C','0'],['0','C','0','0','0','C','0','0'],['C','0','0','0','0','0','0','C'],['0','0','0','C','0','0','0','0'],['0','0','C','0','0','0','C','0'],['0','C','0','0','C','0','0','0'],['0','0','0','0','0','0','0','C'],['C','0','0','C','0','0','0','0']].map(row => row.map(p => p === 'C' ? CGA.CYAN : '0')),
    wall: [['W','W','W','W','W','W','W','W'],['W','0','W','0','W','0','W','0'],['W','W','W','W','W','W','W','W'],['W','0','W','0','W','0','W','0'],['W','W','W','W','W','W','W','W'],['W','0','W','0','W','0','W','0'],['W','W','W','W','W','W','W','W'],['W','0','W','0','W','0','W','0']].map(row => row.map(p => p === 'W' ? CGA.WHITE : '0')),
    water: [['0','0','C','C','0','0','C','C'],['0','C','C','C','C','0','C','C'],['C','C','C','0','C','C','C','0'],['C','C','0','0','C','C','0','0'],['C','0','0','C','C','0','0','C'],['0','0','C','C','0','0','C','C'],['0','C','C','C','C','0','C','C'],['C','C','C','0','C','C','C','0']].map(row => row.map(p => p === 'C' ? CGA.CYAN : '0')),
    tree: [['0','0','0','C','C','0','0','0'],['0','0','C','C','C','C','0','0'],['0','C','C','C','C','C','C','0'],['C','C','C','C','C','C','C','C'],['0','C','C','C','C','C','C','0'],['0','0','0','C','C','0','0','0'],['0','0','0','C','C','0','0','0'],['0','0','C','C','C','C','0','0']].map(row => row.map(p => p === 'C' ? CGA.CYAN : '0')),
    door: [['W','W','W','W','W','W','W','W'],['W','0','0','0','0','0','0','W'],['W','0','0','0','0','0','0','W'],['W','0','0','W','0','0','0','W'],['W','0','0','W','0','0','0','W'],['W','0','0','0','0','0','0','W'],['W','0','0','0','0','0','0','W'],['W','W','W','W','W','W','W','W']].map(row => row.map(p => p === 'W' ? CGA.WHITE : '0')),
    gate: [['M','M','M','M','M','M','M','M'],['M','0','0','0','0','0','0','M'],['M','0','0','0','0','0','0','M'],['M','0','0','M','M','0','0','M'],['M','0','0','M','M','0','0','M'],['M','0','0','0','0','0','0','M'],['M','0','0','0','0','0','0','M'],['M','M','M','M','M','M','M','M']].map(row => row.map(p => p === 'M' ? CGA.MAGENTA : '0')),
    mountain: [['0','0','0','0','W','0','0','0'],['0','0','0','W','W','W','0','0'],['0','0','W','W','W','W','W','0'],['0','W','W','0','W','0','W','W'],['W','W','W','W','W','W','W','W'],['W','0','W','W','W','W','0','W'],['W','W','W','W','W','W','W','W'],['W','W','W','W','W','W','W','W']].map(row => row.map(p => p === 'W' ? CGA.WHITE : '0')),
    player: [['0','0','0','W','W','0','0','0'],['0','0','W','M','M','W','0','0'],['0','0','W','M','M','W','0','0'],['0','C','M','M','M','M','C','0'],['0','0','M','M','M','M','0','0'],['0','0','M','0','0','M','0','0'],['0','0','W','0','0','W','0','0'],['0','W','W','0','0','W','W','0']].map(row => row.map(p => { if (p === 'M') return CGA.MAGENTA; if (p === 'W') return CGA.WHITE; if (p === 'C') return CGA.CYAN; return '0'; })),
    treasure: [['0','0','W','W','W','W','0','0'],['0','W','M','M','M','M','W','0'],['W','M','C','C','C','C','M','W'],['W','M','C','C','C','C','M','W'],['W','M','M','M','M','M','M','W'],['W','M','W','M','W','M','W','M'],['0','W','M','M','M','M','W','0'],['0','0','W','W','W','W','0','0']].map(row => row.map(p => { if (p === 'W') return CGA.WHITE; if (p === 'M') return CGA.MAGENTA; if (p === 'C') return CGA.CYAN; return '0'; })),
    goblin: [['0','0','W','W','W','W','0','0'],['0','W','0','M','M','0','W','0'],['W','0','M','M','M','M','0','W'],['W','M','M','M','M','M','M','W'],['0','W','M','M','M','M','W','0'],['0','0','W','M','M','W','0','0'],['0','W','0','M','M','0','W','0'],['W','0','0','0','0','0','0','W']].map(row => row.map(p => { if (p === 'W') return CGA.WHITE; if (p === 'M') return CGA.MAGENTA; return '0'; })),
    skeleton: [['0','0','W','W','W','W','0','0'],['0','W','0','W','W','0','W','0'],['0','W','W','W','W','W','W','0'],['0','0','W','W','W','W','0','0'],['0','0','W','0','0','W','0','0'],['0','W','W','W','W','W','W','0'],['0','W','0','0','0','0','W','0'],['W','0','0','0','0','0','0','W']].map(row => row.map(p => p === 'W' ? CGA.WHITE : '0')),
    slime: [['0','0','0','C','C','0','0','0'],['0','0','C','C','C','C','0','0'],['0','C','M','W','M','W','C','0'],['C','C','C','C','C','C','C','C'],['C','M','M','M','M','M','C','C'],['C','C','M','M','M','M','C','C'],['0','C','C','C','C','C','C','0'],['0','0','C','0','0','C','0','0']].map(row => row.map(p => { if (p === 'W') return CGA.WHITE; if (p === 'M') return CGA.MAGENTA; if (p === 'C') return CGA.CYAN; return '0'; })),
    lootbag: [['0','0','0','0','0','0','0','0'],['0','0','M','M','M','M','0','0'],['0','M','M','M','M','M','M','0'],['M','M','W','M','M','W','M','M'],['M','M','M','M','M','M','M','M'],['M','M','M','M','M','M','M','M'],['0','M','M','M','M','M','M','0'],['0','0','M','M','M','M','0','0']].map(row => row.map(p => { if (p === 'M') return CGA.MAGENTA; if (p === 'W') return CGA.WHITE; return '0'; })),
    villager: [['0','0','0','W','W','0','0','0'],['0','0','W','C','C','W','0','0'],['0','0','W','C','C','W','0','0'],['0','0','W','W','W','W','0','0'],['0','0','W','C','W','C','0','0'],['0','0','C','C','C','C','0','0'],['0','0','C','0','0','C','0','0'],['0','C','C','0','0','C','C','0']].map(row => row.map(p => { if (p === 'W') return CGA.WHITE; if (p === 'C') return CGA.CYAN; return '0'; })),
    merchant: [['0','0','0','W','W','0','0','0'],['0','0','W','M','M','W','0','0'],['0','0','W','M','M','W','0','0'],['0','0','W','W','W','W','0','0'],['0','M','W','M','W','M','W','0'],['0','0','M','M','M','M','0','0'],['0','0','M','0','0','M','0','0'],['0','M','M','0','0','M','M','0']].map(row => row.map(p => { if (p === 'W') return CGA.WHITE; if (p === 'M') return CGA.MAGENTA; return '0'; })),
    stairsdown: [['0','0','0','0','0','0','0','0'],['B','B','B','B','B','B','B','B'],['0','B','B','B','B','B','B','0'],['0','0','B','B','B','B','0','0'],['0','0','0','B','B','0','0','0'],['0','0','0','0','B','0','0','0'],['0','0','0','0','0','0','0','0'],['0','0','0','0','0','0','0','0']].map(row => row.map(p => p === 'B' ? CGA.BROWN : '0')),
    stairsup: [['0','0','0','0','0','0','0','0'],['0','0','0','0','B','0','0','0'],['0','0','0','B','B','0','0','0'],['0','0','B','B','B','B','0','0'],['0','B','B','B','B','B','B','0'],['B','B','B','B','B','B','B','B'],['0','0','0','0','0','0','0','0'],['0','0','0','0','0','0','0','0']].map(row => row.map(p => p === 'B' ? CGA.BROWN : '0')),
    floor: [['L','0','0','L','0','0','L','0'],['0','0','L','0','0','L','0','0'],['0','L','0','0','L','0','0','L'],['L','0','0','L','0','0','L','0'],['0','0','L','0','0','L','0','0'],['0','L','0','0','L','0','0','L'],['L','0','0','L','0','0','L','0'],['0','0','L','0','0','L','0','0']].map(row => row.map(p => p === 'L' ? CGA.LIGHTGRAY : '0')),
    window: [['W','W','W','W','W','W','W','W'],['W','M','M','W','M','M','M','W'],['W','M','C','W','C','C','C','W'],['W','M','C','W','C','C','C','W'],['W','W','W','W','W','W','W','W'],['W','M','M','W','M','M','M','W'],['W','M','C','W','C','C','C','W'],['W','W','W','W','W','W','W','W']].map(row => row.map(p => { if (p === 'W') return CGA.WHITE; if (p === 'M') return CGA.MAGENTA; if (p === 'C') return CGA.CYAN; return '0'; })),
    paper: [['P','P','P','P','P','P','P','P'],['P','P','P','P','P','P','P','P'],['P','P','P','P','P','P','P','P'],['P','P','P','P','P','P','P','P'],['P','P','P','P','P','P','P','P'],['P','P','P','P','P','P','P','P'],['P','P','P','P','P','P','P','P'],['P','P','P','P','P','P','P','P']].map(row => row.map(p => p === 'P' ? CGA.WHITE : '0')),
    paper_edge_top: [['B','B','B','B','B','B','B','B'],['P','P','P','P','P','P','P','P'],['P','P','P','P','P','P','P','P'],['P','P','P','P','P','P','P','P'],['P','P','P','P','P','P','P','P'],['P','P','P','P','P','P','P','P'],['P','P','P','P','P','P','P','P'],['P','P','P','P','P','P','P','P']].map(row => row.map(p => { if(p === 'B') return CGA.BROWN; if(p === 'P') return CGA.WHITE; return '0'; })),
    paper_edge_bottom: [['P','P','P','P','P','P','P','P'],['P','P','P','P','P','P','P','P'],['P','P','P','P','P','P','P','P'],['P','P','P','P','P','P','P','P'],['P','P','P','P','P','P','P','P'],['P','P','P','P','P','P','P','P'],['P','P','P','P','P','P','P','P'],['B','B','B','B','B','B','B','B']].map(row => row.map(p => { if(p === 'B') return CGA.BROWN; if(p === 'P') return CGA.WHITE; return '0'; })),
    paper_edge_left: [['B','P','P','P','P','P','P','P'],['B','P','P','P','P','P','P','P'],['B','P','P','P','P','P','P','P'],['B','P','P','P','P','P','P','P'],['B','P','P','P','P','P','P','P'],['B','P','P','P','P','P','P','P'],['B','P','P','P','P','P','P','P'],['B','P','P','P','P','P','P','P']].map(row => row.map(p => { if(p === 'B') return CGA.BROWN; if(p === 'P') return CGA.WHITE; return '0'; })),
    paper_edge_right: [['P','P','P','P','P','P','P','B'],['P','P','P','P','P','P','P','B'],['P','P','P','P','P','P','P','B'],['P','P','P','P','P','P','P','B'],['P','P','P','P','P','P','P','B'],['P','P','P','P','P','P','P','B'],['P','P','P','P','P','P','P','B'],['P','P','P','P','P','P','P','B']].map(row => row.map(p => { if(p === 'B') return CGA.BROWN; if(p === 'P') return CGA.WHITE; return '0'; })),
    paper_corner_tl: [['B','B','B','B','B','B','B','B'],['B','P','P','P','P','P','P','P'],['B','P','P','P','P','P','P','P'],['B','P','P','P','P','P','P','P'],['B','P','P','P','P','P','P','P'],['B','P','P','P','P','P','P','P'],['B','P','P','P','P','P','P','P'],['B','P','P','P','P','P','P','P']].map(row => row.map(p => { if(p === 'B') return CGA.BROWN; if(p === 'P') return CGA.WHITE; return '0'; })),
    paper_corner_tr: [['B','B','B','B','B','B','B','B'],['P','P','P','P','P','P','P','B'],['P','P','P','P','P','P','P','B'],['P','P','P','P','P','P','P','B'],['P','P','P','P','P','P','P','B'],['P','P','P','P','P','P','P','B'],['P','P','P','P','P','P','P','B'],['P','P','P','P','P','P','P','B']].map(row => row.map(p => { if(p === 'B') return CGA.BROWN; if(p === 'P') return CGA.WHITE; return '0'; })),
    paper_corner_bl: [['B','P','P','P','P','P','P','P'],['B','P','P','P','P','P','P','P'],['B','P','P','P','P','P','P','P'],['B','P','P','P','P','P','P','P'],['B','P','P','P','P','P','P','P'],['B','P','P','P','P','P','P','P'],['B','P','P','P','P','P','P','P'],['B','B','B','B','B','B','B','B']].map(row => row.map(p => { if(p === 'B') return CGA.BROWN; if(p === 'P') return CGA.WHITE; return '0'; })),
    paper_corner_br: [['P','P','P','P','P','P','P','B'],['P','P','P','P','P','P','P','B'],['P','P','P','P','P','P','P','B'],['P','P','P','P','P','P','P','B'],['P','P','P','P','P','P','P','B'],['P','P','P','P','P','P','P','B'],['P','P','P','P','P','P','P','B'],['B','B','B','B','B','B','B','B']].map(row => row.map(p => { if(p === 'B') return CGA.BROWN; if(p === 'P') return CGA.WHITE; return '0'; })),
    table: [['B','B','B','B','B','B','B','B'],['B','0','0','0','0','0','0','B'],['B','0','0','0','0','0','0','B'],['B','0','0','0','0','0','0','B'],['B','B','B','B','B','B','B','B'],['0','0','B','0','0','B','0','0'],['0','0','B','0','0','B','0','0'],['0','0','B','B','B','B','0','0']].map(row => row.map(p => p === 'B' ? CGA.BROWN : '0')),
    sand: [['0','0','W','0','0','W','0','0'],['0','W','0','0','W','0','0','0'],['W','0','0','0','0','0','W','0'],['0','0','W','0','0','0','0','W'],['0','0','0','0','W','0','0','0'],['0','W','0','W','0','0','0','0'],['W','0','0','0','0','W','0','0'],['0','0','0','W','0','0','W','0']].map(row => row.map(p => p === 'W' ? CGA.WHITE : '0')),
    rocks: [['0','L','L','0','0','W','W','0'],['L','L','L','L','W','W','W','W'],['L','L','L','0','W','W','W','0'],['0','0','0','0','0','W','0','0'],['W','W','0','L','L','L','0','0'],['W','W','W','L','L','L','L','0'],['0','W','0','0','L','L','0','0'],['0','0','0','0','0','0','0','0']].map(row => row.map(p => { if (p === 'W') return CGA.WHITE; if (p === 'L') return CGA.LIGHTGRAY; return '0'; })),
    bridge: [['B','B','B','B','B','B','B','B'],['B','0','B','0','B','0','B','0'],['B','B','B','B','B','B','B','B'],['0','0','0','0','0','0','0','0'],['B','B','B','B','B','B','B','B'],['B','0','B','0','B','0','B','0'],['B','B','B','B','B','B','B','B'],['0','0','0','0','0','0','0','0']].map(row => row.map(p => p === 'B' ? CGA.BROWN : '0')),
    scrub: [['0','0','B','B','0','0','0','0'],['0','B','B','B','B','0','0','B'],['B','B','B','B','B','B','B','B'],['0','B','B','B','B','B','B','0'],['0','0','0','B','B','0','0','0'],['0','B','B','0','0','B','B','0'],['B','B','B','B','B','B','B','B'],['0','B','B','B','B','B','B','0']].map(row => row.map(p => p === 'B' ? CGA.BROWN : '0')),
    grass2: [['0','C','0','0','C','0','0','0'],['C','C','0','C','0','0','C','0'],['0','C','C','C','0','C','C','C'],['0','0','C','0','0','C','C','0'],['0','0','0','C','C','0','C','0'],['C','C','0','C','C','C','0','0'],['C','C','C','C','0','C','0','C'],['0','C','C','0','0','0','C','C']].map(row => row.map(p => p === 'C' ? CGA.CYAN : '0')),
    mountains2: [['0','0','0','W','W','0','0','0'],['0','0','W','W','W','W','0','0'],['0','W','W','W','W','W','W','0'],['W','W','W','L','L','W','W','W'],['W','W','L','L','L','L','W','W'],['W','L','L','L','L','L','L','W'],['L','L','L','L','L','L','L','L'],['0','0','0','0','0','0','0','0']].map(row => row.map(p => { if (p === 'W') return CGA.WHITE; if (p === 'L') return CGA.LIGHTGRAY; return '0'; })),
    mailbox: [['0','0','C','C','C','C','0','0'],['0','C','C','C','C','C','C','0'],['C','C','W','C','C','W','C','C'],['C','C','C','C','C','C','C','C'],['0','0','0','C','C','0','0','0'],['0','0','0','C','C','0','0','0'],['0','0','C','C','C','C','0','0'],['0','0','C','C','C','C','0','0']].map(row => row.map(p => { if (p === 'C') return CGA.CYAN; if (p === 'W') return CGA.WHITE; return '0'; })),
    fountain: [['0','0','C','C','C','C','0','0'],['0','C','W','C','C','W','C','0'],['C','W','C','C','C','C','W','C'],['C','C','C','C','C','C','C','C'],['C','C','C','C','C','C','C','C'],['0','C','C','C','C','C','C','0'],['0','W','W','W','W','W','W','0'],['0','0','W','W','W','W','0','0']].map(row => row.map(p => { if (p === 'C') return CGA.CYAN; if (p === 'W') return CGA.WHITE; return '0'; })),
    streetlight: [['0','0','W','W','W','W','0','0'],['0','W','W','W','W','W','W','0'],['0','0','W','W','W','W','0','0'],['0','0','0','W','W','0','0','0'],['0','0','0','W','W','0','0','0'],['0','0','0','W','W','0','0','0'],['0','0','W','W','W','W','0','0'],['0','0','W','W','W','W','0','0']].map(row => row.map(p => p === 'W' ? CGA.WHITE : '0')),
    brick: [['M','M','M','M','0','M','M','M'],['M','0','M','0','M','0','M','0'],['M','M','M','M','M','M','M','M'],['0','M','M','M','M','0','M','M'],['M','0','M','0','M','M','0','M'],['M','M','M','M','0','M','M','M'],['M','M','0','M','M','M','0','M'],['M','M','M','M','M','M','M','M']].map(row => row.map(p => p === 'M' ? CGA.MAGENTA : '0')),
    cornice: [['W','W','W','W','W','W','W','W'],['L','L','L','L','L','L','L','L'],['W','0','W','0','W','0','W','0'],['L','L','L','L','L','L','L','L'],['0','0','0','0','0','0','0','0'],['0','0','0','0','0','0','0','0'],['0','0','0','0','0','0','0','0'],['0','0','0','0','0','0','0','0']].map(row => row.map(p => { if (p === 'W') return CGA.WHITE; if (p === 'L') return CGA.LIGHTGRAY; return '0'; })),
	wraith: [['0','0','0','W','W','0','0','0'],['0','0','W','C','C','W','0','0'],['0','W','C','W','W','C','W','0'],['0','W','W','0','0','W','W','0'],['W','C','W','W','W','W','C','W'],['0','W','W','0','0','W','W','0'],['0','0','W','0','0','W','0','0'],['0','0','0','W','W','0','0','0']].map(row => row.map(p => { if (p === 'W') return CGA.WHITE; if (p === 'C') return CGA.CYAN; return '0'; })),
	spider: [['0','M','0','0','0','0','M','0'],['M','0','M','0','0','M','0','M'],['0','M','M','M','M','M','M','0'],['M','W','M','M','M','M','W','M'],['0','M','M','M','M','M','M','0'],['M','0','M','0','0','M','0','M'],['0','M','0','0','0','0','M','0'],['M','0','0','0','0','0','0','M']].map(row => row.map(p => { if (p === 'M') return CGA.MAGENTA; if (p === 'W') return CGA.WHITE; return '0'; })),
	orc: [['0','0','0','B','B','0','0','0'],['0','0','B','M','M','B','0','0'],['0','B','W','M','M','W','B','0'],['0','B','M','M','M','M','B','0'],['B','B','M','M','M','M','B','B'],['0','0','M','M','M','M','0','0'],['0','0','B','0','0','B','0','0'],['0','B','B','0','0','B','B','0']].map(row => row.map(p => { if (p === 'B') return CGA.BROWN; if (p === 'M') return CGA.MAGENTA; if (p === 'W') return CGA.WHITE; return '0'; })),
	bat: [['W','0','0','0','0','0','0','W'],['W','W','0','0','0','0','W','W'],['0','W','W','M','M','W','W','0'],['0','0','W','M','M','W','0','0'],['0','0','W','W','W','W','0','0'],['0','0','0','W','W','0','0','0'],['0','0','0','0','0','0','0','0'],['0','0','0','0','0','0','0','0']].map(row => row.map(p => { if (p === 'W') return CGA.WHITE; if (p === 'M') return CGA.MAGENTA; return '0'; })),
	zombie: [['0','0','L','L','L','L','0','0'],['0','L','0','M','M','0','L','0'],['0','L','M','M','M','M','L','0'],['0','0','L','L','L','L','0','0'],['0','M','L','L','L','L','M','0'],['0','0','L','0','0','L','0','0'],['0','L','L','0','0','L','L','0'],['L','L','0','0','0','0','L','L']].map(row => row.map(p => { if (p === 'L') return CGA.LIGHTGRAY; if (p === 'M') return CGA.MAGENTA; return '0'; })),
	gargoyle: [['0','0','W','W','W','W','0','0'],['0','W','L','W','W','L','W','0'],['W','L','L','W','W','L','L','W'],['W','L','L','L','L','L','L','W'],['0','W','L','L','L','L','W','0'],['W','0','W','L','L','W','0','W'],['W','W','0','W','W','0','W','W'],['W','0','0','0','0','0','0','W']].map(row => row.map(p => { if (p === 'W') return CGA.WHITE; if (p === 'L') return CGA.LIGHTGRAY; return '0'; })),
	imp: [['0','0','M','0','0','M','0','0'],['0','M','M','M','M','M','M','0'],['0','M','W','M','M','W','M','0'],['M','M','M','M','M','M','M','M'],['0','M','M','M','M','M','M','0'],['0','0','M','0','0','M','0','0'],['0','M','0','0','0','0','M','0'],['M','0','0','0','0','0','0','M']].map(row => row.map(p => { if (p === 'M') return CGA.MAGENTA; if (p === 'W') return CGA.WHITE; return '0'; })),
	golem: [['0','L','L','L','L','L','L','0'],['L','W','L','L','L','L','W','L'],['L','L','W','L','L','W','L','L'],['L','L','L','L','L','L','L','L'],['L','L','L','L','L','L','L','L'],['0','L','L','L','L','L','L','0'],['0','L','0','L','L','0','L','0'],['L','L','L','0','0','L','L','L']].map(row => row.map(p => { if (p === 'L') return CGA.LIGHTGRAY; if (p === 'W') return CGA.WHITE; return '0'; })),
	spectre: [['0','0','C','C','C','C','0','0'],['0','C','0','C','C','0','C','0'],['C','0','C','C','C','C','0','C'],['C','C','C','0','0','C','C','C'],['0','C','C','C','C','C','C','0'],['0','0','C','C','C','C','0','0'],['0','C','0','C','C','0','C','0'],['C','0','0','0','0','0','0','C']].map(row => row.map(p => p === 'C' ? CGA.CYAN : '0')) 
};

// Generate all sprites
const sprites = {};
Object.keys(spritePatterns).forEach(key => {
    sprites[key] = createSprite(spritePatterns[key]);
});

// Spell Database (unchanged)
const spellDatabase = {
    'fire_bolt': { name: 'Fire Bolt', mpCost: 10, type: 'damage', targeting: 'directional', description: 'Shoots a bolt of flame.', effect: function(caster, target) { const stats = calculateStats(); const dmg = 20 + Math.floor(stats.intelligence * 1.5); target.hp -= dmg; addMessage(`Fire Bolt hits ${target.name} for ${dmg}!`); } },
    'heal': { name: 'Heal', mpCost: 15, type: 'self', targeting: 'self', description: 'Restores 40 HP.', effect: function(caster) { const healAmount = 40; const oldHp = caster.hp; caster.hp = Math.min(caster.hp + healAmount, caster.maxHp); addMessage(`Healed ${caster.hp - oldHp} HP!`); } },
    'barrier': { name: 'Barrier', mpCost: 12, type: 'buff', targeting: 'self', description: 'Absorbs 30 damage.', duration: 5, effect: function(caster) { caster.barrier = 30; caster.barrierTurns = 5; addMessage('Barrier activated! (30 HP shield)'); } },
    'weaken': { name: 'Weaken', mpCost: 8, type: 'debuff', targeting: 'directional', description: 'Reduces enemy STR 30% for 3 turns.', duration: 3, effect: function(caster, target) { target.weakened = true; target.weakenTurns = 3; target.weakenAmount = 0.3; addMessage(`${target.name} is weakened!`); } },
    'lightning': { name: 'Lightning', mpCost: 25, type: 'aoe', targeting: 'self', description: 'Damages all adjacent enemies.', effect: function(caster) { const stats = calculateStats(); let hits = 0; const adjacentOffsets = [[-1,-1], [0,-1], [1,-1], [-1,0], [1,0], [-1,1], [0,1], [1,1]]; adjacentOffsets.forEach(([dx, dy]) => { const enemy = gameState.enemies.find(e => e.x === caster.x + dx && e.y === caster.y + dy); if (enemy) { const dmg = 30 + Math.floor(stats.intelligence * 2); enemy.hp -= dmg; addMessage(`Lightning strikes ${enemy.name} for ${dmg}!`); hits++; } }); if (hits === 0) addMessage('Lightning crackles but hits nothing!'); gameState.enemies = gameState.enemies.filter(e => { if (e.hp <= 0) { handleEnemyDefeat(e); return false; } return true; }); } }
};

// Item Database (unchanged)
const itemDatabase = {
    'rusty_sword': { name: 'Rusty Sword', type: 'weapon', weaponType: weaponTypes.SWORD, tier: 0, description: 'An old sword covered in rust.', canEquip: true, slot: 'weapon', stats: { strength: 5, vitality: 2, intelligence: 0, spirit: 0, agility: 0, luck: 0 } },
    'short_sword': { name: 'Short Sword', type: 'weapon', weaponType: weaponTypes.SWORD, tier: 1, description: 'A standard steel blade.', canEquip: true, slot: 'weapon', stats: { strength: 10, vitality: 3, intelligence: 0, spirit: 0, agility: 1, luck: 0 } },
    'rusty_axe': { name: 'Rusty Axe', type: 'weapon', weaponType: weaponTypes.AXE, tier: 0, description: 'A chipped axe.', canEquip: true, slot: 'weapon', stats: { strength: 8, vitality: 0, intelligence: 0, spirit: 0, agility: -1, luck: 0 } },
    'rusty_dagger': { name: 'Rusty Dagger', type: 'weapon', weaponType: weaponTypes.DAGGER, tier: 0, description: 'A small blade.', canEquip: true, slot: 'weapon', stats: { strength: 3, vitality: 0, intelligence: 0, spirit: 0, agility: 2, luck: 3 } },
    'steel_dagger': { name: 'Steel Dagger', type: 'weapon', weaponType: weaponTypes.DAGGER, tier: 1, description: 'A quick weapon.', canEquip: true, slot: 'weapon', stats: { strength: 7, vitality: 1, intelligence: 0, spirit: 0, agility: 4, luck: 5 } },
    'leather_armor': { name: 'Leather Armor', type: 'armor', tier: 0, description: 'Basic leather protection.', canEquip: true, slot: 'armor', stats: { strength: 0, vitality: 5, intelligence: 0, spirit: 2, agility: 0, luck: 0 } },
    'chain_mail': { name: 'Chain Mail', type: 'armor', tier: 1, description: 'Sturdy chain armor.', canEquip: true, slot: 'armor', stats: { strength: 0, vitality: 10, intelligence: 0, spirit: 3, agility: -1, luck: 0 } },
    'iron_plate': { name: 'Iron Plate', type: 'armor', tier: 2, description: 'Heavy iron armor.', canEquip: true, slot: 'armor', stats: { strength: 2, vitality: 15, intelligence: 0, spirit: 5, agility: -2, luck: 0 } },
    'lucky_charm': { name: 'Lucky Charm', type: 'accessory', tier: 0, description: 'A small charm that brings fortune.', canEquip: true, slot: 'accessory', stats: { strength: 0, vitality: 0, intelligence: 0, spirit: 0, agility: 0, luck: 5 } },
    'power_ring': { name: 'Power Ring', type: 'accessory', tier: 1, description: 'Increases physical strength.', canEquip: true, slot: 'accessory', stats: { strength: 3, vitality: 0, intelligence: 0, spirit: 0, agility: 0, luck: 0 } },
    'magic_amulet': { name: 'Magic Amulet', type: 'accessory', tier: 1, description: 'Enhances magical power.', canEquip: true, slot: 'accessory', stats: { strength: 0, vitality: 0, intelligence: 5, spirit: 3, agility: 0, luck: 0 } },
    'swift_boots': { name: 'Swift Boots', type: 'special', tier: 1, description: 'Light boots that increase agility.', canEquip: true, slot: 'special', stats: { strength: 0, vitality: 0, intelligence: 0, spirit: 0, agility: 5, luck: 2 } },
    'health_potion': { name: 'Health Potion', type: 'consumable', description: 'Restores 50 HP.', canEquip: false, stats: { strength: 0, vitality: 0, intelligence: 0, spirit: 0, agility: 0, luck: 0 }, onUse: function() { const heal = 50; const old = gameState.player.hp; gameState.player.hp = Math.min(gameState.player.hp + heal, gameState.player.maxHp); addMessage(`Restored ${gameState.player.hp - old} HP!`); return true; } },
    'silver_key': { name: 'Silver Key', type: 'key', description: 'A mysterious silver key.', canEquip: false, stats: { strength: 0, vitality: 0, intelligence: 0, spirit: 0, agility: 0, luck: 0 } },
    'magic_scroll': { name: 'Magic Scroll', type: 'consumable', description: 'Damages all enemies!', canEquip: false, stats: { strength: 0, vitality: 0, intelligence: 0, spirit: 0, agility: 0, luck: 0 }, onUse: function() { addMessage("Arcane energy erupts!"); let hit = 0; const stats = calculateStats(); gameState.enemies.forEach(e => { const dmg = 15 + Math.floor(stats.intelligence * 1.5); e.hp -= dmg; addMessage(`${e.name} takes ${dmg} damage!`); hit++; }); gameState.enemies = gameState.enemies.filter(e => { if (e.hp <= 0) { addMessage(`${e.name} destroyed!`); return false; } return true; }); if (hit === 0) addMessage("No enemies affected."); renderWorld(); return true; } },
    'spell_fire_bolt': { name: 'Spell: Fire Bolt', type: 'spell_scroll', spellId: 'fire_bolt', description: 'Learn Fire Bolt spell.', canEquip: false, stats: { strength: 0, vitality: 0, intelligence: 0, spirit: 0, agility: 0, luck: 0 }, onUse: function() { if (gameState.player.knownSpells.includes('fire_bolt')) { addMessage("Already know this spell!"); return false; } gameState.player.knownSpells.push('fire_bolt'); addMessage("Learned Fire Bolt!"); return true; } },
    'spell_heal': { name: 'Spell: Heal', type: 'spell_scroll', spellId: 'heal', description: 'Learn Heal spell.', canEquip: false, stats: { strength: 0, vitality: 0, intelligence: 0, spirit: 0, agility: 0, luck: 0 }, onUse: function() { if (gameState.player.knownSpells.includes('heal')) { addMessage("Already know this spell!"); return false; } gameState.player.knownSpells.push('heal'); addMessage("Learned Heal!"); return true; } },
    'spell_barrier': { name: 'Spell: Barrier', type: 'spell_scroll', spellId: 'barrier', description: 'Learn Barrier spell.', canEquip: false, stats: { strength: 0, vitality: 0, intelligence: 0, spirit: 0, agility: 0, luck: 0 }, onUse: function() { if (gameState.player.knownSpells.includes('barrier')) { addMessage("Already know this spell!"); return false; } gameState.player.knownSpells.push('barrier'); addMessage("Learned Barrier!"); return true; } },
    'spell_weaken': { name: 'Spell: Weaken', type: 'spell_scroll', spellId: 'weaken', description: 'Learn Weaken spell.', canEquip: false, stats: { strength: 0, vitality: 0, intelligence: 0, spirit: 0, agility: 0, luck: 0 }, onUse: function() { if (gameState.player.knownSpells.includes('weaken')) { addMessage("Already know this spell!"); return false; } gameState.player.knownSpells.push('weaken'); addMessage("Learned Weaken!"); return true; } },
    'spell_lightning': { name: 'Spell: Lightning', type: 'spell_scroll', spellId: 'lightning', description: 'Learn Lightning spell.', canEquip: false, stats: { strength: 0, vitality: 0, intelligence: 0, spirit: 0, agility: 0, luck: 0 }, onUse: function() { if (gameState.player.knownSpells.includes('lightning')) { addMessage("Already know this spell!"); return false; } gameState.player.knownSpells.push('lightning'); addMessage("Learned Lightning!"); return true; } }
};

// Loot Pools organized by tier
const lootPools = {
    tier0: ['rusty_sword', 'rusty_axe', 'rusty_dagger', 'leather_armor', 'lucky_charm', 'health_potion'],
    tier1: ['short_sword', 'steel_dagger', 'chain_mail', 'power_ring', 'magic_amulet', 'swift_boots'],
    tier2: ['iron_plate'],
    spells: ['spell_fire_bolt', 'spell_heal', 'spell_barrier', 'spell_weaken', 'spell_lightning'],
    consumables: ['health_potion', 'magic_scroll']
};



const enemyDatabase = {
    'goblin': { name: 'Goblin', sprite: 'goblin', hp: 50, maxHp: 50, strength: 8, vitality: 5, intelligence: 2, spirit: 3, agility: 6, luck: 3, speed: 1, aggressive: true, xp: 15, lootChance: 0.6, loot: { gold: [5, 15], rolls: 1, tierWeights: { tier0: 0.6, consumables: 0.3, spells: 0.1 } } },
    'skeleton': { name: 'Skeleton', sprite: 'skeleton', hp: 40, maxHp: 40, strength: 12, vitality: 3, intelligence: 1, spirit: 2, agility: 4, luck: 1, speed: 1, aggressive: true, xp: 20, lootChance: 0.5, loot: { gold: [10, 20], rolls: 1, tierWeights: { tier0: 0.7, tier1: 0.2, spells: 0.1 } } },
    'slime': { name: 'Slime', sprite: 'slime', hp: 30, maxHp: 30, strength: 4, vitality: 10, intelligence: 5, spirit: 8, agility: 2, luck: 1, speed: 1, aggressive: false, xp: 10, lootChance: 0.4, loot: { gold: [2, 8], rolls: 1, tierWeights: { consumables: 0.7, spells: 0.3 } } },
    'wraith': { name: 'Wraith', sprite: 'wraith', hp: 60, maxHp: 60, strength: 10, vitality: 2, intelligence: 8, spirit: 12, agility: 8, luck: 2, speed: 1, aggressive: true, xp: 25, lootChance: 0.5, loot: { gold: [15, 30], rolls: 1, tierWeights: { tier1: 0.4, spells: 0.5, consumables: 0.1 } } },
    'spider': { name: 'Giant Spider', sprite: 'spider', hp: 45, maxHp: 45, strength: 9, vitality: 6, intelligence: 2, spirit: 4, agility: 12, luck: 4, speed: 1, aggressive: true, xp: 18, lootChance: 0.4, loot: { gold: [8, 18], rolls: 1, tierWeights: { tier0: 0.5, tier1: 0.4, consumables: 0.1 } } },
    'orc': { name: 'Orc Warrior', sprite: 'orc', hp: 80, maxHp: 80, strength: 15, vitality: 12, intelligence: 3, spirit: 4, agility: 5, luck: 2, speed: 1, aggressive: true, xp: 30, lootChance: 0.65, loot: { gold: [20, 40], rolls: 2, tierWeights: { tier0: 0.4, tier1: 0.5, consumables: 0.1 } } },
    'bat': { name: 'Cave Bat', sprite: 'bat', hp: 25, maxHp: 25, strength: 6, vitality: 3, intelligence: 2, spirit: 3, agility: 15, luck: 6, speed: 1, aggressive: true, xp: 12, lootChance: 0.3, loot: { gold: [3, 10], rolls: 1, tierWeights: { tier0: 0.5, tier1: 0.3, consumables: 0.2 } } },
    'zombie': { name: 'Shambling Zombie', sprite: 'zombie', hp: 70, maxHp: 70, strength: 14, vitality: 8, intelligence: 1, spirit: 1, agility: 2, luck: 0, speed: 1, aggressive: true, xp: 22, lootChance: 0.45, loot: { gold: [10, 25], rolls: 1, tierWeights: { tier0: 0.5, consumables: 0.4, spells: 0.1 } } },
    'gargoyle': { name: 'Stone Gargoyle', sprite: 'gargoyle', hp: 100, maxHp: 100, strength: 18, vitality: 20, intelligence: 5, spirit: 8, agility: 3, luck: 1, speed: 1, aggressive: true, xp: 45, lootChance: 0.7, loot: { gold: [30, 60], rolls: 2, tierWeights: { tier1: 0.5, tier2: 0.3, spells: 0.2 } } },
    'imp': { name: 'Fire Imp', sprite: 'imp', hp: 40, maxHp: 40, strength: 7, vitality: 4, intelligence: 10, spirit: 9, agility: 10, luck: 5, speed: 1, aggressive: true, xp: 20, lootChance: 0.55, loot: { gold: [12, 28], rolls: 1, tierWeights: { tier1: 0.4, spells: 0.5, consumables: 0.1 } } },
    'golem': { name: 'Iron Golem', sprite: 'golem', hp: 120, maxHp: 120, strength: 20, vitality: 25, intelligence: 2, spirit: 5, agility: 1, luck: 0, speed: 1, aggressive: false, xp: 50, lootChance: 0.8, loot: { gold: [40, 80], rolls: 3, tierWeights: { tier1: 0.5, tier2: 0.4, tier0: 0.1 } } },
    'spectre': { name: 'Spectre', sprite: 'spectre', hp: 55, maxHp: 55, strength: 8, vitality: 1, intelligence: 12, spirit: 15, agility: 11, luck: 3, speed: 1, aggressive: true, xp: 28, lootChance: 0.6, loot: { gold: [18, 35], rolls: 1, tierWeights: { tier1: 0.3, spells: 0.6, consumables: 0.1 } } }
};

// Tile Types
const tileTypes = {
    '.': { char: '.', name: 'grass', description: 'Green grass.', passable: true, sprite: 'grass' },
    '#': { char: '#', name: 'wall', description: 'Stone wall.', passable: false, sprite: 'wall' },
    '~': { char: '~', name: 'water', description: 'Blue water.', passable: false, sprite: 'water' },
    'T': { char: 'T', name: 'tree', description: 'Oak tree.', passable: false, sprite: 'tree' },
    'D': { char: 'D', name: 'door', description: 'Wooden door.', passable: true, sprite: 'door' },
    'G': { char: 'G', name: 'gate', description: 'Magenta gate.', passable: true, sprite: 'gate' },
    'M': { char: 'M', name: 'mountain', description: 'Mountain.', passable: false, sprite: 'mountain' },
    '$': { char: '$', name: 'treasure chest', description: 'Treasure!', passable: true, sprite: 'treasure' },
    'L': { char: 'L', name: 'loot bag', description: 'Dropped loot!', passable: true, sprite: 'lootbag' },
    '>': { char: '>', name: 'stairs down', description: 'Stairs down.', passable: true, sprite: 'stairsdown' },
    '<': { char: '<', name: 'stairs up', description: 'Stairs up.', passable: true, sprite: 'stairsup' },
    'f': { char: 'f', name: 'stone floor', description: 'Stone floor.', passable: true, sprite: 'floor' },
    'w': { char: 'w', name: 'window', description: 'Glass window.', passable: false, sprite: 'window' },
    't': { char: 't', name: 'table', description: 'Wooden table.', passable: false, sprite: 'table' },
    ',': { char: ',', name: 'sand', description: 'Sandy ground.', passable: true, sprite: 'sand' },
    'r': { char: 'r', name: 'rocks', description: 'Rocky ground.', passable: true, sprite: 'rocks' },
    '=': { char: '=', name: 'bridge', description: 'Wooden bridge.', passable: true, sprite: 'bridge' },
    's': { char: 's', name: 'scrub', description: 'Scrub brush.', passable: true, sprite: 'scrub' },
    '`': { char: '`', name: 'grass2', description: 'Tall grass.', passable: true, sprite: 'grass2' },
    'm': { char: 'm', name: 'mountains2', description: 'Mountain peak.', passable: true, sprite: 'mountains2' },
    'P': { char: 'P', name: 'mailbox', description: 'Mailbox.', passable: false, sprite: 'mailbox' },
    'F': { char: 'F', name: 'fountain', description: 'Water fountain.', passable: false, sprite: 'fountain' },
    'I': { char: 'I', name: 'streetlight', description: 'Street light.', passable: false, sprite: 'streetlight' },
    '+': { char: '+', name: 'brick', description: 'Brick wall.', passable: false, sprite: 'brick' },
    '_': { char: '_', name: 'cornice', description: 'Stone cornice.', passable: false, sprite: 'cornice' }
};

// NPC Database (unchanged)
const npcDatabase = {
    'elder': { name: 'Village Elder', sprite: 'villager', dialogue: [{ text: "Welcome to Haven Village, traveler. May you find rest here.", condition: null }, { text: "You've grown stronger! The village is safer with heroes like you nearby.", condition: (state) => state.player.level >= 5 }, { text: "The dungeon to the south is treacherous. Be careful, young one.", condition: (state) => state.player.level < 5 }] },
    'merchant': { name: 'Merchant', sprite: 'merchant', isShopkeeper: true, dialogue: [{ text: "Welcome to my shop! Take a look at my wares.", condition: null }] },
    'guard': { name: 'Town Guard', sprite: 'villager', dialogue: [{ text: "Stay safe out there. Monsters roam the wilderness.", condition: null }, { text: "I see you've been in the dungeon. Those skeletons are no joke!", condition: (state) => state.player.level >= 3 }] },
    'child': { name: 'Village Child', sprite: 'villager', dialogue: [{ text: "My dad says there's treasure hidden in the mountains!", condition: null }, { text: "Wow, you're so strong! Can you teach me to fight?", condition: (state) => state.player.level >= 10 }] },
    'hermit': { name: 'Old Hermit', sprite: 'villager', dialogue: [{ text: "The water speaks to those who listen... treasures lie beneath.", condition: null }, { text: "Ah, you found the silver key! Ancient secrets await you.", condition: (state) => state.player.inventory.includes('silver_key') }] }
};

// Shop Inventory (unchanged)
const shopInventory = {
    'merchant': [
        { itemId: 'health_potion', price: 50 },
        { itemId: 'short_sword', price: 200 },
        { itemId: 'steel_dagger', price: 150 },
        { itemId: 'rusty_sword', price: 80 },
        { itemId: 'rusty_dagger', price: 60 },
        { itemId: 'rusty_axe', price: 100 },
        { itemId: 'leather_armor', price: 120 },
        { itemId: 'chain_mail', price: 300 },
        { itemId: 'iron_plate', price: 500 },
        { itemId: 'lucky_charm', price: 100 },
        { itemId: 'power_ring', price: 200 },
        { itemId: 'magic_amulet', price: 250 },
        { itemId: 'swift_boots', price: 180 }
    ]
};

// These will be populated by LDtk loader
let maps = {};
let mapTransitions = {};
let enemySpawns = {};
let npcSpawns = {};
let treasureContents = {};
let specialLocations = {};