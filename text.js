const TEXT = {
  en: {
    'actor.chrissy.name': 'Chrissy',
    'actor.bart.name': 'Bart',
    'actor.eddie.name': 'Eddie',

    'chrissy.first.1': 'Oh. Hey.',
    'chrissy.first.2': 'You looking for something, or just killing time?',
    'chrissy.first.3': '...You from around here?',
    'chrissy.first.4': "Figures. Mansfield's not that big.",
    'chrissy.first.5': 'You can rent whatever. Just bring it back eventually.',

    'chrissy.tutorial.1': 'Sometimes you have to talk to people more than once.',
    'chrissy.tutorial.2': 'Not everything comes out the first time.',

    'chrissy.carrying.default.1': 'Let me know what you think of that one.',
    'chrissy.carrying.tron.1': 'Tron, huh.',
    'chrissy.carrying.tron.2': 'A whole world inside a machine.',
    'chrissy.carrying.tron.3': 'Let me know what you think.',
    'chrissy.carrying.robocop.1': 'RoboCop is a good pick.',
    'chrissy.carrying.robocop.2': 'Come back when you finish it.',
    'chrissy.carrying.thing.1': 'You picked The Thing?',
    'chrissy.carrying.thing.2': 'Bold choice.',
    'chrissy.carrying.rocky4.1': 'Rocky IV.',
    'chrissy.carrying.rocky4.2': 'That one really commits to the bit.',
    'chrissy.carrying.karate_kid.1': 'Karate Kid.',
    'chrissy.carrying.karate_kid.2': 'That one has a good heart.',
	
	'chrissy.conditional.island3_muck.1': "Is that red muck on your shoes? You went to the third island, didn't you.",

    'chrissy.reaction.watched_tron.1': 'Tron, huh.',
    'chrissy.reaction.watched_tron.2': 'A whole world inside something smaller than you.',
    'chrissy.reaction.watched_tron.3': 'Makes you wonder what else works like that.',
    'chrissy.reaction.watched_robocop.1': 'RoboCop.',
    'chrissy.reaction.watched_robocop.2': 'They rebuilt him for a purpose.',
    'chrissy.reaction.watched_robocop.3': 'But something of him came back anyway.',
    'chrissy.reaction.watched_thing.1': 'The Thing.',
    'chrissy.reaction.watched_thing.2': "It's not the monster that's scary.",
    'chrissy.reaction.watched_thing.3': "It's not knowing who's still themselves.",
    'chrissy.reaction.watched_rocky4.1': 'Rocky IV.',
    'chrissy.reaction.watched_rocky4.2': 'He fights like it matters to everyone.',
    'chrissy.reaction.watched_rocky4.3': "I think that's why people believe it.",
    'chrissy.reaction.watched_karate_kid.1': "That one's gentler than people remember.",
    'chrissy.reaction.watched_karate_kid.2': "People think it's about fighting.",
    'chrissy.reaction.watched_karate_kid.3': "It isn't.",
    'chrissy.reaction.found_magic_vhs.1': 'No label?',
    'chrissy.reaction.found_magic_vhs.2': "...That's strange.",
    'chrissy.reaction.found_magic_vhs.3': 'Take it home.',

    'chrissy.phase.0.1': 'It gets pretty quiet in here at night.',
    'chrissy.phase.0.2': 'Everybody in Mansfield says they are getting out.',
    'chrissy.phase.0.3': "Funny thing is, they mostly don't.",
    'chrissy.phase.1.1': 'Oh. You came back.',
    'chrissy.phase.1.2': "That's always interesting.",
    'chrissy.phase.2.1': 'You are getting through them pretty fast.',
    'chrissy.phase.2.2': '...That is good.',
    'chrissy.phase.3.1': 'I had a dream about this place.',
    'chrissy.phase.3.2': 'Same store. Just... arranged differently.',
    'chrissy.phase.3.3': 'Like I knew where everything was supposed to go.',

    'chrissy.repeat.1': 'Take your time.',
    'chrissy.repeat.2': 'They are not going anywhere.',
    'chrissy.repeat.3': '...Probably.',
    'chrissy.repeat.4': 'You do not have to pick the right one.',
    'chrissy.repeat.5': 'Just pick one.',

    'chrissy.rare.1': 'Movies used to feel like they expected something from you.',
    'chrissy.rare.2': 'You ever feel like you have already seen something...',
    'chrissy.rare.3': '...but you are watching it anyway?',
    'chrissy.rare.4': 'Some stories stick around longer than they should.',

    'bart.first.1': 'Do you like drinking?',
    'bart.first.2': 'I like it when you drink.',
    'bart.first.3': 'I like it when I drink, too.',
    'bart.repeat.1': 'Like I said: have a drink!',

    'eddie.first.1': 'Hey. Ready for another shift?',
    'eddie.vhs.1': 'Someone returned that tape this morning.',
    'eddie.vhs.2': 'Never seen one like it. Weird symbols and all.',
    'eddie.vhs.3': 'Check if it is damaged, will you?',

    'look.video_store.normal.1': 'Midnight Video. Fluorescent buzz.',
    'look.video_store.normal.2': 'Rows of VHS tapes.',
    'look.video_store.normal.3': 'The place feels smaller once you know it.',
    'look.video_store.empty.1': 'The lights are still on.',
    'look.video_store.empty.2': "No one is here.",
    'look.video_store.empty.3': 'The place feels... paused.',

    'event.vhs_appears.1': "Something is different about the store today...",

    'item.watch.robocop.1': 'You watch ROBOCOP.',
    'item.watch.robocop.2': "'Dead or alive, you're coming with me.'",
    'item.watch.tron.1': 'You watch TRON.',
    'item.watch.tron.2': "'I fight for the Users!'",
    'item.watch.thing.1': 'You watch THE THING.',
    'item.watch.thing.2': "'Trust is a tough thing to come by these days.'",
    'item.watch.rocky4.1': 'You watch ROCKY IV.',
    'item.watch.rocky4.2': "'If I can change, you can change, everybody can change.'",
    'item.watch.karate_kid.1': 'You watch THE KARATE KID.',
    'item.watch.karate_kid.2': "'Wax on, wax off.'",
    'item.watch.common.rewind': 'The tape rewinds automatically.',

    'item.watch.blocked.home.1': 'Better watch that back at your apartment.',
    'item.watch.blocked.home.2': 'This is not really the place for it.',
    'item.watch.afterglow': 'Something about it stays with you.',

    'item.magic_vhs.use.1': 'The TV turns on before you touch it.',
    'item.magic_vhs.use.2': 'Static.',
    'item.magic_vhs.use.3': 'A shape in the noise.',
    'item.magic_vhs.use.4': 'A voice you almost recognize—',
    'item.magic_vhs.search.1': 'The tape is strangely warm.',
    'item.magic_vhs.idle.1': 'The tape hums softly.',

    'journal.incident.title': 'The Incident',
    'journal.incident.1': 'One moment I was in Mansfield. The next...',
    'journal.incident.2': 'A swirling vortex of color and madness.',
    'journal.incident.3': "Now I'm... somewhere else."
  }
};

let currentLanguage = 'en';

function textGet(key) {
  return TEXT[currentLanguage]?.[key] ?? TEXT.en?.[key] ?? key;
}

function textLines(keys) {
  return (keys || []).map(textGet).filter(Boolean);
}
