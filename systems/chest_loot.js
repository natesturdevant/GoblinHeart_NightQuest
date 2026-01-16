// ===== DIABLO-STYLE LOOT DROP SYSTEM =====
console.log('=== CHEST_LOOT.JS IS LOADING ===');

/**
 * Roll loot for special chests - Diablo style!
 * Use format: chest_drop_loot:quality:rolls
 * @param {string} dropType - 'common', 'magic', 'rare', 'boss'
 * @param {number} rolls - How many items to roll
 * @returns {Array} - Array of item IDs
 */
function rollChestLoot(dropType = 'common', rolls = 1) {
    const items = [];
    
    const dropTables = {
        'common': {
            tier0: 0.4,
            tier1: 0.3,
            tier2: 0.2,
            tier3: 0.1,
            consumables: 0.3,
            spells: 0.1
        },
        'magic': {
            tier1: 0.3,
            tier2: 0.3,
            tier3: 0.2,
            tier4: 0.1,
            consumables: 0.2,
            spells: 0.2,
            set: 0.05
        },
        'rare': {
            tier2: 0.2,
            tier3: 0.3,
            tier4: 0.3,
            set: 0.15,
            unique: 0.05,
            spells: 0.2
        },
        'boss': {
            tier3: 0.2,
            tier4: 0.3,
            set: 0.25,
            unique: 0.15,
            spells: 0.1
        }
    };
    
    // Rarity weights for magic find
    const rarityWeights = {
        'common': { common: 0.6, magic: 0.3, rare: 0.08, set: 0.015, unique: 0.005 },
        'magic': { common: 0.3, magic: 0.4, rare: 0.2, set: 0.07, unique: 0.03 },
        'rare': { common: 0.1, magic: 0.3, rare: 0.35, set: 0.15, unique: 0.1 },
        'boss': { common: 0.05, magic: 0.15, rare: 0.3, set: 0.25, unique: 0.25 }
    };
    
    const tierWeights = dropTables[dropType] || dropTables['common'];
    const rarityTable = rarityWeights[dropType] || rarityWeights['common'];
    
    for (let i = 0; i < rolls; i++) {
        const itemId = rollLoot(tierWeights);
        
        if (itemId) {
            // Check if it's a base item that can be upgraded
            const baseItem = itemDatabase[itemId];
            
            if (baseItem && baseItem.canEquip && baseItem.tier !== undefined) {
                // Roll for rarity upgrade!
                const rarityRoll = Math.random();
                let rolledRarity = 'common';
                let cumulative = 0;
                
                for (const [rarity, chance] of Object.entries(rarityTable)) {
                    cumulative += chance;
                    if (rarityRoll < cumulative) {
                        rolledRarity = rarity;
                        break;
                    }
                }
                
                // Generate magic item if we rolled above common
                if (rolledRarity !== 'common') {
                    const magicItem = generateMagicItem(itemId, rolledRarity);
                    if (magicItem) {
                        itemDatabase[magicItem.id] = magicItem;
                        items.push(magicItem.id);
                        continue; // Skip to next roll
                    }
                }
            }
            
            // No upgrade, add base item
            items.push(itemId);
        }
    }
    
    return items;
}

console.log('=== CHEST_LOOT.JS LOADED ===');