console.log('=== NARRATIVE.JS LOADING ===');

const STORY_TAPES = ['robocop', 'tron', 'thing', 'rocky4', 'karate_kid'];
const STORY_TAPE_ITEMS = STORY_TAPES.map(id => `rental_${id}`);
const STORY_MYTHS = {
  robocop: 'law_body',
  rocky4: 'suffering_redeems',
  karate_kid: 'discipline_restraint',
  tron: 'world_within',
  thing: 'doubt_identity'
};

const NARRATIVE_ITEM_RULES = {
    rental_robocop: {
        tags: ['rental'],
        maxCarryTag: 'rental',
        blockMessage: "You've already got a tape to watch."
    },

    rental_tron: {
        tags: ['rental'],
        maxCarryTag: 'rental',
        blockMessage: "You've already got a tape to watch."
    },

    rental_karate_kid: {
        tags: ['rental'],
        maxCarryTag: 'rental',
        blockMessage: "You've already got a tape to watch."
    }
};

const STORY_HOME_MAPS = new Set(['Overworld']);

function getNarrativeItemRule(itemId) {
    return NARRATIVE_ITEM_RULES[itemId] || null;
}

function hasNarrativeItemWithTag(tag) {
    const inventory = gameState?.player?.inventory || [];

    return inventory.some(itemId => {
        const rule = getNarrativeItemRule(itemId);
        return rule?.tags?.includes(tag);
    });
}

function narrativeCanReceiveItem(itemId, context = {}) {
    const rule = getNarrativeItemRule(itemId);
    if (!rule) return { allowed: true };

    if (rule.maxCarryTag && hasNarrativeItemWithTag(rule.maxCarryTag)) {
        return {
            allowed: false,
            message: rule.blockMessage || "You can't carry another one right now."
        };
    }

    if (typeof rule.canReceive === 'function') {
        return rule.canReceive(context);
    }

    return { allowed: true };
}

function storySetFlag(flag) {
  if (!gameState.flags) gameState.flags = {};
  gameState.flags[flag] = true;
}

function storyClearFlag(flag) {
  if (gameState.flags) delete gameState.flags[flag];
}

function storyHasFlag(flag) {
  return Boolean(gameState.flags?.[flag]);
}

function storyConditionMet(when = {}) {
  if (when.flags) {
    for (const flag of when.flags) {
      if (!storyHasFlag(flag)) return false;
    }
  }

  if (when.notFlags) {
    for (const flag of when.notFlags) {
      if (storyHasFlag(flag)) return false;
    }
  }

  if (when.myths) {
    const s = getStoryState();
    for (const myth of when.myths) {
      if (!s.myths.includes(myth)) return false;
    }
  }

  if (when.watchedTapes) {
    const s = getStoryState();
    for (const tape of when.watchedTapes) {
      if (!s.watchedTapes.includes(tape)) return false;
    }
  }

  return true;
}

function storyResolveConditional(actorId, actor) {
  if (!actor.conditional) return null;

  for (const entry of actor.conditional) {
    const heardKey = `${actorId}.conditional.${entry.id}`;

    if (entry.once !== false && storyHeard(heardKey)) {
      continue;
    }

    if (storyConditionMet(entry.when)) {
      if (entry.once !== false) storyMarkHeard(heardKey);
      return entry.say;
    }
  }

  return null;
}

function narrativeIsAtHomeTv() {
  if (typeof gameState === 'undefined') return false;
  return STORY_HOME_MAPS.has(gameState.currentMap);
}

function narrativeCanWatchTape(showMessage = false) {
  const ok = narrativeIsAtHomeTv();
  if (!ok && showMessage) {
    sayKey('item.watch.blocked.home.1', CGA.YELLOW);
    sayKey('item.watch.blocked.home.2', CGA.DARKGRAY);
  }
  return ok;
}

const STORY_ACTORS = {
  chrissy_video_clerk: {
    nameKey: 'actor.chrissy.name',
    sprite: 'villager_worker',
    first: ['chrissy.first.1','chrissy.first.2','chrissy.first.3','chrissy.first.4','chrissy.first.5'],
    tutorial: ['chrissy.tutorial.1','chrissy.tutorial.2'],
    carrying: {
      default: ['chrissy.carrying.default.1'],
      tron: ['chrissy.carrying.tron.1','chrissy.carrying.tron.2','chrissy.carrying.tron.3'],
      robocop: ['chrissy.carrying.robocop.1','chrissy.carrying.robocop.2'],
      thing: ['chrissy.carrying.thing.1','chrissy.carrying.thing.2'],
      rocky4: ['chrissy.carrying.rocky4.1','chrissy.carrying.rocky4.2'],
      karate_kid: ['chrissy.carrying.karate_kid.1','chrissy.carrying.karate_kid.2']
    },
	
	conditional: [
	{
    id: 'noticed_island3_muck',
    when: { flags: ['visited_island3'] },
    say: ['chrissy.conditional.island3_muck.1'],
    once: true
	}
	],
	
    reactions: {
      watched_tron: ['chrissy.reaction.watched_tron.1','chrissy.reaction.watched_tron.2','chrissy.reaction.watched_tron.3'],
      watched_robocop: ['chrissy.reaction.watched_robocop.1','chrissy.reaction.watched_robocop.2','chrissy.reaction.watched_robocop.3'],
      watched_thing: ['chrissy.reaction.watched_thing.1','chrissy.reaction.watched_thing.2','chrissy.reaction.watched_thing.3'],
      watched_rocky4: ['chrissy.reaction.watched_rocky4.1','chrissy.reaction.watched_rocky4.2','chrissy.reaction.watched_rocky4.3'],
      watched_karate_kid: ['chrissy.reaction.watched_karate_kid.1','chrissy.reaction.watched_karate_kid.2','chrissy.reaction.watched_karate_kid.3'],
      found_magic_vhs: ['chrissy.reaction.found_magic_vhs.1','chrissy.reaction.found_magic_vhs.2','chrissy.reaction.found_magic_vhs.3']
    },
    phases: {
      0: ['chrissy.phase.0.1','chrissy.phase.0.2','chrissy.phase.0.3'],
      1: ['chrissy.phase.1.1','chrissy.phase.1.2'],
      2: ['chrissy.phase.2.1','chrissy.phase.2.2'],
      3: ['chrissy.phase.3.1','chrissy.phase.3.2','chrissy.phase.3.3']
    },
    repeat: ['chrissy.repeat.1','chrissy.repeat.2','chrissy.repeat.3','chrissy.repeat.4','chrissy.repeat.5'],
    rare: ['chrissy.rare.1','chrissy.rare.2','chrissy.rare.3','chrissy.rare.4']
  },
  bartender_npc: {
    nameKey: 'actor.bart.name',
    sprite: 'villager_old',
    first: ['bart.first.1','bart.first.2','bart.first.3'],
    repeat: ['bart.repeat.1']
  },
  eddie_video_clerk: {
    nameKey: 'actor.eddie.name',
    sprite: 'villager_worker',
    first: ['eddie.first.1'],
    reactions: {
      vhs_appeared: ['eddie.vhs.1','eddie.vhs.2','eddie.vhs.3']
    },
    repeat: ['eddie.first.1']
  }
};

const STORY_LOOKS = {
  Video_Store: {
    normal: ['look.video_store.normal.1','look.video_store.normal.2','look.video_store.normal.3'],
    empty: ['look.video_store.empty.1','look.video_store.empty.2','look.video_store.empty.3']
  }
};

function getStoryState() {
  if (typeof gameState === 'undefined') return null;
  if (!gameState.flags) gameState.flags = {};
  if (!gameState.revealedSpecials) gameState.revealedSpecials = {};
  if (!gameState.story) {
    gameState.story = {
      videoPhase: 0,
      storeState: 'normal',
      currentRental: null,
      watchedTapes: [],
      myths: [],
      pendingReactions: [],
      heard: {},
      foundMagicVhs: false,
      introComplete: false,
	  dialogueQueue: []
    };
  }

  const s = gameState.story;

  if (!Array.isArray(s.watchedTapes)) s.watchedTapes = [];
  if (!Array.isArray(s.myths)) s.myths = [];
  if (!Array.isArray(s.pendingReactions)) s.pendingReactions = [];
  if (!s.heard) s.heard = {};

  const inventory = gameState?.player?.inventory || [];
  const rentalItemId = inventory.find(id => id && id.startsWith('rental_')) || null;
  s.currentRental = rentalItemId ? rentalItemId.replace('rental_', '') : null;

  return s;
}

function storySyncRental() {
  const s = gameState?.story || getStoryState();
  if (!s) return null;

  const inventory = gameState?.player?.inventory || [];
  const rentalItemId = inventory.find(id => id && id.startsWith('rental_')) || null;
  s.currentRental = rentalItemId ? rentalItemId.replace('rental_', '') : null;

  return s.currentRental;
}

function storyQueueReaction(id) {
  const s = getStoryState();
  if (!s.pendingReactions.includes(id)) s.pendingReactions.push(id);
}

function storyConsumeReaction(actor) {
  const s = getStoryState();
  for (let i = 0; i < s.pendingReactions.length; i++) {
    const reactionId = s.pendingReactions[i];
    if (actor.reactions?.[reactionId]) {
      s.pendingReactions.splice(i, 1);
      return actor.reactions[reactionId];
    }
  }
  return null;
}

function storyHeard(key) {
  return Boolean(getStoryState()?.heard?.[key]);
}
function storyMarkHeard(key) {
  getStoryState().heard[key] = true;
}

function randomFrom(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function sayKey(key, color = null) {
  addMessage(textGet(key), color);
}

/* function saySpeakerKeys(nameKey, keys) {
  const name = textGet(nameKey);
  textLines(keys).forEach(line => {
    addMessage(`<span style="color: ${CGA.MAGENTA};">${name}:</span> "${line}"`);
  });
  return true;
} */

function saySpeakerKeys(nameKey, keys) {
  const s = getStoryState();
  const name = textGet(nameKey);

  if (!s.dialogueQueue) s.dialogueQueue = [];

  // Start a new queue only if there isn't one already.
  if (s.dialogueQueue.length === 0) {
    const lines = textLines(keys);

    s.dialogueQueue = lines.map(line => ({
      name,
      text: line
    }));
  }

  // Show 1–2 lines per interaction.
  const linesToShow = s.dialogueQueue.splice(0, 1);

  linesToShow.forEach(line => {
    addMessage(
      `<span style="color: ${CGA.MAGENTA};">${line.name}:</span> "${line.text}"`
    );
  });

  return true;
}

function storyResolveActor(actorId) {
  return STORY_ACTORS[actorId] || null;
}


function storyResolveActorInteraction(actorId, actor) {
  const s = getStoryState();
  
  if (s.dialogueQueue && s.dialogueQueue.length > 0) {
    return saySpeakerKeys(actor.nameKey, []);
  }

  // 1. Pending reactions
  const reaction = storyConsumeReaction(actor);
  if (reaction) {
    return saySpeakerKeys(actor.nameKey, reaction);
  }

  // 2. First-time greeting
  if (actor.first && !storyHeard(`${actorId}.first`)) {
    storyMarkHeard(`${actorId}.first`);

    if (actorId === 'chrissy_video_clerk') {
      gameState.flags.met_chrissy = true;
    }

    return saySpeakerKeys(actor.nameKey, actor.first);
  }

  // 3. Tutorial / extra first-time note
  if (actor.tutorial && !storyHeard(`${actorId}.tutorial`)) {
    storyMarkHeard(`${actorId}.tutorial`);
    return saySpeakerKeys(actor.nameKey, actor.tutorial);
  }

  // 4. Carrying-state dialogue, if this actor has it
  const currentRental = storySyncRental();
  if (actor.carrying && currentRental) {
    const keys = actor.carrying[currentRental] || actor.carrying.default;
    if (keys) return saySpeakerKeys(actor.nameKey, keys);
  }
  
  
  // 4.5 Conditionals
  const conditional = storyResolveConditional(actorId, actor);
	if (conditional) {
		return saySpeakerKeys(actor.nameKey, conditional);
	}

  // 5. Phase dialogue, if this actor has it
  const phase = s.videoPhase || 0;
  const phaseKey = `${actorId}.phase.${phase}`;
  if (actor.phases?.[phase] && !storyHeard(phaseKey)) {
    storyMarkHeard(phaseKey);
    return saySpeakerKeys(actor.nameKey, actor.phases[phase]);
  }

  // 6. Rare one-time phase flavor, if this actor has it
  const rareKey = `${actorId}.rare.${phase}`;
  if (actor.rare && phase >= 2 && !storyHeard(rareKey)) {
    storyMarkHeard(rareKey);
    return saySpeakerKeys(actor.nameKey, [randomFrom(actor.rare)]);
  }

  // 7. Repeat fallback
  const fallback = actor.repeat || actor.first;
  if (fallback) {
    return saySpeakerKeys(actor.nameKey, [randomFrom(fallback)]);
  }

  return false;
}


 
 function narrativeHandleNPCInteraction(adjacentNPC) {
  const actorId = adjacentNPC?.type;
  const actor = storyResolveActor(actorId);
  if (!actor) return false;

  return storyResolveActorInteraction(actorId, actor);
}
 
 
function getStoryNPC(_) { return null; }

function getStoryNPCPosition(npcId) {
  const s = getStoryState();
  if (npcId === 'chrissy_video_clerk' && s.storeState === 'empty') {
    return { map: null };
  }
  return null;
}

function getNPCData(npcId) {
  const actor = storyResolveActor(npcId);
  if (actor) {
    return {
      name: textGet(actor.nameKey),
      sprite: actor.sprite,
      isShopkeeper: false
    };
  }
  return npcDatabase[npcId] || null;
}

function getDialogue(npcId, state) {
  const actor = storyResolveActor(npcId);
  if (actor) {
    return { text: textGet(randomFrom(actor.repeat || actor.first)), npcName: textGet(actor.nameKey) };
  }
  const npc = npcDatabase[npcId];
  if (!npc?.dialogue?.length) return { text: '...', npcName: npc?.name || 'Unknown' };
  for (let i = npc.dialogue.length - 1; i >= 0; i--) {
    const line = npc.dialogue[i];
    if (!line.condition || line.condition(state)) {
      return { text: line.text, npcName: npc.name };
    }
  }
  return { text: npc.dialogue[0].text, npcName: npc.name };
}

function getStoryLook(mapId) {
  const s = getStoryState();
  if (mapId === 'Video_Store') {
    const key = s.storeState === 'empty' ? 'empty' : 'normal';
    return textLines(STORY_LOOKS.Video_Store[key]).join('\n');
  }
  return null;
}

function checkStoryRules() {
  const s = getStoryState();
  storySyncRental();
  s.videoPhase = Math.min(s.watchedTapes.length, 3);
  if (gameState.flags.vhsAppeared) {
    s.storeState = 'empty';
  }
}

function storyRemoveNpcFromCurrentMap(npcType) {
  if (!Array.isArray(gameState?.npcs)) return;
  gameState.npcs = gameState.npcs.filter(npc => npc.type !== npcType);
}

function narrativeRefreshWorldState() {
  const s = getStoryState();
  if (s.storeState === 'empty') {
    storyRemoveNpcFromCurrentMap('chrissy_video_clerk');
  }
}

function narrativeOnMapLoaded() {
  narrativeRefreshWorldState();
}

function storyInjectMagicVhsTile() {
  const mapId = 'Video_Store';
  const key = '8,5';
  if (!specialLocations[mapId]) specialLocations[mapId] = {};
  specialLocations[mapId][key] = {
    message: textGet('event.vhs_appears.1'),
    requiresSearch: true,
    journalEntry: false,
    journalTitle: 'Discovery',
    itemReward: 'magic_vhs'
  };
  if (!treasureContents[mapId]) treasureContents[mapId] = {};
  treasureContents[mapId][key] = { gold: 0, items: ['magic_vhs'] };
  const [x, y] = key.split(',').map(Number);
  const row = gameState.world.tiles[y];
  if (row) {
    gameState.world.tiles[y] = row.substring(0, x) + '$' + row.substring(x + 1);
  }
}

function checkEvents(state) {
  const s = getStoryState();
  if (!state.flags.vhsAppeared && s.watchedTapes.length >= 3 && state.currentMap === 'Video_Store') {
    storyInjectMagicVhsTile();
    state.flags.vhsAppeared = true;
    s.storeState = 'empty';
    storyQueueReaction('vhs_appeared');
    addMessage(textGet('event.vhs_appears.1'), CGA.CYAN);
    narrativeRefreshWorldState();
    renderWorld();
  }
}

function narrativeOnTapeWatched(tapeId) {
  const s = getStoryState();
  if (!s.watchedTapes.includes(tapeId)) s.watchedTapes.push(tapeId);
  const myth = STORY_MYTHS[tapeId];
  if (myth && !s.myths.includes(myth)) s.myths.push(myth);
  s.currentRental = null;
  s.videoPhase = Math.min(s.watchedTapes.length, 3);
  storyQueueReaction(`watched_${tapeId}`);
  sayKey('item.watch.afterglow', CGA.CYAN);
}

function narrativeOnItemReceived(itemId, context = {}) {
  const s = getStoryState();
  if (itemId === 'magic_vhs') {
    s.foundMagicVhs = true;
    gameState.flags.found_magic_vhs = true;
    gameState.flags.has_magic_vhs = true;
    storyQueueReaction('found_magic_vhs');
    if (context.source === 'search') sayKey('item.magic_vhs.search.1', CGA.CYAN);
  }
}

function narrativeOnMagicVhsUsed() {
  const s = getStoryState();
  if (!s) return false;
  ['item.magic_vhs.use.1','item.magic_vhs.use.2','item.magic_vhs.use.3','item.magic_vhs.use.4'].forEach((key, idx) => {
    addMessage(textGet(key), idx === 0 ? CGA.CYAN : (idx === 3 ? CGA.WHITE : CGA.LIGHTGRAY));
  });
  gameState.flags.watched_magic_vhs = true;
  s.introComplete = true;

  if (typeof startWormholeEffect === 'function') {
    startWormholeEffect(() => {
      addMessage('===================');
      addMessage('Where... am I?', CGA.WHITE);
      addMessage('===================');
      addJournalEntry(textGet('journal.incident.title'), [
        { type: 'text', content: textGet('journal.incident.1') },
        { type: 'text', content: textGet('journal.incident.2') },
        { type: 'text', content: textGet('journal.incident.3') }
      ]);
      loadMap('Forest');
      gameState.player.x = 1;
      gameState.player.y = 2;
      gameState.flags.the_incident_completed = true;
      gameState.flags.in_other_world = true;
      renderWorld();
      updateStatus();
    });
    return true;
  }

  sayKey('item.magic_vhs.idle.1', CGA.CYAN);
  return false;
}

// Compatibility aliases so the current engine keeps working while the architecture stays clean.
const unifiedHandleNPCInteraction = narrativeHandleNPCInteraction;
const unifiedOnTapeWatched = narrativeOnTapeWatched;
const unifiedOnItemReceived = narrativeOnItemReceived;
const unifiedOnMagicVhsUsed = narrativeOnMagicVhsUsed;

console.log('=== NARRATIVE.JS LOADED ===');
