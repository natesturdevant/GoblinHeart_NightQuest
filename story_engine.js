
/**
 * story_engine.js
 * Unified Story System: Dialogues + World Events + Hooks
 * 
 * Drop this in after data.js and before game.js.
 * Wire-in with 1-5 tiny calls in game.js (shown below).
 * 
 * Design goals:
 * - One declarative format for NPC talk and world events ("scenes" and "triggers")
 * - Conditions are consistent (flags, day, map, inventory, tile, etc.)
 * - Actions are consistent (say, setFlag, giveItem, moveMap, journal, openShop, etc.)
 * - Hooks let you run triggers at lifecycle moments (onMove, onEnterMap, beforeRest, afterRest, onDayStart, onInteract)
 * - Minimal adapter: uses your existing functions like addMessage, addJournalEntry, loadMap, openShop, etc.
 *
 * How to wire (minimal changes in game.js):
 *   1) After each player move:
 *        Story.runHooks('onMove', gameState);
 *      And after changing maps:
 *        Story.runHooks('onEnterMap', gameState);
 *   2) In your rest() flow right before/after sleep:
 *        if (Story.runHooks('beforeRest', gameState)) return; // cancel rest if a hook wants to
 *        ... do sleep ...
 *        Story.runHooks('afterRest', gameState);
 *   3) When a new day starts:
 *        Story.runHooks('onDayStart', gameState);
 *   4) When interacting with an NPC (instead of getDialogue(...)):
 *        if (Story.startScene(adjacentNPC.type, gameState)) return; // returns true if a scene handled it
 *        // otherwise fall back to legacy getDialogue if desired
 *   5) (Optional) When pressing an "Action" key on a tile:
 *        Story.runHooks('onInteract', gameState);
 */

const Story = (() => {
  const registry = {
    scenes: {},   // sceneId -> scene
    triggers: []  // [{ id, when, once, condition, actions|scene }]
  };

  // ------------- Condition evaluation ----------------
  function hasItem(gs, itemId) {
    return Array.isArray(gs.player?.inventory) && gs.player.inventory.includes(itemId);
  }

  function getTileUnderPlayer(gs) {
    const y = gs.player.y, x = gs.player.x;
    return gs.world?.tiles?.[y]?.[x];
  }

  function evalSimple(gs, c) {
    if (!c) return true;

    // Map/location
    if (c.map && gs.currentMap !== c.map) return false;

    // Day logic
    if (typeof c.dayGTE === 'number' && !(gs.dayCounter >= c.dayGTE)) return false;
    if (typeof c.dayLTE === 'number' && !(gs.dayCounter <= c.dayLTE)) return false;

    // Flag equals / not equals
    if (c.flagEq && Object.keys(c.flagEq).length) {
      for (const [k, v] of Object.entries(c.flagEq)) {
        if (gs.flags?.[k] !== v) return false;
      }
    }
    if (c.flagNe && Object.keys(c.flagNe).length) {
      for (const [k, v] of Object.entries(c.flagNe)) {
        if (gs.flags?.[k] === v) return false;
      }
    }

    // Inventory includes
    if (c.inventoryHas && !hasItem(gs, c.inventoryHas)) return false;

    // Tile under player
    if (c.tileIs && getTileUnderPlayer(gs) !== c.tileIs) return false;

    return true;
  }

  function evalCond(gs, cond) {
    if (!cond) return true;
    if (cond.all) return cond.all.every(cc => evalCond(gs, cc));
    if (cond.any) return cond.any.some(cc => evalCond(gs, cc));
    if (cond.not) return !evalCond(gs, cond.not);
    return evalSimple(gs, cond);
  }

  // ------------- Action executor ---------------------
  // Supported actions (extend as needed):
  // - say:         { type:'say', speaker:'Eddie', text:'...' }
  // - setFlag:     { type:'setFlag', key:'vhsAppeared', value:true }
  // - giveItem:    { type:'giveItem', item:'magic_vhs' }
  // - takeItem:    { type:'takeItem', item:'magic_vhs' }
  // - journal:     { type:'journal', title:'...', blocks:[ {type:'text', text:'...'} ] }
  // - moveMap:     { type:'moveMap', map:'Dungeon1', x:10, y:7 }
  // - openShop:    { type:'openShop', id:'eddie_video_clerk' }
  // - delay:       { type:'delay', ms:1500 }   // returns a Promise, lets you chain cinematic beats
  // - scene:       { type:'scene', id:'sceneId' } // jump to another scene
  // - run:         { type:'run', fn:(gs)=>{ ... } } // escape hatch
  async function runAction(gs, action) {
    switch (action.type) {
      case 'say': {
        const speaker = action.speaker ? `${action.speaker}: ` : '';
        if (typeof addMessage === 'function') addMessage(`${speaker}${action.text}`);
        return;
      }
      case 'setFlag': {
        gs.flags = gs.flags || {};
        gs.flags[action.key] = action.value;
        return;
      }
      case 'giveItem': {
        gs.player = gs.player || {};
        gs.player.inventory = gs.player.inventory || [];
        if (!gs.player.inventory.includes(action.item)) gs.player.inventory.push(action.item);
        if (typeof addMessage === 'function') addMessage(`You obtained ${action.item}.`);
        return;
      }
      case 'takeItem': {
        const inv = gs.player?.inventory;
        if (Array.isArray(inv)) {
          const i = inv.indexOf(action.item);
          if (i >= 0) inv.splice(i, 1);
        }
        return;
      }
      case 'journal': {
        if (typeof addJournalEntry === 'function') addJournalEntry(action.title, action.blocks || []);
        return;
      }
      case 'moveMap': {
        if (typeof loadMap === 'function') {
          loadMap(action.map);
          if (gs.player) {
            gs.player.x = action.x ?? gs.player.x;
            gs.player.y = action.y ?? gs.player.y;
          }
          if (typeof renderWorld === 'function') renderWorld();
          if (typeof updateExploration === 'function') updateExploration();
          if (typeof updateStatus === 'function') updateStatus();
        }
        return;
      }
      case 'openShop': {
        if (typeof openShop === 'function') openShop(action.id);
        return;
      }
      case 'delay': {
        await new Promise(r => setTimeout(r, action.ms ?? 0));
        return;
      }
      case 'scene': {
        await startScene(action.id, gs);
        return;
      }
      case 'run': {
        if (typeof action.fn === 'function') action.fn(gs);
        return;
      }
      default:
        console.warn('Unknown action:', action);
        return;
    }
  }

  async function runActions(gs, actions=[]) {
    for (const a of actions) {
      // allow conditional per-action
      if (a.if && !evalCond(gs, a.if)) continue;
      await runAction(gs, a);
    }
  }

  // ------------- Scenes (for dialogue & cinematics) --
  // Scene:
  // { id, when?:'onInteract'|'onTalk', condition?, once?, steps:[ actions... ] }
  async function startScene(sceneId, gs) {
    const scene = registry.scenes[sceneId];
    if (!scene) return false;
    if (scene.condition && !evalCond(gs, scene.condition)) return false;
    if (scene.once && gs.flags?.[`_scene_${sceneId}_played`]) return false;

    await runActions(gs, scene.steps || []);

    if (scene.once) {
      gs.flags = gs.flags || {};
      gs.flags[`_scene_${sceneId}_played`] = true;
    }
    return true;
  }

  // ------------- Triggers (world events) -------------
  // Trigger:
  // { id, when:'onMove'|'onEnterMap'|'beforeRest'|'afterRest'|'onDayStart'|'onInteract',
  //   once?:true, condition:{...}, actions?:[], scene?:'sceneId' }
  function runHooks(when, gs) {
    let cancelled = false;

    for (const t of registry.triggers) {
      if (t.when !== when) continue;

      if (t.once && gs.flags?.[`_trigger_${t.id}_done`]) continue;
      if (!evalCond(gs, t.condition)) continue;

      // beforeRest hook can cancel if it moves the player, etc.
      const maybeCancel = () => {
        if (when === 'beforeRest' && gs.flags?.transported) {
          cancelled = true;
        }
      };

      if (t.actions && t.actions.length) {
        // If there is a delay() in actions, we want to block further triggers;
        // keep it simple for now: run synchronously; game content can call delay() if it wants pacing.
        (async () => {
          await runActions(gs, t.actions);
          gs.flags = gs.flags || {};
          if (t.once) gs.flags[`_trigger_${t.id}_done`] = true;
          maybeCancel();
        })();
      } else if (t.scene) {
        (async () => {
          await startScene(t.scene, gs);
          gs.flags = gs.flags || {};
          if (t.once) gs.flags[`_trigger_${t.id}_done`] = true;
          maybeCancel();
        })();
      }
    }

    return cancelled;
  }

  // ------------- Registration API --------------------
  function register(content) {
    if (!content) return;
    if (content.scenes) {
      for (const sc of content.scenes) {
        if (!sc.id) {
          console.warn('Skipping scene without id', sc);
          continue;
        }
        registry.scenes[sc.id] = sc;
      }
    }
    if (Array.isArray(content.triggers)) {
      registry.triggers.push(...content.triggers);
    }
    console.log(`[Story] Registered ${Object.keys(registry.scenes).length} scenes, ${registry.triggers.length} triggers`);
  }

  // Optional helper: map existing NPC ids to scenes automatically
  function tryStartNpcScene(npcType, gs) {
    // prefer scene with same id as npcType
    return startScene(npcType, gs);
  }

  // Expose public API
  return {
    register, startScene, tryStartNpcScene, runHooks,
    _evalCond: evalCond, _runActions: runActions, _registry: registry
  };
})();
