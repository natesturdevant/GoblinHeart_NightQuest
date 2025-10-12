// equipment.js - Complete loot system with 6 tiers and color rarity
console.log('=== EQUIPMENT.JS IS LOADING ===');

// ===== RARITY SYSTEM =====

const RARITY_COLORS = {
    common: '#AAAAAA',      // Gray - no affixes
    magic: '#4444FF',       // Blue - 1 affix
    rare: '#FFFF00',        // Yellow - 2 affixes
    set: '#00FF00',         // Green - set items
    unique: '#FF8000'       // Orange - legendaries
};

const RARITY_NAMES = {
    common: 'Common',
    magic: 'Magic',
    rare: 'Rare',
    set: 'Set',
    unique: 'Unique'
};

// ===== AFFIX SYSTEM =====

const itemAffixes = {
    prefixes: {
        // TIER 0-2: Early Game Affixes
        'sharp': {
            name: 'Sharp',
            minTier: 0,
            maxTier: 2,
            stats: { strength: 3 },
            properties: [],
            slots: ['weapon']
        },
        'sturdy': {
            name: 'Sturdy',
            minTier: 0,
            maxTier: 2,
            stats: { vitality: 5 },
            properties: [],
            slots: ['armor', 'helmet', 'offhand']
        },
        'quick': {
            name: 'Quick',
            minTier: 0,
            maxTier: 2,
            stats: { agility: 3 },
            properties: [],
            slots: ['weapon', 'gloves', 'boots']
        },
        
        // TIER 1-3: Mid Game Affixes
        'vicious': {
            name: 'Vicious',
            minTier: 1,
            maxTier: 99,
            stats: { strength: 8 },
            properties: [
                { type: 'critChance', value: 0.08, display: '+8% Crit Chance' }
            ],
            slots: ['weapon']
        },
        'fortified': {
            name: 'Fortified',
            minTier: 1,
            maxTier: 99,
            stats: { vitality: 10 },
            properties: [
                { type: 'damageReduction', value: 0.06, display: '6% Damage Reduction' }
            ],
            slots: ['armor', 'helmet', 'offhand']
        },
        'swift': {
            name: 'Swift',
            minTier: 1,
            maxTier: 99,
            stats: { agility: 8 },
            properties: [
                { type: 'dodge', value: 0.06, display: '+6% Dodge' }
            ],
            slots: ['gloves', 'boots']
        },
        'arcane': {
            name: 'Arcane',
            minTier: 1,
            maxTier: 99,
            stats: { intelligence: 8, spirit: 5 },
            properties: [
                { type: 'spellDamage', value: 0.12, display: '+12% Spell Damage' }
            ],
            slots: ['weapon', 'helmet', 'gloves', 'offhand']
        },
        'lucky': {
            name: 'Lucky',
            minTier: 1,
            maxTier: 99,
            stats: { luck: 8 },
            properties: [
                { type: 'magicFind', value: 0.15, display: '+15% Better Loot' }
            ],
            slots: ['all']
        },
        
        // TIER 3-5: Late Game Affixes
        'deadly': {
            name: 'Deadly',
            minTier: 3,
            maxTier: 99,
            stats: { strength: 15, agility: 8 },
            properties: [
                { type: 'critChance', value: 0.15, display: '+15% Crit Chance' },
                { type: 'critDamage', value: 0.4, display: '+40% Crit Damage' }
            ],
            slots: ['weapon']
        },
        'guardian': {
            name: 'Guardian\'s',
            minTier: 3,
            maxTier: 99,
            stats: { vitality: 18, spirit: 10 },
            properties: [
                { type: 'damageReduction', value: 0.12, display: '12% Damage Reduction' },
                { type: 'blockChance', value: 0.12, display: '+12% Block Chance' }
            ],
            slots: ['armor', 'offhand']
        },
        'lightning': {
            name: 'Lightning',
            minTier: 3,
            maxTier: 99,
            stats: { agility: 15, luck: 8 },
            properties: [
                { type: 'dodge', value: 0.12, display: '+12% Dodge' },
                { type: 'attackSpeed', value: 0.18, display: '+18% Attack Speed' }
            ],
            slots: ['weapon', 'gloves', 'boots']
        },
        'mystic': {
            name: 'Mystic',
            minTier: 3,
            maxTier: 99,
            stats: { intelligence: 18, spirit: 12 },
            properties: [
                { type: 'spellDamage', value: 0.25, display: '+25% Spell Damage' },
                { type: 'mpCostReduction', value: 0.18, display: '-18% Spell Cost' }
            ],
            slots: ['weapon', 'helmet', 'gloves', 'offhand']
        },
        'blessed': {
            name: 'Blessed',
            minTier: 3,
            maxTier: 99,
            stats: { luck: 15, spirit: 10 },
            properties: [
                { type: 'magicFind', value: 0.3, display: '+30% Better Loot' },
                { type: 'survivalChance', value: 0.08, display: '+8% Cheat Death' }
            ],
            slots: ['all']
        },
        'vampiric': {
            name: 'Vampiric',
            minTier: 3,
            maxTier: 99,
            stats: { strength: 12 },
            properties: [
                { type: 'lifesteal', value: 0.15, display: '15% Life Steal' }
            ],
            slots: ['weapon']
        },
        
        // TIER 5: Endgame Affixes
        'godslayer': {
            name: 'Godslayer',
            minTier: 5,
            maxTier: 99,
            stats: { strength: 25, luck: 15 },
            properties: [
                { type: 'critChance', value: 0.25, display: '+25% Crit Chance' },
                { type: 'critDamage', value: 1.0, display: '+100% Crit Damage' }
            ],
            slots: ['weapon']
        },
        'eternal': {
            name: 'Eternal',
            minTier: 5,
            maxTier: 99,
            stats: { vitality: 30, spirit: 20 },
            properties: [
                { type: 'damageReduction', value: 0.2, display: '20% Damage Reduction' },
                { type: 'maxHpBonus', value: 0.15, display: '+15% Max HP' },
                { type: 'survivalChance', value: 0.15, display: '+15% Cheat Death' }
            ],
            slots: ['armor', 'helmet']
        }
    },
    
    suffixes: {
        // TIER 0-2: Early Game Suffixes
        'of_power': {
            name: 'of Power',
            minTier: 0,
            maxTier: 2,
            stats: { strength: 4 },
            properties: [],
            slots: ['all']
        },
        'of_defense': {
            name: 'of Defense',
            minTier: 0,
            maxTier: 2,
            stats: { vitality: 5 },
            properties: [],
            slots: ['all']
        },
        'of_speed': {
            name: 'of Speed',
            minTier: 0,
            maxTier: 2,
            stats: { agility: 4 },
            properties: [],
            slots: ['all']
        },
        
        // TIER 1-3: Mid Game Suffixes
        'of_the_bear': {
            name: 'of the Bear',
            minTier: 1,
            maxTier: 99,
            stats: { strength: 10, vitality: 8 },
            properties: [],
            slots: ['all']
        },
        'of_the_fox': {
            name: 'of the Fox',
            minTier: 1,
            maxTier: 99,
            stats: { agility: 10, luck: 8 },
            properties: [],
            slots: ['all']
        },
        'of_the_owl': {
            name: 'of the Owl',
            minTier: 1,
            maxTier: 99,
            stats: { intelligence: 10, spirit: 8 },
            properties: [],
            slots: ['all']
        },
        'of_fortune': {
            name: 'of Fortune',
            minTier: 1,
            maxTier: 99,
            stats: { luck: 12 },
            properties: [
                { type: 'goldFind', value: 0.35, display: '+35% Gold Find' }
            ],
            slots: ['all']
        },
        'of_wounding': {
            name: 'of Wounding',
            minTier: 1,
            maxTier: 99,
            stats: { strength: 8 },
            properties: [
                { type: 'damageBonus', value: 0.18, display: '+18% Damage' }
            ],
            slots: ['weapon']
        },
        'of_protection': {
            name: 'of Protection',
            minTier: 1,
            maxTier: 99,
            stats: { vitality: 10 },
            properties: [
                { type: 'damageReduction', value: 0.1, display: '10% Damage Reduction' }
            ],
            slots: ['armor', 'helmet', 'offhand']
        },
        
        // TIER 3-5: Late Game Suffixes
        'of_the_wolf': {
            name: 'of the Wolf',
            minTier: 3,
            maxTier: 99,
            stats: { strength: 15, agility: 12, luck: 10 },
            properties: [],
            slots: ['all']
        },
        'of_greed': {
            name: 'of Greed',
            minTier: 3,
            maxTier: 99,
            stats: { luck: 18 },
            properties: [
                { type: 'goldFind', value: 0.6, display: '+60% Gold Find' },
                { type: 'magicFind', value: 0.25, display: '+25% Better Loot' }
            ],
            slots: ['all']
        },
        'of_slaying': {
            name: 'of Slaying',
            minTier: 3,
            maxTier: 99,
            stats: { strength: 15, agility: 10 },
            properties: [
                { type: 'damageBonus', value: 0.3, display: '+30% Damage' },
                { type: 'critDamage', value: 0.5, display: '+50% Crit Damage' }
            ],
            slots: ['weapon']
        },
        'of_the_titan': {
            name: 'of the Titan',
            minTier: 3,
            maxTier: 99,
            stats: { vitality: 20, strength: 12 },
            properties: [
                { type: 'damageReduction', value: 0.15, display: '15% Damage Reduction' },
                { type: 'maxHpBonus', value: 0.12, display: '+12% Max HP' }
            ],
            slots: ['armor', 'helmet']
        },
        'of_shadows': {
            name: 'of Shadows',
            minTier: 3,
            maxTier: 99,
            stats: { agility: 18, luck: 12 },
            properties: [
                { type: 'dodge', value: 0.18, display: '+18% Dodge' },
                { type: 'critChance', value: 0.12, display: '+12% Crit Chance' }
            ],
            slots: ['armor', 'gloves', 'boots']
        },
        'of_wisdom': {
            name: 'of Wisdom',
            minTier: 3,
            maxTier: 99,
            stats: { intelligence: 15, spirit: 12 },
            properties: [
                { type: 'mpRegen', value: 0.15, display: '+15% MP Regen' }
            ],
            slots: ['helmet', 'offhand']
        },
        'of_the_archmage': {
            name: 'of the Archmage',
            minTier: 4,
            maxTier: 99,
            stats: { intelligence: 20, spirit: 18 },
            properties: [
                { type: 'spellDamage', value: 0.35, display: '+35% Spell Damage' },
                { type: 'mpCostReduction', value: 0.25, display: '-25% Spell Cost' },
                { type: 'maxMpBonus', value: 0.18, display: '+18% Max MP' }
            ],
            slots: ['helmet', 'gloves', 'offhand']
        },
        
        // TIER 5: Endgame Suffixes
        'of_the_gods': {
            name: 'of the Gods',
            minTier: 5,
            maxTier: 99,
            stats: { strength: 25, vitality: 20, intelligence: 20, spirit: 18, agility: 22, luck: 20 },
            properties: [],
            slots: ['all']
        },
        'of_infinity': {
            name: 'of Infinity',
            minTier: 5,
            maxTier: 99,
            stats: { luck: 30 },
            properties: [
                { type: 'goldFind', value: 1.0, display: '+100% Gold Find' },
                { type: 'magicFind', value: 0.5, display: '+50% Better Loot' },
                { type: 'luckyFind', value: 0.2, display: '20% Bonus Item' }
            ],
            slots: ['all']
        }
    }
};

// ===== BASE ITEM TEMPLATES (6 TIERS) =====

const baseItems = {
    // ===== WEAPONS - DAGGERS =====
    // Tier 0
    'rusty_dagger': {
        baseName: 'Rusty Dagger',
        type: 'weapon',
        weaponType: weaponTypes.DAGGER,
        tier: 0,
        slot: 'weapon',
        baseStats: { strength: 3, agility: 2 }
    },
    // Tier 1
    'dagger': {
        baseName: 'Dagger',
        type: 'weapon',
        weaponType: weaponTypes.DAGGER,
        tier: 1,
        slot: 'weapon',
        baseStats: { strength: 7, agility: 5 }
    },
    // Tier 2
    'steel_dagger': {
        baseName: 'Steel Dagger',
        type: 'weapon',
        weaponType: weaponTypes.DAGGER,
        tier: 2,
        slot: 'weapon',
        baseStats: { strength: 12, agility: 9 }
    },
    // Tier 3
    'battle_dagger': {
        baseName: 'Battle Dagger',
        type: 'weapon',
        weaponType: weaponTypes.DAGGER,
        tier: 3,
        slot: 'weapon',
        baseStats: { strength: 18, agility: 14, luck: 3 }
    },
    // Tier 4
    'assassin_blade': {
        baseName: 'Assassin Blade',
        type: 'weapon',
        weaponType: weaponTypes.DAGGER,
        tier: 4,
        slot: 'weapon',
        baseStats: { strength: 25, agility: 20, luck: 8 }
    },
    // Tier 5
    'void_edge': {
        baseName: 'Void Edge',
        type: 'weapon',
        weaponType: weaponTypes.DAGGER,
        tier: 5,
        slot: 'weapon',
        baseStats: { strength: 35, agility: 28, luck: 15 }
    },
    
    // ===== WEAPONS - SWORDS =====
    // Tier 0
    'rusty_sword': {
        baseName: 'Rusty Sword',
        type: 'weapon',
        weaponType: weaponTypes.SWORD,
        tier: 0,
        slot: 'weapon',
        baseStats: { strength: 5, vitality: 2 }
    },
    // Tier 1
    'short_sword': {
        baseName: 'Short Sword',
        type: 'weapon',
        weaponType: weaponTypes.SWORD,
        tier: 1,
        slot: 'weapon',
        baseStats: { strength: 10, vitality: 3 }
    },
    // Tier 2
    'longsword': {
        baseName: 'Longsword',
        type: 'weapon',
        weaponType: weaponTypes.SWORD,
        tier: 2,
        slot: 'weapon',
        baseStats: { strength: 16, vitality: 5 }
    },
    // Tier 3
    'greatsword': {
        baseName: 'Greatsword',
        type: 'weapon',
        weaponType: weaponTypes.SWORD,
        tier: 3,
        slot: 'weapon',
        baseStats: { strength: 24, vitality: 8, agility: -2 }
    },
    // Tier 4
    'runeblade': {
        baseName: 'Runeblade',
        type: 'weapon',
        weaponType: weaponTypes.SWORD,
        tier: 4,
        slot: 'weapon',
        baseStats: { strength: 32, vitality: 12, intelligence: 8 }
    },
    // Tier 5
    'flamebrand': {
        baseName: 'Flamebrand',
        type: 'weapon',
        weaponType: weaponTypes.SWORD,
        tier: 5,
        slot: 'weapon',
        baseStats: { strength: 42, vitality: 18, intelligence: 12 }
    },
    
    // ===== WEAPONS - AXES =====
    // Tier 1
    'axe': {
        baseName: 'Axe',
        type: 'weapon',
        weaponType: weaponTypes.AXE,
        tier: 1,
        slot: 'weapon',
        baseStats: { strength: 12 }
    },
    // Tier 2
    'war_axe': {
        baseName: 'War Axe',
        type: 'weapon',
        weaponType: weaponTypes.AXE,
        tier: 2,
        slot: 'weapon',
        baseStats: { strength: 20, vitality: -2 }
    },
    // Tier 3
    'battle_axe': {
        baseName: 'Battle Axe',
        type: 'weapon',
        weaponType: weaponTypes.AXE,
        tier: 3,
        slot: 'weapon',
        baseStats: { strength: 28, vitality: -3, agility: -2 }
    },
    // Tier 4
    'berserker_axe': {
        baseName: 'Berserker Axe',
        type: 'weapon',
        weaponType: weaponTypes.AXE,
        tier: 4,
        slot: 'weapon',
        baseStats: { strength: 38, vitality: -4, agility: -3 }
    },
    
    // ===== WEAPONS - BOWS =====
    // Tier 1
    'bow': {
        baseName: 'Bow',
        type: 'weapon',
        weaponType: weaponTypes.BOW,
        tier: 1,
        slot: 'weapon',
        baseStats: { strength: 6, agility: 8 }
    },
    // Tier 2
    'longbow': {
        baseName: 'Longbow',
        type: 'weapon',
        weaponType: weaponTypes.BOW,
        tier: 2,
        slot: 'weapon',
        baseStats: { strength: 10, agility: 14 }
    },
    // Tier 3
    'composite_bow': {
        baseName: 'Composite Bow',
        type: 'weapon',
        weaponType: weaponTypes.BOW,
        tier: 3,
        slot: 'weapon',
        baseStats: { strength: 15, agility: 20 }
    },
    
    // ===== WEAPONS - STAVES =====
    // Tier 1
    'staff': {
        baseName: 'Staff',
        type: 'weapon',
        weaponType: weaponTypes.STAFF,
        tier: 1,
        slot: 'weapon',
        baseStats: { intelligence: 10, spirit: 5 }
    },
    // Tier 2
    'battle_staff': {
        baseName: 'Battle Staff',
        type: 'weapon',
        weaponType: weaponTypes.STAFF,
        tier: 2,
        slot: 'weapon',
        baseStats: { intelligence: 16, spirit: 10 }
    },
    // Tier 3
    'mage_staff': {
        baseName: 'Mage Staff',
        type: 'weapon',
        weaponType: weaponTypes.STAFF,
        tier: 3,
        slot: 'weapon',
        baseStats: { intelligence: 24, spirit: 16 }
    },
    // Tier 4
    'archmage_staff': {
        baseName: 'Archmage Staff',
        type: 'weapon',
        weaponType: weaponTypes.STAFF,
        tier: 4,
        slot: 'weapon',
        baseStats: { intelligence: 34, spirit: 24 }
    },
    
    // ===== WEAPONS - MACES =====
    // Tier 1
    'mace': {
        baseName: 'Mace',
        type: 'weapon',
        weaponType: weaponTypes.MACE,
        tier: 1,
        slot: 'weapon',
        baseStats: { strength: 9, vitality: 4 }
    },
    // Tier 2
    'war_hammer': {
        baseName: 'War Hammer',
        type: 'weapon',
        weaponType: weaponTypes.MACE,
        tier: 2,
        slot: 'weapon',
        baseStats: { strength: 18, vitality: 8 }
    },
    
    // ===== OFFHAND - SHIELDS =====
    // Tier 0
    'buckler': {
        baseName: 'Buckler',
        type: 'shield',
        tier: 0,
        slot: 'offhand',
        baseStats: { vitality: 5 }
    },
    // Tier 1
    'shield': {
        baseName: 'Shield',
        type: 'shield',
        tier: 1,
        slot: 'offhand',
        baseStats: { vitality: 10, agility: -1 }
    },
    // Tier 2
    'kite_shield': {
        baseName: 'Kite Shield',
        type: 'shield',
        tier: 2,
        slot: 'offhand',
        baseStats: { vitality: 16, strength: 3, agility: -2 }
    },
    // Tier 3
    'tower_shield': {
        baseName: 'Tower Shield',
        type: 'shield',
        tier: 3,
        slot: 'offhand',
        baseStats: { vitality: 24, strength: 5, agility: -4 }
    },
    
    // ===== OFFHAND - SPELL FOCUS =====
    // Tier 1
    'focus': {
        baseName: 'Spell Focus',
        type: 'focus',
        tier: 1,
        slot: 'offhand',
        baseStats: { intelligence: 8, spirit: 6 }
    },
    // Tier 2
    'orb': {
        baseName: 'Arcane Orb',
        type: 'focus',
        tier: 2,
        slot: 'offhand',
        baseStats: { intelligence: 14, spirit: 10 }
    },
    // Tier 3
    'crystal': {
        baseName: 'Power Crystal',
        type: 'focus',
        tier: 3,
        slot: 'offhand',
        baseStats: { intelligence: 20, spirit: 16 }
    },
    
    // ===== ARMOR =====
    // Tier 0
    'rags': {
        baseName: 'Rags',
        type: 'armor',
        tier: 0,
        slot: 'armor',
        baseStats: { vitality: 3 }
    },
    // Tier 1
    'leather_armor': {
        baseName: 'Leather Armor',
        type: 'armor',
        tier: 1,
        slot: 'armor',
        baseStats: { vitality: 10, agility: 1 }
    },
    // Tier 2
    'chainmail': {
        baseName: 'Chainmail',
        type: 'armor',
        tier: 2,
        slot: 'armor',
        baseStats: { vitality: 18, agility: -1 }
    },
    // Tier 3
    'plate_armor': {
        baseName: 'Plate Armor',
        type: 'armor',
        tier: 3,
        slot: 'armor',
        baseStats: { vitality: 28, strength: 5, agility: -3 }
    },
    // Tier 4
    'dragon_scale': {
        baseName: 'Dragon Scale Armor',
        type: 'armor',
        tier: 4,
        slot: 'armor',
        baseStats: { vitality: 40, strength: 8, spirit: 6, agility: -2 }
    },
    // Tier 5
    'celestial_plate': {
        baseName: 'Celestial Plate',
        type: 'armor',
        tier: 5,
        slot: 'armor',
        baseStats: { vitality: 55, strength: 12, spirit: 10, agility: 0 }
    },
    
    // ===== HELMETS =====
    // Tier 0
    'cap': {
        baseName: 'Cap',
        type: 'helmet',
        tier: 0,
        slot: 'helmet',
        baseStats: { vitality: 2 }
    },
    // Tier 1
    'helmet': {
        baseName: 'Helmet',
        type: 'helmet',
        tier: 1,
        slot: 'helmet',
        baseStats: { vitality: 6, strength: 2 }
    },
    // Tier 2
    'chain_coif': {
        baseName: 'Chain Coif',
        type: 'helmet',
        tier: 2,
        slot: 'helmet',
        baseStats: { vitality: 10, strength: 4 }
    },
    // Tier 3
    'great_helm': {
        baseName: 'Great Helm',
        type: 'helmet',
        tier: 3,
        slot: 'helmet',
        baseStats: { vitality: 16, strength: 6, agility: -1 }
    },
    // Tier 4
    'crowned_helm': {
        baseName: 'Crowned Helm',
        type: 'helmet',
        tier: 4,
        slot: 'helmet',
        baseStats: { vitality: 24, strength: 10, luck: 5 }
    },
    
    // ===== GLOVES =====
    // Tier 0
    'cloth_gloves': {
        baseName: 'Cloth Gloves',
        type: 'gloves',
        tier: 0,
        slot: 'gloves',
        baseStats: { agility: 1 }
    },
    // Tier 1
    'gloves': {
        baseName: 'Gloves',
        type: 'gloves',
        tier: 1,
        slot: 'gloves',
        baseStats: { agility: 3 }
    },
    // Tier 2
    'leather_gloves': {
        baseName: 'Leather Gloves',
        type: 'gloves',
        tier: 2,
        slot: 'gloves',
        baseStats: { agility: 6, strength: 2 }
    },
    // Tier 3
    'gauntlets': {
        baseName: 'Gauntlets',
        type: 'gloves',
        tier: 3,
        slot: 'gloves',
        baseStats: { strength: 8, vitality: 5 }
    },
    // Tier 4
    'assassin_gloves': {
        baseName: 'Assassin Gloves',
        type: 'gloves',
        tier: 4,
        slot: 'gloves',
        baseStats: { agility: 12, strength: 6, luck: 4 }
    },
    
    // ===== BOOTS =====
    // Tier 0
    'worn_boots': {
        baseName: 'Worn Boots',
        type: 'boots',
        tier: 0,
        slot: 'boots',
        baseStats: { agility: 2 }
    },
    // Tier 1
    'boots': {
        baseName: 'Boots',
        type: 'boots',
        tier: 1,
        slot: 'boots',
        baseStats: { agility: 4 }
    },
    // Tier 2
    'leather_boots': {
        baseName: 'Leather Boots',
        type: 'boots',
        tier: 2,
        slot: 'boots',
        baseStats: { agility: 7, vitality: 3 }
    },
    // Tier 3
    'heavy_boots': {
        baseName: 'Heavy Boots',
        type: 'boots',
        tier: 3,
        slot: 'boots',
        baseStats: { vitality: 8, agility: 5 }
    },
    // Tier 4
    'winged_boots': {
        baseName: 'Winged Boots',
        type: 'boots',
        tier: 4,
        slot: 'boots',
        baseStats: { agility: 14, luck: 6 }
    },
    
    // ===== RINGS =====
    // Tier 0
    'copper_ring': {
        baseName: 'Copper Ring',
        type: 'ring',
        tier: 0,
        slot: 'ring1',
        baseStats: { luck: 2 }
    },
    // Tier 1
    'silver_ring': {
        baseName: 'Silver Ring',
        type: 'ring',
        tier: 1,
        slot: 'ring1',
        baseStats: { luck: 5 }
    },
    // Tier 2
    'gold_ring': {
        baseName: 'Gold Ring',
        type: 'ring',
        tier: 2,
        slot: 'ring1',
        baseStats: { luck: 8 }
    },
    // Tier 3
    'diamond_ring': {
        baseName: 'Diamond Ring',
        type: 'ring',
        tier: 3,
        slot: 'ring1',
        baseStats: { luck: 12 }
    },
    // Tier 4
    'platinum_ring': {
        baseName: 'Platinum Ring',
        type: 'ring',
        tier: 4,
        slot: 'ring1',
        baseStats: { luck: 18 }
    }
};

// ===== UNIQUE ITEMS (Legendaries) =====

const uniqueItems = {
    'shadowfang': {
        name: 'Shadowfang',
        rarity: 'unique',
        type: 'weapon',
        weaponType: weaponTypes.DAGGER,
        tier: 5,
        slot: 'weapon',
        description: 'A dagger forged in pure darkness. Whispers secrets to its wielder.',
        canEquip: true,
        stats: { strength: 30, agility: 25, luck: 20, intelligence: 8 },
        properties: [
            { type: 'critChance', value: 0.3, display: '+30% Crit Chance' },
            { type: 'critDamage', value: 1.0, display: '+100% Crit Damage' },
            { type: 'dodge', value: 0.18, display: '+18% Dodge' },
            { type: 'lifesteal', value: 0.12, display: '12% Life Steal' }
        ]
    },
    
    'heart_of_the_mountain': {
        name: 'Heart of the Mountain',
        rarity: 'unique',
        type: 'armor',
        tier: 5,
        slot: 'armor',
        description: 'Carved from a single piece of mountain stone. Weighs nothing, protects everything.',
        canEquip: true,
        stats: { vitality: 50, strength: 15, spirit: 20, agility: -5 },
        properties: [
            { type: 'damageReduction', value: 0.3, display: '30% Damage Reduction' },
            { type: 'maxHpBonus', value: 0.25, display: '+25% Max HP' },
            { type: 'reflectDamage', value: 0.2, display: 'Reflect 20% of Damage Taken' }
        ]
    },
    
    'ring_of_endless_fortune': {
        name: 'Ring of Endless Fortune',
        rarity: 'unique',
        type: 'ring',
        tier: 5,
        slot: 'ring1',
        description: 'Legend says this ring has never left a dungeon without treasure.',
        canEquip: true,
        stats: { luck: 30 },
        properties: [
            { type: 'goldFind', value: 1.5, display: '+150% Gold Find' },
            { type: 'magicFind', value: 0.75, display: '+75% Better Loot' },
            { type: 'luckyFind', value: 0.3, display: '30% Bonus Item Drop' },
            { type: 'survivalChance', value: 0.15, display: '+15% Cheat Death' }
        ]
    },
    
    'staff_of_ages': {
        name: 'Staff of Ages',
        rarity: 'unique',
        type: 'weapon',
        weaponType: weaponTypes.STAFF,
        tier: 5,
        slot: 'weapon',
        description: 'Wielded by the first archmage. Still hums with ancient power.',
        canEquip: true,
        stats: { intelligence: 35, spirit: 28, vitality: 15 },
        properties: [
            { type: 'spellDamage', value: 0.6, display: '+60% Spell Damage' },
            { type: 'mpCostReduction', value: 0.35, display: '-35% Spell Cost' },
            { type: 'maxMpBonus', value: 0.3, display: '+30% Max MP' },
            { type: 'mpRegen', value: 0.25, display: '+25% MP Regen' }
        ]
    },
    
    'thunderfury': {
        name: 'Thunderfury, Blade of the Windseeker',
        rarity: 'unique',
        type: 'weapon',
        weaponType: weaponTypes.SWORD,
        tier: 5,
        slot: 'weapon',
        description: 'Did someone say Thunderfury, Blade of the Windseeker?',
        canEquip: true,
        stats: { strength: 40, agility: 20, intelligence: 15 },
        properties: [
            { type: 'damageBonus', value: 0.5, display: '+50% Damage' },
            { type: 'attackSpeed', value: 0.3, display: '+30% Attack Speed' },
            { type: 'chainLightning', value: 1, display: 'Attacks Chain to 3 Enemies' }
        ]
    }
};

// ===== SET ITEMS =====

const setItems = {
    // Goblin Slayer Set (Tier 2)
    'goblin_slayer_sword': {
        name: 'Goblin Slayer\'s Blade',
        rarity: 'set',
        setId: 'goblin_slayer',
        type: 'weapon',
        weaponType: weaponTypes.SWORD,
        tier: 2,
        slot: 'weapon',
        canEquip: true,
        stats: { strength: 14, luck: 6 },
        properties: [
            { type: 'damageToGoblins', value: 0.3, display: '+30% Damage to Goblins' }
        ]
    },
    'goblin_slayer_helm': {
        name: 'Goblin Slayer\'s Helm',
        rarity: 'set',
        setId: 'goblin_slayer',
        tier: 2,
        slot: 'helmet',
        canEquip: true,
        stats: { vitality: 12, luck: 6 },
        properties: []
    },
    'goblin_slayer_boots': {
        name: 'Goblin Slayer\'s Treads',
        rarity: 'set',
        setId: 'goblin_slayer',
        tier: 2,
        slot: 'boots',
        canEquip: true,
        stats: { agility: 8, luck: 6 },
        properties: []
    },
    
    // Fortune's Favorite Set (Tier 3 - Luck build)
    'fortunate_helm': {
        name: 'Fortunate\'s Crown',
        rarity: 'set',
        setId: 'fortunate_wanderer',
        tier: 3,
        slot: 'helmet',
        canEquip: true,
        stats: { luck: 12, intelligence: 5 },
        properties: [
            { type: 'magicFind', value: 0.2, display: '+20% Better Loot' }
        ]
    },
    'fortunate_ring': {
        name: 'Fortunate\'s Band',
        rarity: 'set',
        setId: 'fortunate_wanderer',
        tier: 3,
        slot: 'ring1',
        canEquip: true,
        stats: { luck: 15 },
        properties: [
            { type: 'goldFind', value: 0.25, display: '+25% Gold Find' }
        ]
    },
    'fortunate_gloves': {
        name: 'Fortunate\'s Grasp',
        rarity: 'set',
        setId: 'fortunate_wanderer',
        tier: 3,
        slot: 'gloves',
        canEquip: true,
        stats: { agility: 8, luck: 12 },
        properties: [
            { type: 'goldFind', value: 0.25, display: '+25% Gold Find' }
        ]
    },
    'fortunate_boots': {
        name: 'Fortunate\'s Stride',
        rarity: 'set',
        setId: 'fortunate_wanderer',
        tier: 3,
        slot: 'boots',
        canEquip: true,
        stats: { agility: 8, luck: 12 },
        properties: []
    },
    
    // Shadow Walker Set (Tier 4 - Crit/Dodge build)
    'shadow_dagger': {
        name: 'Shadow\'s Fang',
        rarity: 'set',
        setId: 'shadow_walker',
        type: 'weapon',
        weaponType: weaponTypes.DAGGER,
        tier: 4,
        slot: 'weapon',
        canEquip: true,
        stats: { strength: 22, agility: 18, luck: 12 },
        properties: [
            { type: 'critChance', value: 0.18, display: '+18% Crit Chance' }
        ]
    },
    'shadow_cloak': {
        name: 'Shadow\'s Embrace',
        rarity: 'set',
        setId: 'shadow_walker',
        tier: 4,
        slot: 'armor',
        canEquip: true,
        stats: { vitality: 18, agility: 20, luck: 12 },
        properties: [
            { type: 'dodge', value: 0.15, display: '+15% Dodge' }
        ]
    },
    'shadow_grips': {
        name: 'Shadow\'s Touch',
        rarity: 'set',
        setId: 'shadow_walker',
        tier: 4,
        slot: 'gloves',
        canEquip: true,
        stats: { agility: 14, luck: 12 },
        properties: [
            { type: 'critDamage', value: 0.4, display: '+40% Crit Damage' }
        ]
    },
    'shadow_boots': {
        name: 'Shadow\'s Step',
        rarity: 'set',
        setId: 'shadow_walker',
        tier: 4,
        slot: 'boots',
        canEquip: true,
        stats: { agility: 16, luck: 12 },
        properties: [
            { type: 'dodge', value: 0.1, display: '+10% Dodge' }
        ]
    }
};

// ===== SET BONUSES =====

const itemSets = {
    'goblin_slayer': {
        name: "Goblin Slayer's Arsenal",
        pieces: ['goblin_slayer_sword', 'goblin_slayer_helm', 'goblin_slayer_boots'],
        bonuses: {
            2: {
                display: "(2) Set: +5 STR, +3 LUK, +30% Damage to Goblins",
                stats: { strength: 5, luck: 3 },
                properties: [
                    { type: 'damageToGoblins', value: 0.3, display: '+30% Damage to Goblins' }
                ]
            },
            3: {
                display: "(3) Set: +10 STR, +8 VIT, +5 LUK, +50% Damage to Goblins, +50% Gold from Goblins",
                stats: { strength: 10, vitality: 8, luck: 5 },
                properties: [
                    { type: 'damageToGoblins', value: 0.5, display: '+50% Damage to Goblins' },
                    { type: 'goldFromGoblins', value: 0.5, display: '+50% Gold from Goblins' }
                ]
            }
        }
    },
    
    'fortunate_wanderer': {
        name: "Fortune's Favorite",
        pieces: ['fortunate_helm', 'fortunate_ring', 'fortunate_gloves', 'fortunate_boots'],
        bonuses: {
            2: {
                display: "(2) Set: +8 LUK, +30% Gold Find",
                stats: { luck: 8 },
                properties: [
                    { type: 'goldFind', value: 0.3, display: '+30% Gold Find' }
                ]
            },
            3: {
                display: "(3) Set: +15 LUK, +60% Gold Find, +35% Better Loot",
                stats: { luck: 15 },
                properties: [
                    { type: 'goldFind', value: 0.6, display: '+60% Gold Find' },
                    { type: 'magicFind', value: 0.35, display: '+35% Better Loot' }
                ]
            },
            4: {
                display: "(4) Set: +25 LUK, +100% Gold Find, +70% Better Loot, 20% Bonus Item",
                stats: { luck: 25 },
                properties: [
                    { type: 'goldFind', value: 1.0, display: '+100% Gold Find' },
                    { type: 'magicFind', value: 0.7, display: '+70% Better Loot' },
                    { type: 'luckyFind', value: 0.2, display: '20% Chance for Bonus Item' }
                ]
            }
        }
    },
    
    'shadow_walker': {
        name: "Shadow Walker",
        pieces: ['shadow_dagger', 'shadow_cloak', 'shadow_grips', 'shadow_boots'],
        bonuses: {
            2: {
                display: "(2) Set: +10 AGI, +8 LUK, +12% Dodge",
                stats: { agility: 10, luck: 8 },
                properties: [
                    { type: 'dodge', value: 0.12, display: '+12% Dodge' }
                ]
            },
            3: {
                display: "(3) Set: +18 AGI, +12 LUK, +20% Dodge, +18% Crit Chance",
                stats: { agility: 18, luck: 12 },
                properties: [
                    { type: 'dodge', value: 0.2, display: '+20% Dodge' },
                    { type: 'critChance', value: 0.18, display: '+18% Crit Chance' }
                ]
            },
            4: {
                display: "(4) Set: +30 AGI, +20 LUK, +30% Dodge, +30% Crit Chance, Backstabs deal +250% Damage",
                stats: { agility: 30, luck: 20 },
                properties: [
                    { type: 'dodge', value: 0.3, display: '+30% Dodge' },
                    { type: 'critChance', value: 0.3, display: '+30% Crit Chance' },
                    { type: 'backstab', value: 2.5, display: 'Backstabs deal +250% Damage' }
                ]
            }
        }
    }
};

// ===== CONSUMABLES =====

const consumableItems = {
    'health_potion': {
        name: 'Health Potion',
        type: 'consumable',
        rarity: 'common',
        description: 'Restores 50 HP.',
        canEquip: false,
        stats: { strength: 0, vitality: 0, intelligence: 0, spirit: 0, agility: 0, luck: 0 },
        onUse: function() {
            const heal = 50;
            const old = gameState.player.hp;
            gameState.player.hp = Math.min(gameState.player.hp + heal, gameState.player.maxHp);
            addMessage(`Restored ${gameState.player.hp - old} HP!`);
            return true;
        }
    },
    
    'mana_potion': {
        name: 'Mana Potion',
        type: 'consumable',
        rarity: 'common',
        description: 'Restores 30 MP.',
        canEquip: false,
        stats: { strength: 0, vitality: 0, intelligence: 0, spirit: 0, agility: 0, luck: 0 },
        onUse: function() {
            const restore = 30;
            const old = gameState.player.mp;
            gameState.player.mp = Math.min(gameState.player.mp + restore, gameState.player.maxMp);
            addMessage(`Restored ${gameState.player.mp - old} MP!`);
            return true;
        }
    },
    
    'town_portal': {
        name: 'Town Portal',
        type: 'consumable',
        rarity: 'magic',
        description: 'Instantly return to the nearest town!',
        canEquip: false,
        stats: { strength: 0, vitality: 0, intelligence: 0, spirit: 0, agility: 0, luck: 0 },
        onUse: function() {
            addMessage("A portal opens!");
            loadMap('town');
            gameState.player.x = 7;
            gameState.player.y = 7;
            renderWorld();
            return true;
        }
    },
    
    'magic_scroll': {
        name: 'Magic Scroll',
        type: 'consumable',
        rarity: 'magic',
        description: 'Damages all enemies!',
        canEquip: false,
        stats: { strength: 0, vitality: 0, intelligence: 0, spirit: 0, agility: 0, luck: 0 },
        onUse: function() {
            addMessage("Arcane energy erupts!");
            let hit = 0;
            const stats = calculateStats();
            gameState.enemies.forEach(e => {
                const dmg = 15 + Math.floor(stats.intelligence * 1.5);
                e.hp -= dmg;
                addMessage(`${e.name} takes ${dmg} damage!`);
                hit++;
            });
            gameState.enemies = gameState.enemies.filter(e => {
                if (e.hp <= 0) {
                    addMessage(`${e.name} destroyed!`);
                    return false;
                }
                return true;
            });
            if (hit === 0) addMessage("No enemies affected.");
            renderWorld();
            return true;
        }
    }
};

// Spell scrolls (unchanged from before)
const spellScrolls = {
    'spell_fire_bolt': {
        name: 'Spell: Fire Bolt',
        type: 'spell_scroll',
        rarity: 'magic',
        spellId: 'fire_bolt',
        description: 'Learn Fire Bolt spell.',
        canEquip: false,
        stats: { strength: 0, vitality: 0, intelligence: 0, spirit: 0, agility: 0, luck: 0 },
        onUse: function() {
            if (gameState.player.knownSpells.includes('fire_bolt')) {
                addMessage("Already know this spell!");
                return false;
            }
            gameState.player.knownSpells.push('fire_bolt');
            addMessage("Learned Fire Bolt!");
            return true;
        }
    },
    'spell_heal': {
        name: 'Spell: Heal',
        type: 'spell_scroll',
        rarity: 'magic',
        spellId: 'heal',
        description: 'Learn Heal spell.',
        canEquip: false,
        stats: { strength: 0, vitality: 0, intelligence: 0, spirit: 0, agility: 0, luck: 0 },
        onUse: function() {
            if (gameState.player.knownSpells.includes('heal')) {
                addMessage("Already know this spell!");
                return false;
            }
            gameState.player.knownSpells.push('heal');
            addMessage("Learned Heal!");
            return true;
        }
    },
    'spell_barrier': {
        name: 'Spell: Barrier',
        type: 'spell_scroll',
        rarity: 'magic',
        spellId: 'barrier',
        description: 'Learn Barrier spell.',
        canEquip: false,
        stats: { strength: 0, vitality: 0, intelligence: 0, spirit: 0, agility: 0, luck: 0 },
        onUse: function() {
            if (gameState.player.knownSpells.includes('barrier')) {
                addMessage("Already know this spell!");
                return false;
            }
            gameState.player.knownSpells.push('barrier');
            addMessage("Learned Barrier!");
            return true;
        }
    },
    'spell_weaken': {
        name: 'Spell: Weaken',
        type: 'spell_scroll',
        rarity: 'magic',
        spellId: 'weaken',
        description: 'Learn Weaken spell.',
        canEquip: false,
        stats: { strength: 0, vitality: 0, intelligence: 0, spirit: 0, agility: 0, luck: 0 },
        onUse: function() {
            if (gameState.player.knownSpells.includes('weaken')) {
                addMessage("Already know this spell!");
                return false;
            }
            gameState.player.knownSpells.push('weaken');
            addMessage("Learned Weaken!");
            return true;
        }
    },
    'spell_lightning': {
        name: 'Spell: Lightning',
        type: 'spell_scroll',
        rarity: 'magic',
        spellId: 'lightning',
        description: 'Learn Lightning spell.',
        canEquip: false,
        stats: { strength: 0, vitality: 0, intelligence: 0, spirit: 0, agility: 0, luck: 0 },
        onUse: function() {
            if (gameState.player.knownSpells.includes('lightning')) {
                addMessage("Already know this spell!");
                return false;
            }
            gameState.player.knownSpells.push('lightning');
            addMessage("Learned Lightning!");
            return true;
        }
    }
};

// ===== COMBINED ITEM DATABASE =====

const itemDatabase = {
    ...consumableItems,
    ...spellScrolls,
    ...uniqueItems,
    ...setItems
};

// ===== LOOT GENERATION =====

function generateMagicItem(baseItemId, rarity = 'magic') {
    const base = baseItems[baseItemId];
    if (!base) return null;
    
    const item = {
        id: `${baseItemId}_${Math.random().toString(36).substr(2, 9)}`,
        baseName: base.baseName,
        rarity: rarity,
        type: base.type,
        weaponType: base.weaponType,
        tier: base.tier,
        slot: base.slot,
        canEquip: true,
        baseStats: { ...base.baseStats },
        stats: { strength: 0, vitality: 0, intelligence: 0, spirit: 0, agility: 0, luck: 0, ...base.baseStats },
        properties: [],
        affixes: []
    };
    
    // Add affixes based on rarity
    if (rarity === 'magic') {
        // 1 affix (prefix OR suffix)
        const usePrefix = Math.random() < 0.5;
        const affixPool = usePrefix ? itemAffixes.prefixes : itemAffixes.suffixes;
        const validAffixes = Object.entries(affixPool).filter(([id, affix]) => {
            return (affix.slots.includes('all') || affix.slots.includes(base.slot)) &&
                   affix.minTier <= base.tier &&
                   affix.maxTier >= base.tier;
        });
        
        if (validAffixes.length > 0) {
            const [affixId, affix] = validAffixes[Math.floor(Math.random() * validAffixes.length)];
            item.affixes.push({ id: affixId, ...affix, isPrefix: usePrefix });
        }
    } else if (rarity === 'rare') {
        // 2 affixes (prefix AND suffix)
        const validPrefixes = Object.entries(itemAffixes.prefixes).filter(([id, affix]) => {
            return (affix.slots.includes('all') || affix.slots.includes(base.slot)) &&
                   affix.minTier <= base.tier &&
                   affix.maxTier >= base.tier;
        });
        const validSuffixes = Object.entries(itemAffixes.suffixes).filter(([id, affix]) => {
            return (affix.slots.includes('all') || affix.slots.includes(base.slot)) &&
                   affix.minTier <= base.tier &&
                   affix.maxTier >= base.tier;
        });
        
        if (validPrefixes.length > 0) {
            const [prefixId, prefix] = validPrefixes[Math.floor(Math.random() * validPrefixes.length)];
            item.affixes.push({ id: prefixId, ...prefix, isPrefix: true });
        }
        if (validSuffixes.length > 0) {
            const [suffixId, suffix] = validSuffixes[Math.floor(Math.random() * validSuffixes.length)];
            item.affixes.push({ id: suffixId, ...suffix, isPrefix: false });
        }
    }
    
    // Apply affix stats and properties
    item.affixes.forEach(affix => {
        // Add stats
        for (const [stat, value] of Object.entries(affix.stats)) {
            item.stats[stat] = (item.stats[stat] || 0) + value;
        }
        // Add properties
        item.properties.push(...affix.properties);
    });
    
    // Generate name
    const prefixName = item.affixes.find(a => a.isPrefix)?.name;
    const suffixName = item.affixes.find(a => !a.isPrefix)?.name;
    
    if (prefixName && suffixName) {
        item.name = `${prefixName} ${base.baseName} ${suffixName}`;
    } else if (prefixName) {
        item.name = `${prefixName} ${base.baseName}`;
    } else if (suffixName) {
        item.name = `${base.baseName} ${suffixName}`;
    } else {
        item.name = base.baseName;
        item.rarity = 'common'; // No affixes = common
    }
    
    // Generate description
    item.description = `Tier ${item.tier} ${item.name}`;
    if (item.properties.length > 0) {
        item.description += '\n' + item.properties.map(p => p.display).join(', ');
    }
    
    return item;
}

// ===== LOOT POOLS =====

const lootPools = {
    // Tier-based pools for generated items
    tier0: Object.keys(baseItems).filter(id => baseItems[id].tier === 0),
    tier1: Object.keys(baseItems).filter(id => baseItems[id].tier === 1),
    tier2: Object.keys(baseItems).filter(id => baseItems[id].tier === 2),
    tier3: Object.keys(baseItems).filter(id => baseItems[id].tier === 3),
    tier4: Object.keys(baseItems).filter(id => baseItems[id].tier === 4),
    tier5: Object.keys(baseItems).filter(id => baseItems[id].tier === 5),
    
    // Fixed item pools
    set: Object.keys(setItems),
    unique: Object.keys(uniqueItems),
    consumables: Object.keys(consumableItems),
    spells: Object.keys(spellScrolls)
};

// ===== HELPER FUNCTIONS =====

function rollLoot(tierWeights) {
    const stats = calculateStats ? calculateStats() : { luck: 0 };
    const luckBonus = stats.luck * 0.01;
    
    // Adjust weights based on luck (favor higher tiers)
    const modifiedWeights = {};
    for (const [tier, weight] of Object.entries(tierWeights)) {
        if (tier.includes('tier') || tier === 'rare' || tier === 'unique' || tier === 'set' || tier === 'spells') {
            modifiedWeights[tier] = weight + (luckBonus * 0.5); // Luck helps!
        } else {
            modifiedWeights[tier] = weight;
        }
    }
    
    const roll = Math.random();
    let cumulative = 0;
    
    for (const [tier, weight] of Object.entries(modifiedWeights)) {
        cumulative += weight;
        if (roll < cumulative) {
            // Handle tier-based generation
            if (tier.startsWith('tier')) {
                const pool = lootPools[tier];
                if (pool && pool.length > 0) {
                    const baseId = pool[Math.floor(Math.random() * pool.length)];
                    
                    // Decide rarity based on luck
                    const rarityRoll = Math.random() + (luckBonus * 0.3);
                    let rarity = 'common';
                    if (rarityRoll > 0.95) rarity = 'rare';
                    else if (rarityRoll > 0.75) rarity = 'magic';
                    
                    const generated = generateMagicItem(baseId, rarity);
                    if (generated) {
                        itemDatabase[generated.id] = generated;
                        return generated.id;
                    }
                }
            } else {
                // Handle fixed pools (sets, uniques, consumables, spells)
                const pool = lootPools[tier];
                if (pool && pool.length > 0) {
                    return pool[Math.floor(Math.random() * pool.length)];
                }
            }
        }
    }
    
    return null;
}

function calculateSetBonuses() {
    if (!gameState || !gameState.equipment) return [];
    
    const equippedSets = {};
    
    // Count pieces of each set
    Object.values(gameState.equipment).forEach(itemId => {
        if (itemId && itemDatabase[itemId]) {
            const item = itemDatabase[itemId];
            if (item.setId) {
                equippedSets[item.setId] = (equippedSets[item.setId] || 0) + 1;
            }
        }
    });
    
    const activeSetBonuses = [];
    
    // Check which bonuses are active
    Object.entries(equippedSets).forEach(([setId, count]) => {
        const set = itemSets[setId];
        if (set) {
            Object.entries(set.bonuses).forEach(([threshold, bonus]) => {
                if (count >= parseInt(threshold)) {
                    activeSetBonuses.push({
                        setName: set.name,
                        pieces: count,
                        threshold: threshold,
                        bonus: bonus
                    });
                }
            });
        }
    });
    
    return activeSetBonuses;
}

console.log('=== EQUIPMENT.JS LOADED ===');
console.log(`Loaded ${Object.keys(itemDatabase).length} items`);
console.log(`Loaded ${Object.keys(baseItems).length} base items`);
console.log(`Loaded ${Object.keys(itemAffixes.prefixes).length} prefixes, ${Object.keys(itemAffixes.suffixes).length} suffixes`);
console.log(`Loaded ${Object.keys(itemSets).length} item sets`);
console.log(`Loaded ${Object.keys(uniqueItems).length} unique items`);