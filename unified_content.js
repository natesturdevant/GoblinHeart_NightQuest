console.log('=== UNIFIED_CONTENT.JS LOADING ===');

const UNIFIED_TAPE_IDS = ['robocop', 'tron', 'thing', 'rocky4', 'karate_kid'];
const UNIFIED_TAPE_ITEM_IDS = UNIFIED_TAPE_IDS.map(id => `rental_${id}`);

const UNIFIED_CONTENT = {
  mythsByTape: {
    robocop: 'law_body',
    rocky4: 'suffering_redeems',
    karate_kid: 'discipline_restraint',
    tron: 'world_within',
    thing: 'doubt_identity'
  },

  actors: {
    chrissy_video_clerk: {
      name: 'Chrissy',

      firstMeet: [
        'Oh. Hey.',
        'You looking for something, or just killing time?',
        '...You from around here?',
        "Figures. Mansfield's not that big.",
        'You can rent whatever. Just bring it back eventually.'
      ],

      tutorial: [
        'Sometimes you have to talk to people more than once.',
        'Not everything comes out the first time.'
      ],

      carryingTape: {
        default: [
          'Let me know what you think of that one.'
        ],
        tron: [
          'Tron, huh.',
          'A whole world inside a machine.',
          'Let me know what you think.'
        ],
        robocop: [
          'RoboCop is a good pick.',
          'Come back when you finish it.'
        ],
        thing: [
          'You picked The Thing?',
          'Bold choice.'
        ],
        rocky4: [
          'Rocky IV.',
          'That one really commits to the bit.'
        ],
        karate_kid: [
          'Karate Kid.',
          'That one has a good heart.'
        ]
      },

      reactions: {
        watched_tron: [
          'Tron, huh.',
          'A whole world inside something smaller than you.',
          'Makes you wonder what else works like that.'
        ],
        watched_robocop: [
          'RoboCop.',
          'They rebuilt him for a purpose.',
          'But something of him came back anyway.'
        ],
        watched_thing: [
          'The Thing.',
          "It's not the monster that's scary.",
          "It's not knowing who's still themselves."
        ],
        watched_rocky4: [
          'Rocky IV.',
          'He fights like it matters to everyone.',
          "I think that's why people believe it."
        ],
        watched_karate_kid: [
          "That one's gentler than people remember.",
          "People think it's about fighting.",
          "It isn't."
        ],
        found_magic_vhs: [
          'No label?',
          "...That's strange.",
          'Take it home.'
        ]
      },

      phaseLines: {
        0: [
          'It gets pretty quiet in here at night.',
          'Everybody in Mansfield says they are getting out.',
          "Funny thing is, they mostly don't."
        ],
        1: [
          'Oh. You came back.',
          "That's always interesting."
        ],
        2: [
          'You are getting through them pretty fast.',
          '...That is good.'
        ],
        3: [
          'I had a dream about this place.',
          'Same store. Just... arranged differently.',
          'Like I knew where everything was supposed to go.'
        ]
      },

      repeat: [
        'Take your time.',
        'They are not going anywhere.',
        '...Probably.',
        'You do not have to pick the right one.',
        'Just pick one.'
      ],

      rare: [
        'Movies used to feel like they expected something from you.',
        'You ever feel like you have already seen something...',
        '...but you are watching it anyway?',
        'Some stories stick around longer than they should.'
      ]
    }
  },

  looks: {
    Video_Store: {
      default: [
        'Midnight Video. Fluorescent buzz.',
        'Rows of VHS tapes.',
        'The place feels smaller once you know it.'
      ],
      empty: [
        'The lights are still on.',
        "No one's here.",
        'The place feels... paused.'
      ]
    }
  }
};

function unifiedGetGameState() {
  if (typeof gameState !== 'undefined') return gameState;
  if (typeof window !== 'undefined' && window.gameState) return window.gameState;
  return null;
}

function unifiedEnsureStoryState() {
  const state = unifiedGetGameState();
  if (!state) return null;
  if (!state.flags) state.flags = {};
  if (!state.storyState) {
    state.storyState = {
      videoPhase: 0,
      storeState: 'normal',
      currentRental: null,
      watchedTapes: [],
      myths: [],
      pendingReactions: [],
      heard: {},
      foundMagicVhs: false,
      chrissyVanished: false
    };
  }
  if (!Array.isArray(state.storyState.pendingReactions)) state.storyState.pendingReactions = [];
  if (!Array.isArray(state.storyState.watchedTapes)) state.storyState.watchedTapes = [];
  if (!Array.isArray(state.storyState.myths)) state.storyState.myths = [];
  if (!state.storyState.heard) state.storyState.heard = {};

  unifiedSyncCurrentRental();
  unifiedSyncFromLegacyFlags();

  return state.storyState;
}

function unifiedSyncFromLegacyFlags() {
  const state = unifiedGetGameState();
  const story = state?.storyState;
  if (!state || !story || !state.flags) return;

  const watched = [];
  for (const tapeId of UNIFIED_TAPE_IDS) {
    if (state.flags[`watched_${tapeId}`] && !watched.includes(tapeId)) watched.push(tapeId);
  }
  if (watched.length > story.watchedTapes.length) {
    story.watchedTapes = watched;
  }

  if (state.flags.store_empty) story.storeState = 'empty';
  if (state.flags.found_magic_vhs || state.flags.has_magic_vhs) story.foundMagicVhs = true;
  if (story.watchedTapes.length >= 3 && story.videoPhase < 3) {
    story.videoPhase = 3;
  } else if (story.watchedTapes.length > story.videoPhase) {
    story.videoPhase = story.watchedTapes.length;
  }
}

function unifiedSyncCurrentRental() {
  const state = unifiedGetGameState();
  if (!state?.player?.inventory) return null;
  const rentalItemId = state.player.inventory.find(itemId => itemId && itemId.startsWith('rental_')) || null;
  state.storyState = state.storyState || {};
  state.storyState.currentRental = rentalItemId ? rentalItemId.replace('rental_', '') : null;
  return state.storyState.currentRental;
}

function unifiedQueueReaction(reactionId) {
  const story = unifiedEnsureStoryState();
  if (!story) return;
  if (!story.pendingReactions.includes(reactionId)) {
    story.pendingReactions.push(reactionId);
  }
}

function unifiedConsumeReactionForActor(actor) {
  const story = unifiedEnsureStoryState();
  if (!story) return null;
  for (let i = 0; i < story.pendingReactions.length; i++) {
    const reactionId = story.pendingReactions[i];
    if (actor.reactions?.[reactionId]) {
      story.pendingReactions.splice(i, 1);
      return actor.reactions[reactionId];
    }
  }
  return null;
}

function unifiedMarkHeard(key) {
  const story = unifiedEnsureStoryState();
  if (!story) return;
  story.heard[key] = true;
}

function unifiedHasHeard(key) {
  const story = unifiedEnsureStoryState();
  return Boolean(story?.heard?.[key]);
}

function unifiedAddSpeakerLines(name, lines) {
  if (!Array.isArray(lines) || lines.length === 0) return false;
  lines.forEach((line, idx) => {
    if (!line) return;
    if (idx === 0) {
      addMessage(`<span style="color: ${CGA.MAGENTA};">${name}:</span> "${line}"`);
    } else {
      addMessage(`<span style="color: ${CGA.MAGENTA};">${name}:</span> "${line}"`);
    }
  });
  return true;
}

function unifiedRandom(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function unifiedTryChrissyInteraction(adjacentNPC) {
  const story = unifiedEnsureStoryState();
  if (!story) return false;
  const actor = UNIFIED_CONTENT.actors.chrissy_video_clerk;

  const reactionLines = unifiedConsumeReactionForActor(actor);
  if (reactionLines) {
    return unifiedAddSpeakerLines(actor.name, reactionLines);
  }

  if (!unifiedHasHeard('chrissy_first_meet')) {
    unifiedMarkHeard('chrissy_first_meet');
    const state = unifiedGetGameState();
    if (state?.flags) state.flags.met_chrissy = true;
    return unifiedAddSpeakerLines(actor.name, actor.firstMeet);
  }

  if (!unifiedHasHeard('chrissy_tutorial')) {
    unifiedMarkHeard('chrissy_tutorial');
    return unifiedAddSpeakerLines(actor.name, actor.tutorial);
  }

  const currentRental = unifiedSyncCurrentRental();
  if (currentRental) {
    const lines = actor.carryingTape[currentRental] || actor.carryingTape.default;
    return unifiedAddSpeakerLines(actor.name, lines);
  }

  const phase = story.videoPhase || 0;
  const phaseKey = `chrissy_phase_${phase}`;
  if (actor.phaseLines[phase] && !unifiedHasHeard(phaseKey)) {
    unifiedMarkHeard(phaseKey);
    return unifiedAddSpeakerLines(actor.name, actor.phaseLines[phase]);
  }

  const rareKey = `chrissy_rare_${phase}`;
  if (phase >= 2 && !unifiedHasHeard(rareKey)) {
    unifiedMarkHeard(rareKey);
    return unifiedAddSpeakerLines(actor.name, [unifiedRandom(actor.rare)]);
  }

  return unifiedAddSpeakerLines(actor.name, [unifiedRandom(actor.repeat)]);
}

function unifiedHandleNPCInteraction(adjacentNPC) {
  if (!adjacentNPC?.type) return false;
  unifiedEnsureStoryState();
  if (adjacentNPC.type === 'chrissy_video_clerk') {
    return unifiedTryChrissyInteraction(adjacentNPC);
  }
  return false;
}

function unifiedCheckStoryRules() {
  const state = unifiedGetGameState();
  const story = unifiedEnsureStoryState();
  if (!state || !story) return;

  if (story.watchedTapes.length >= 3 && story.storeState !== 'empty' && !state.flags.vhsAppeared) {
    story.videoPhase = 3;
  }

  if (state.flags.vhsAppeared) {
    story.storeState = 'empty';
    if (!story.chrissyVanished) {
      story.chrissyVanished = true;
      state.flags.store_empty = true;
    }
  }
}

function unifiedGetStoryLook(mapId) {
  const story = unifiedEnsureStoryState();
  if (!story) return null;
  if (mapId === 'Video_Store') {
    const look = story.storeState === 'empty' ? UNIFIED_CONTENT.looks.Video_Store.empty : null;
    if (look) return look.join('\n');
  }
  return null;
}

function unifiedOnTapeWatched(tapeId) {
  const state = unifiedGetGameState();
  const story = unifiedEnsureStoryState();
  if (!state || !story) return;

  const messageColor = CGA.CYAN;
  if (!story.watchedTapes.includes(tapeId)) {
    story.watchedTapes.push(tapeId);
  }

  const mythId = UNIFIED_CONTENT.mythsByTape[tapeId];
  if (mythId && !story.myths.includes(mythId)) {
    story.myths.push(mythId);
  }

  story.currentRental = null;
  story.videoPhase = Math.max(story.videoPhase || 0, Math.min(story.watchedTapes.length, 3));
  unifiedQueueReaction(`watched_${tapeId}`);
  addMessage('Something about it stays with you.', messageColor);
}

function unifiedOnItemReceived(itemId, context = {}) {
  const state = unifiedGetGameState();
  const story = unifiedEnsureStoryState();
  if (!state || !story) return;

  if (itemId === 'magic_vhs') {
    story.foundMagicVhs = true;
    story.storeState = 'empty';
    state.flags.found_magic_vhs = true;
    state.flags.has_magic_vhs = true;
    unifiedQueueReaction('found_magic_vhs');
    if (context.source === 'search') {
      addMessage('The tape is strangely warm.', CGA.CYAN);
    }
  }
}

function unifiedCanTriggerMagicVhs(state) {
  const story = unifiedEnsureStoryState();
  if (!story || !state?.flags) return false;
  return story.watchedTapes.length >= 3 &&
    !state.flags.vhsAppeared &&
    state.currentMap === 'Video_Store';
}

function unifiedCanTriggerIncident(state) {
  const story = unifiedEnsureStoryState();
  if (!story || !state?.flags) return false;
  return Boolean(state.flags.watched_magic_vhs) && !state.flags.the_incident_completed;
}

function unifiedOnMagicVhsUsed() {
  const state = unifiedGetGameState();
  const story = unifiedEnsureStoryState();
  if (!state || !story) return false;

  addMessage('The TV turns on before you touch it.', CGA.CYAN);
  addMessage('Static.', CGA.LIGHTGRAY);
  addMessage('A shape in the noise.', CGA.LIGHTGRAY);
  addMessage('A voice you almost recognize—', CGA.WHITE);
  state.flags.watched_magic_vhs = true;

  if (typeof startWormholeEffect === 'function') {
    startWormholeEffect(() => {
      addMessage('===================');
      addMessage('Where... am I?', CGA.WHITE);
      addMessage('===================');

      addJournalEntry('The Incident', [
        { type: 'text', content: 'One moment I was in Mansfield. The next...' },
        { type: 'text', content: 'A swirling vortex of color and madness.' },
        { type: 'text', content: "Now I'm... somewhere else." }
      ]);

      loadMap('Forest');
      state.player.x = 1;
      state.player.y = 2;
      state.flags.the_incident_completed = true;
      state.flags.in_other_world = true;
      renderWorld();
      updateStatus();
    });
  }

  return true;
}

const _legacyGetStoryNPC = typeof getStoryNPC === 'function' ? getStoryNPC : null;
const _legacyGetStoryLook = typeof getStoryLook === 'function' ? getStoryLook : null;
const _legacyCheckStoryRules = typeof checkStoryRules === 'function' ? checkStoryRules : null;

getStoryNPC = function(npcId) {
  if (npcId === 'chrissy_video_clerk') return null;
  return _legacyGetStoryNPC ? _legacyGetStoryNPC(npcId) : null;
};

getStoryLook = function(mapId) {
  const unified = unifiedGetStoryLook(mapId);
  if (unified) return unified;
  return _legacyGetStoryLook ? _legacyGetStoryLook(mapId) : null;
};

checkStoryRules = function() {
  unifiedCheckStoryRules();
};

console.log('=== UNIFIED_CONTENT.JS LOADED ===');
