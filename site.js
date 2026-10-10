(function () {
  var RELEASES = 'https://api.github.com/repos/Jordunkelly/hoard-releases/releases/latest';
  var INSTALLER = 'Hoard.Setup.exe';

  // Colours are the app's own, from lib/built-in-themes.json, so a lair
  // picked here looks like the one you get.
  var LAIRS = {
    hearth: {
      name: 'Hearth', level: 'Yours from level 1',
      art: 'assets/art/theme-hearth.webp', alt: 'Hearth: a cabin at night with a fire going',
      track: 'assets/audio/smiths-cabin.mp3', tune: "Smith's Cabin",
      ember: '#d86641', gold: '#ddc274', panel: '#231c1a', border: '#5b453e', inset: '#191412'
    },
    elder: {
      name: 'Elder Moss', level: 'Earned at level 10',
      art: 'assets/art/theme-elder.webp', alt: 'Elder Moss: a great tree in a sunlit valley',
      track: 'assets/audio/elder-moss.mp3', tune: 'Elder Moss',
      ember: '#d8cc40', gold: '#eddfb5', panel: '#24231a', border: '#5c593d', inset: '#191912'
    },
    tundra: {
      name: 'Frostbite Tundra', level: 'Earned at level 20',
      art: 'assets/art/theme-tundra.webp', alt: 'Frostbite Tundra: a stone gate glowing on the ice',
      track: 'assets/audio/frozen-tundra.mp3', tune: 'Frozen Tundra',
      ember: '#3c83dd', gold: '#71d9df', panel: '#181e25', border: '#3a4a5f', inset: '#11151a'
    },
    market: {
      name: 'Starlit Market', level: 'Earned at level 40',
      art: 'assets/art/theme-market.webp', alt: 'Starlit Market: a night bazaar around a glowing tree',
      track: 'assets/audio/starlit-market.mp3', tune: 'Starlit Market',
      ember: '#8585e5', gold: '#a874dc', panel: '#1a1a23', border: '#3e3e5b', inset: '#121219'
    },
    celestial: {
      name: 'Celestial Falls', level: 'Earned at level 60',
      art: 'assets/art/theme-celestial.webp', alt: 'Celestial Falls: floating islands and a waterfall under two moons',
      track: 'assets/audio/celestial-falls.mp3', tune: 'Celestial Falls',
      ember: '#7e91ec', gold: '#956fe1', panel: '#171a26', border: '#363e63', inset: '#11121b'
    }
  };
  var MAIN_THEME = 'assets/audio/hoard-login-1.mp3';

  var root = document.documentElement;
  var audio = document.querySelector('[data-audio]');
  var tunesBtn = document.querySelector('[data-tunes]');
  var tunesLabel = document.querySelector('[data-tunes-label]');
  var stageArt = document.querySelector('[data-stage-art]');
  var stageName = document.querySelector('[data-stage-name]');
  var stageLevel = document.querySelector('[data-stage-level]');
  var stagePlay = document.querySelector('[data-stage-play]');
  var thumbs = document.querySelectorAll('[data-lair]');
  var current = 'hearth';
  audio.volume = 0.55;

  function sync() {
    var on = !audio.paused;
    if (on) tunesBtn.classList.remove('nudge');
    tunesBtn.setAttribute('aria-pressed', String(on));
    tunesLabel.textContent = on ? 'Tunes on' : tunesBtn.classList.contains('nudge') ? 'Click for tunes' : 'Tunes off';
    var lairOn = on && audio.getAttribute('src') === LAIRS[current].track;
    stagePlay.setAttribute('aria-pressed', String(lairOn));
    stagePlay.textContent = lairOn ? 'Stop the tune' : 'Play its tune';
  }

  function play(src) {
    if (audio.getAttribute('src') !== src) audio.src = src;
    var p = audio.play();
    if (p && p.catch) p.catch(function () { sync(); });
  }

  audio.addEventListener('play', sync);
  audio.addEventListener('pause', sync);
  audio.addEventListener('error', sync);

  // Somebody who switched the music off stays off on their next visit.
  function pref(value) {
    try {
      if (value) localStorage.setItem('hoard-tunes', value);
      return localStorage.getItem('hoard-tunes');
    } catch (e) { return null; }
  }

  tunesBtn.addEventListener('click', function () {
    if (!audio.paused) { audio.pause(); pref('off'); return; }
    pref('on');
    play(audio.getAttribute('src') || MAIN_THEME);
  });

  stagePlay.addEventListener('click', function () {
    var lair = LAIRS[current];
    if (!audio.paused && audio.getAttribute('src') === lair.track) { audio.pause(); pref('off'); return; }
    pref('on');
    play(lair.track);
  });

  function pick(key) {
    var lair = LAIRS[key];
    if (!lair) return;
    current = key;
    thumbs.forEach(function (t) { t.setAttribute('aria-pressed', String(t.dataset.lair === key)); });
    stageArt.classList.add('swap');
    setTimeout(function () {
      stageArt.src = lair.art;
      stageArt.alt = lair.alt;
      stageArt.classList.remove('swap');
    }, 150);
    stageName.textContent = lair.name;
    stageLevel.textContent = lair.level + '. Tune: ' + lair.tune + '.';
    root.style.setProperty('--ember', lair.ember);
    root.style.setProperty('--gold', lair.gold);
    root.style.setProperty('--panel', lair.panel);
    root.style.setProperty('--border-hi', lair.border);
    root.style.setProperty('--inset', lair.inset);
    play(lair.track);
  }

  thumbs.forEach(function (t) {
    t.addEventListener('click', function () { pref('on'); pick(t.dataset.lair); });
  });

  // Every browser refuses sound until the visitor has touched the page, so
  // the music tries once on load and otherwise starts on the first click, tap
  // or key anywhere. A touch only counts as permission on release, which is
  // why the listeners stay armed until a play actually succeeds rather than
  // coming off at the first event. Presses on the music controls themselves
  // are left to their own handlers, or the first click on Tunes would start
  // the music here and stop it again there.
  var GESTURES = ['pointerdown', 'pointerup', 'touchend', 'keydown', 'click'];
  var CONTROLS = '[data-tunes], [data-stage-play], [data-lair]';

  function disarm() {
    GESTURES.forEach(function (g) { window.removeEventListener(g, onGesture, true); });
    tunesBtn.classList.remove('nudge');
    sync();
  }

  function onGesture(ev) {
    if (!audio.paused || (ev.target.closest && ev.target.closest(CONTROLS))) { disarm(); return; }
    var p = audio.play();
    if (p && p.then) p.then(disarm, function () {});
  }

  if (pref() !== 'off') {
    audio.src = MAIN_THEME;
    var first = audio.play();
    if (first && first.catch) {
      first.catch(function () {
        tunesBtn.classList.add('nudge');
        sync();
        GESTURES.forEach(function (g) { window.addEventListener(g, onGesture, true); });
      });
    }
  }

  // Most people meet this page in a group chat on their phone, where the
  // installer is no use. The phone gets a way to hand the link to a PC
  // instead: the share sheet where there is one, the clipboard where not, and
  // the bare address as a last resort.
  if (root.classList.contains('is-mobile')) {
    document.querySelectorAll('[data-dl-link]').forEach(function (a) { a.removeAttribute('href'); });
  }
  document.querySelectorAll('[data-send]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var url = location.href.split('#')[0];
      if (navigator.share) {
        navigator.share({ title: 'Hoard', text: 'Hoard. Grab it on your PC.', url: url }).catch(function () {});
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(
          function () { btn.textContent = 'Link copied. Paste it on your PC.'; },
          function () { btn.textContent = url; }
        );
        return;
      }
      btn.textContent = url;
    });
  });

  // Version and size from the release itself, so the page never goes stale.
  // If GitHub does not answer, the static line stays and the button still works.
  if (window.fetch) {
    fetch(RELEASES, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rel) {
        if (!rel || !rel.tag_name) return;
        var asset = (rel.assets || []).filter(function (a) { return a.name === INSTALLER; })[0];
        var bits = [rel.tag_name];
        if (asset) bits.push(Math.round(asset.size / 1048576) + ' MB');
        bits.push('Windows only');
        document.querySelectorAll('[data-dl-meta]').forEach(function (el) {
          el.textContent = bits.join(' · ');
        });
      })
      .catch(function () {});
  }

  // Midnight on Christmas morning in the visitor's own timezone. Every
  // "Are we there yet" past the fourth adds a day of spite to the display, and
  // a reload forgives it.
  var CHRISTMAS = new Date(2026, 11, 25).getTime();
  var DAY = 86400000;
  var spite = 0;
  var cd = {};
  ['d', 'h', 'm', 's'].forEach(function (k) { cd[k] = document.querySelector('[data-cd="' + k + '"]'); });
  var spiteLine = document.querySelector('[data-spite]');
  var nagBtn = document.querySelector('[data-nag]');
  var nagReply = document.querySelector('[data-nag-reply]');
  var NAGS = [
    'No.',
    'Still no.',
    'You ask the oven if the bread is done every four seconds, don\'t you. I can tell.',
    'Ask me one more time and I add a day.',
    'SPITE',
    'Keep going. I have all year. Literally.',
    'Do you want it to be Easter? Because this is how it becomes Easter.'
  ];
  var nagAt = 0;

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function tick() {
    var left = CHRISTMAS + spite * DAY - Date.now();
    if (left <= 0) {
      cd.d.textContent = cd.h.textContent = cd.m.textContent = cd.s.textContent = '00';
      nagReply.textContent = 'Any day now. Stop refreshing.';
      return false;
    }
    cd.d.textContent = String(Math.floor(left / DAY));
    cd.h.textContent = pad(Math.floor(left / 3600000) % 24);
    cd.m.textContent = pad(Math.floor(left / 60000) % 60);
    cd.s.textContent = pad(Math.floor(left / 1000) % 60);
    return true;
  }

  if (tick()) {
    var clock = setInterval(function () { if (!tick()) clearInterval(clock); }, 1000);
  }

  nagBtn.addEventListener('click', function () {
    var line = NAGS[nagAt];
    nagAt = (nagAt + 1) % NAGS.length;
    if (line === 'SPITE') {
      spite += 1;
      line = spite === 1 ? 'Right. That\'s a day. Well done.' : 'Another day. You\'re really committed to this.';
      spiteLine.hidden = false;
      spiteLine.textContent = '+' + spite + (spite === 1 ? ' day' : ' days') + ' of goblin spite. Reload to say sorry.';
      tick();
    }
    nagReply.textContent = line;
  });

  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!still) {
    var embers = document.querySelector('.embers');
    for (var i = 0; i < 26; i++) {
      var e = document.createElement('i');
      e.style.left = (Math.random() * 100).toFixed(1) + '%';
      e.style.setProperty('--d', (5 + Math.random() * 6).toFixed(1) + 's');
      e.style.setProperty('--delay', (-Math.random() * 10).toFixed(1) + 's');
      e.style.setProperty('--drift', Math.round(Math.random() * 80 - 40) + 'px');
      if (Math.random() < 0.35) { e.style.width = '6px'; e.style.height = '6px'; }
      embers.appendChild(e);
    }
  }

  var reveals = document.querySelectorAll('.reveal');
  if (still || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }
  // The clips play while they are on screen and stop when they leave, so four
  // videos are not all decoding at once on a phone. Loaded only once seen:
  // preload is none, and the poster stands in until then. With reduced motion
  // nothing plays by itself, and the controls are there to start it.
  var clips = document.querySelectorAll('.clip video');
  clips.forEach(function (v) {
    v.addEventListener('click', function () { if (v.paused) v.play().catch(function () {}); else v.pause(); });
  });
  if (still || !('IntersectionObserver' in window)) {
    clips.forEach(function (v) { v.controls = true; });
  } else {
    var watch = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) v.play().catch(function () {});
        else v.pause();
      });
    }, { threshold: 0.5 });
    clips.forEach(function (v) { watch.observe(v); });
  }
})();

/* Crystal Watch tease: the game's own hero select, ported */
(function () {
  var D = {"heroes":[{"id":"berserker","name":"Zerker","pitch":"Bloodsworn. A demon sealed in the blood. The seal is half open.","playable":true,"shown":false,"skills":[{"id":"bw-bk-crash","name":"Breach Fall","kind":"basic","target":"none","text":"He jumps. He lands. The ground breaks, and so does whoever was standing on it."},{"id":"bw-bk-whirl","name":"Reaping Whirl","kind":"basic","target":"none","text":"He spins with the blade out. Close enough to bite him is close enough to be sliced. Repeatedly."},{"id":"bw-bk-dust","name":"Blood Frenzy","kind":"basic","target":"passive","text":"His blood hangs round him in a red mist. Towers that breathe it hit harder, and his own blows go for the neck, sometimes two necks."},{"id":"bw-bk-burst","name":"Loosen the Seal","kind":"ultimate","target":"unit","text":"He lets the demon out on one creep: one blow with everything in it, then faster, harder swings. He forgets to guard. Nobody tells him."}],"towers":[{"id":"bw-knight","name":"Knight","ranks":5,"tiers":["Recruit","Squire","Knight","Berserker","God Berserker"],"skills":[{"name":"Whirlwind","drawn":true,"builds":["Storm","Crit","Bleed","Void"],"pieces":false,"transforms":[{"name":"Titan's Cleave","art":"tf-titan-cleave"},{"name":"Void Vortex","art":"tf-void-vortex"},{"name":"Inferno Spin","art":"tf-inferno-spin"}]},{"name":"Fury Strikes","drawn":false,"builds":["Precision","Butcher","Bleed","Storm"],"pieces":false,"transforms":[{"name":"Executioner","art":"tf-executioner"},{"name":"Thousand Cuts","art":"tf-thousand-cuts"},{"name":"Thunder Fist","art":"tf-thunder-fist"}]},{"name":"War Cry","drawn":false,"builds":["Hymn","Rally","Terror","Blood"],"pieces":false,"transforms":[{"name":"Battle Hymn","art":"tf-battle-hymn"},{"name":"Bloodcall","art":"tf-bloodcall"},{"name":"The Scream","art":"tf-the-scream"}]},{"name":"Earthquake","drawn":false,"builds":["Fault","Stun","Fire","Echo"],"pieces":false,"transforms":[{"name":"Fissure","art":"tf-fissure"},{"name":"Aftershock","art":"tf-aftershock"},{"name":"Molten Core","art":"tf-molten-core"}]},{"name":"Relentless","drawn":false,"builds":["Shape","Target","Feed"],"pieces":true,"transforms":[{"name":"Bloodlust Engine","art":"tf-bloodlust-engine"},{"name":"Soul Siphon","art":"tf-soul-siphon"},{"name":"Undying Rage","art":"tf-undying-rage"}]}]}],"coming":[{"id":"bw-chain-hook","name":"Chain Hook","ranks":0,"skills":[{"name":"Hook","builds":[],"transforms":[]}]}],"w":28,"h":25},{"id":"paladin","name":"Paladin","pitch":"A wall in plate. He mends his own wounds, lifts every tower standing near him, and stops a pack cold with the hammer.","playable":false,"shown":true,"skills":[{"id":"cr-pl-brightfall","name":"Hammer of Dawn","kind":"basic","target":"point","text":"He throws the hammer up and the heavens throw it back. Whatever it lands on stands very still for a while."},{"id":"cr-pl-vow","name":"Lay on Hands","kind":"basic","target":"none","text":"He kneels and the ground goes holy. Standing there, he mends, and the towers round him shoot faster."},{"id":"cr-pl-shield","name":"Tower Shield","kind":"basic","target":"passive","text":"A shield taller than his ego. Creeps that hit it forget where they were going, and towers near him shoot faster and further."},{"id":"cr-pl-writ","name":"Divine Shield","kind":"ultimate","target":"none","text":"For a few breaths nothing can touch him, and his light strips the armour off every creep nearby. Very holy. Very rude."}],"towers":[],"coming":[],"w":24,"h":26},{"id":"goblin-king","name":"Goblin King","pitch":"Gold first, gold always. He bends the run until the towers all but buy themselves, and spends it faster than anyone can count.","playable":false,"shown":false,"skills":null,"towers":[],"coming":[],"w":21,"h":25},{"id":"god-mage","name":"Wizard","pitch":"Fire from the sky and lightning between the packs. Whole waves come apart under spells too big for any tower.","playable":false,"shown":false,"skills":null,"towers":[],"coming":[],"w":20,"h":25}],"tree":{"name":"Whirlwind","text":"Spins the blade; every creep in reach takes the blow.","rings":["Recruit","Knight","Berserker","God Berserker"],"nodes":[{"id":"wh-core","name":"Whirlwind","text":"Spins the blade; every creep in reach takes the blow.","kind":"core","max":1,"x":500,"y":320,"art":"kn-cyclone"},{"id":"wh-quick","name":"Quick Spin","text":"Faster spins.","kind":"minor","max":5,"ring":1,"x":500,"y":228,"needs":{"node":"wh-core","points":1},"build":"wind","art":"speed"},{"id":"wh-gale","name":"Gale","text":"The spin knocks creeps back.","kind":"minor","max":5,"ring":2,"x":437,"y":149,"needs":{"node":"wh-quick","points":2},"build":"wind","art":"stun"},{"id":"wh-reach","name":"Long Reach","text":"Longer spin reach.","kind":"minor","max":3,"ring":2,"x":563,"y":149,"needs":{"node":"wh-quick","points":2},"build":"wind","art":"range"},{"id":"wh-cyclone","name":"Cyclone","text":"Never stops spinning while anything is in reach: smaller hits, no pause.","kind":"notable","max":1,"ring":2,"x":406,"y":100,"needs":{"node":"wh-gale","points":3},"build":"wind","art":"kn-second-wind"},{"id":"wh-wide","name":"Wide Arc","text":"An outer ring of blades turns past reach.","kind":"notable","max":1,"ring":2,"x":594,"y":100,"needs":{"node":"wh-reach","points":2},"build":"wind","art":"kn-wide-arc"},{"id":"wh-keen","name":"Keen Edge","text":"Blows can crit for double; more crit chance each point.","kind":"minor","max":5,"ring":1,"x":647,"y":320,"needs":{"node":"wh-core","points":1},"build":"steel","art":"crit"},{"id":"wh-force","name":"Brutal Force","text":"Crits land harder.","kind":"minor","max":5,"ring":2,"x":769,"y":269,"needs":{"node":"wh-keen","points":2},"build":"steel","art":"dps"},{"id":"wh-finish","name":"Finishing Cut","text":"Harder on a creep near death.","kind":"minor","max":5,"ring":2,"x":769,"y":371,"needs":{"node":"wh-keen","points":2},"build":"steel","art":"skull"},{"id":"wh-greatsword","name":"Greatsword","text":"Slow, huge blows. The spin becomes a wide crescent that knocks creeps back, and a second point makes its crits heavier.","kind":"notable","max":2,"ring":2,"x":843,"y":242,"needs":{"node":"wh-force","points":3},"build":"steel","art":"kn-greatsword"},{"id":"wh-exec-edge","name":"Executioner's Edge","text":"A creep counts as dying at a higher share of life.","kind":"notable","max":3,"ring":2,"x":843,"y":398,"needs":{"node":"wh-finish","points":3},"build":"steel","art":"kn-executioner"},{"id":"wh-serrated","name":"Serrated","text":"Blows open bleeding wounds: each stack bleeds a tenth of the blow a second for 4s, up to 50 on a creep.","kind":"minor","max":5,"ring":1,"x":500,"y":412,"needs":{"node":"wh-core","points":1},"build":"blood","art":"bleed"},{"id":"wh-deep","name":"Deep Cuts","text":"Bleeds deal more damage.","kind":"minor","max":5,"ring":2,"x":563,"y":491,"needs":{"node":"wh-serrated","points":2},"build":"blood","art":"bleed"},{"id":"wh-veins","name":"Open Veins","text":"Bleeds last longer.","kind":"minor","max":5,"ring":2,"x":437,"y":491,"needs":{"node":"wh-serrated","points":2},"build":"blood","art":"bleed"},{"id":"wh-twin","name":"Twin Blades","text":"Two light blades: fast blows, and every one bleeds once more than it would have.","kind":"notable","max":2,"ring":2,"x":594,"y":540,"needs":{"node":"wh-deep","points":3},"build":"blood","art":"kn-twin-blades"},{"id":"wh-tide","name":"Red Tide","text":"Nearby towers attack faster, the nearer the faster.","kind":"notable","max":3,"ring":2,"x":406,"y":540,"needs":{"node":"wh-veins","points":3},"build":"blood","art":"kn-red-tide"},{"id":"wh-void","name":"Void Edge","text":"Part of the blow converts to void, which ignores armour type.","kind":"minor","max":5,"ring":1,"x":353,"y":320,"needs":{"node":"wh-core","points":1},"build":"abyss","art":"spells"},{"id":"wh-hollow","name":"Hollowing","text":"Hits hollow the creep so it takes more from everything: 2% a stack for 5s, each stack harder than the last, up to 15.","kind":"minor","max":5,"ring":2,"x":231,"y":371,"needs":{"node":"wh-void","points":2},"build":"abyss","art":"mark"},{"id":"wh-fear","name":"Fearsome","text":"Nearby creeps slow in fear.","kind":"minor","max":5,"ring":2,"x":231,"y":269,"needs":{"node":"wh-void","points":2},"build":"abyss","art":"slow"},{"id":"wh-ember","name":"Black Ember","text":"The ground under the tower burns while it spins.","kind":"notable","max":3,"ring":2,"x":157,"y":242,"needs":{"node":"wh-fear","points":3},"build":"abyss","art":"kn-black-ember"},{"id":"wh-eclipse","name":"Eclipse Brand","text":"Ailments leap to another creep when a creep dies carrying them.","kind":"notable","max":3,"ring":2,"x":157,"y":398,"needs":{"node":"wh-hollow","points":3},"build":"abyss","art":"kn-eclipse-brand"},{"id":"wh-titan","name":"Titan's Cleave","text":"The spin slows to one revolution every three seconds that hits for 2 times more, in a white crescent that shakes the field. Every creep it hits is stunned.","kind":"transform","max":1,"ring":3,"x":805,"y":129,"needs":{"node":"wh-core","points":1},"art":"tf-titan-cleave"},{"id":"wh-vortex","name":"Void Vortex","text":"The whole blow converts to void. The spin pulls every creep within twice reach toward the tower, each second in the pull hollows it, and on the third second the vortex collapses in a burst of all the Hollow it laid.","kind":"transform","max":1,"ring":3,"x":195,"y":129,"needs":{"node":"wh-core","points":1},"art":"tf-void-vortex"},{"id":"wh-inferno","name":"Inferno Spin","text":"All of the blow turns to fire. A ring of flame turns with the blade, every hit ignites, the ground under the spin burns, and a creep that dies ignited spreads its fire a cell.","kind":"transform","max":1,"ring":3,"x":195,"y":511,"needs":{"node":"wh-core","points":1},"art":"tf-inferno-spin"},{"id":"wh-bladestorm","name":"Bladestorm","text":"Blows land 1.4 times harder while spinning, and every spin throws a second spin outward at 20% of the first.","kind":"capstone","max":1,"ring":4,"x":842,"y":534,"needs":{"node":"wh-core","points":1},"art":"kn-bladestorm"}]}};
  var P = 'assets/art/maul/';
  var LOOK = { berserker: ['#9161d6', 'rage'], paladin: ['#f7f0d4', 'light'], 'goblin-king': ['#f0c040', 'coins'], 'god-mage': ['#8eaad0', 'storm'] };
  var BUILD = { steel: ['Crit', '#f0c040'], wind: ['Storm', '#3fb3a0'], blood: ['Bleed', '#b02a4a'], iron: ['Guard', '#5b86b3'], abyss: ['Void', '#9161d6'] };
  var KEYS = ['Q', 'W', 'E', 'R'];
  var STREAKS = [[30, 0], [40, .35], [47, .15], [55, .5], [62, .25], [70, .6]];
  var BOLTS = [[24, 18, 2.4, -14], [66, 26, 2.9, 12], [44, 8, 3.4, -6]];
  var COINS = [[8, 0], [22, .5], [37, .2], [51, .8], [66, .35], [80, .65], [90, .1], [30, 1], [60, 1.2], [14, 1.4]];
  var EL = ['fire', 'ice', 'earth', 'air'];
  var roster = document.querySelector('[data-cw-roster]');
  var detail = document.querySelector('[data-cw-detail]');
  if (!roster || !detail) return;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var timers = {};

  function card(h, i) {
    var look = LOOK[h.id], fx = look[1];
    var shadow = !h.playable && !h.shown;
    var back = '', front = '';
    if (fx === 'rage') back = '<span class="hs-rage-rise"></span><span class="hs-ssj"><span class="hs-ssj-outer"></span><span class="hs-ssj-inner"></span></span>';
    if (fx === 'light') back = '<span class="hs-aura"></span><span class="hs-rays"></span>';
    if (fx === 'storm') back = '<span class="hs-orbit">' + EL.map(function (e) { return '<span class="hs-element hs-' + e + '"></span>'; }).join('') + '</span>';
    if (fx === 'storm') front = EL.map(function (e) { return '<span class="hs-blast hs-' + e + '"></span>'; }).join('');
    if (fx === 'light') front = '<span class="hs-beam"></span>' + COINS.map(function (c) { return '<span class="hs-mote" style="left:' + c[0] + '%;animation-delay:' + c[1] * 1.5 + 's"></span>'; }).join('');
    if (fx === 'coins') front = COINS.map(function (c) { return '<span class="hs-coin" style="left:' + c[0] + '%;animation-delay:' + c[1] + 's"></span>'; }).join('');
    if (fx === 'rage') front = STREAKS.map(function (s) { return '<span class="hs-streak" style="left:' + s[0] + '%;animation-delay:' + s[1] + 's"></span>'; }).join('') +
      BOLTS.map(function (b) { return '<span class="hs-bolt" style="left:' + b[0] + '%;top:' + b[1] + '%;rotate:' + b[3] + 'deg;animation-delay:' + b[2] + 's"></span>'; }).join('');
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'hs-card hs-' + fx; b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', h.name); b.dataset.shadow = shadow;
    b.style.setProperty('--hs-accent', look[0]);
    b.innerHTML = '<span class="hs-field"><span class="hs-fx">' + back + '</span>' +
      '<span class="hs-art" style="aspect-ratio:' + h.w + '/' + h.h + ';width:' + Math.min(100, h.w * 3.4) + '%"><img data-f src="' + P + 'dolls/' + h.id + '-0.png" alt=""><img class="hs-glow" data-g src="' + P + 'dolls/' + h.id + '-0-glow.png" alt=""></span>' +
      '<span class="hs-fx hs-front">' + front + '</span><span class="hs-num">' + (i + 1) + '</span>' +
      (shadow ? '<span class="hs-soon">Coming soon</span>' : '') + '</span>' +
      '<span class="hs-plate hs-plate-crystal"><span class="hs-name">' + esc(h.name) + '</span></span>';
    function breathe(on) {
      clearInterval(timers[h.id]);
      var f = b.querySelector('[data-f]'), g = b.querySelector('[data-g]'), k = 0;
      f.src = P + 'dolls/' + h.id + '-0.png'; g.src = P + 'dolls/' + h.id + '-0-glow.png';
      if (!on || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      timers[h.id] = setInterval(function () { k = 1 - k; f.src = P + 'dolls/' + h.id + '-' + k + '.png'; g.src = P + 'dolls/' + h.id + '-' + k + '-glow.png'; }, 600);
    }
    b.addEventListener('click', function () { pick(i); });
    b.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { breathe(true); pick(i); } });
    b.addEventListener('pointerleave', function () { if (b.getAttribute('aria-pressed') !== 'true') breathe(false); });
    b._breathe = breathe;
    return b;
  }

  function skillRow(a, i) {
    var kind = a.kind === 'ultimate' ? 'Ultimate' : a.target === 'passive' ? 'Passive' : 'Skill';
    return '<li class="hd-skill' + (a.kind === 'ultimate' ? ' ult' : '') + (a.target === 'passive' ? ' passive' : '') + '"><span class="hd-icon"><img src="' + P + 'skills/' + a.id + '.png" alt=""></span>' +
      '<span class="hd-sk"><span class="hd-skh"><span class="hd-key">' + KEYS[i] + '</span><b>' + esc(a.name) + '</b><span class="hd-kind">' + kind + '</span></span><span class="hd-txt">' + esc(a.text) + '</span></span></li>';
  }
  function skillLine(s) {
    var tip = s.builds.length ? '<span class="hd-tip"><span class="hd-tiph">' + (s.pieces ? 'Pieces, one of each' : 'Builds') + '</span><span>' + s.builds.map(esc).join(' · ') + '</span>' +
      (s.transforms.length ? '<span class="hd-tiph">Transforms, take one</span><span>' + s.transforms.map(function (t) { return esc(t.name); }).join(', ') + '</span>' : '') + '</span>'
      : '<span class="hd-tip"><span>Its tree is still to be drawn.</span></span>';
    return '<li class="hd-line" tabindex="0"' + (s.drawn ? ' data-drawn' : '') + '><span class="hd-ln"><b>' + esc(s.name) + '</b>' + (s.drawn ? '' : '<span class="hd-kind">Tree to come</span>') + '</span>' +
      (s.transforms.length ? '<span class="hd-tfs">' + s.transforms.map(function (t) { return '<img src="' + P + 'picks/' + t.art + '.png" alt="" title="' + esc(t.name) + '">'; }).join('') + '</span>' : '') + tip + '</li>';
  }
  var RANKS = ['recruit', 'squire', 'knight', 'berserker', 'god-berserker'];
  function towerTile(t) {
    return '<li class="hd-tower"><span class="hd-th"><img class="hd-port" src="' + P + 'ranks/god-berserker.png" alt=""><span><b>' + esc(t.name) + '</b><span class="hd-kind">' + t.ranks + ' ranks</span></span></span>' +
      '<span class="kp-climb">' + RANKS.map(function (r, k) { return '<span class="kp-step" style="--kp-rank:' + k + '"' + (k === 4 ? ' data-top' : '') + ' title="' + esc(t.tiers[k] || '') + '"><img src="' + P + 'ranks/' + r + '.png" alt=""></span>'; }).join('') + '</span>' +
      '<ul class="hd-lines">' + t.skills.map(skillLine).join('') + '</ul></li>';
  }
  function comingTile(t) {
    return '<li class="hd-tower hd-coming"><span class="hd-th"><span class="hd-q">?</span><span><b>' + esc(t.name) + '</b><span class="hd-kind">' + (t.ranks ? t.ranks + ' ranks' : 'No ranks') + '</span></span><span class="hd-pill">Coming soon</span></span>' +
      '<ul class="hd-lines">' + t.skills.map(function (s) { return skillLine({ name: s.name, builds: s.builds, transforms: s.transforms, drawn: false }); }).join('') + '</ul></li>';
  }
  function treeSvg(t) {
    var by = {}; t.nodes.forEach(function (n) { by[n.id] = n; });
    var links = t.nodes.filter(function (n) { return n.needs && by[n.needs.node]; }).map(function (n) { var p = by[n.needs.node], c = n.build ? BUILD[n.build][1] : '#3d3550'; return '<line x1="' + p.x + '" y1="' + p.y + '" x2="' + n.x + '" y2="' + n.y + '" stroke="' + c + '" stroke-width="6" opacity=".55"/>'; }).join('');
    var rings = [180, 330, 470].map(function (r) { return '<ellipse cx="500" cy="320" rx="' + r + '" ry="' + r * .64 + '" fill="none" stroke="#2a2438" stroke-width="3" stroke-dasharray="10 10"/>'; }).join('');
    var nodes = t.nodes.map(function (n) {
      var c = n.build ? BUILD[n.build][1] : '#ddc274', title = '<title>' + esc(n.name + ': ' + n.text) + '</title>';
      if (n.kind === 'transform') return '<g>' + title + '<rect x="' + (n.x - 44) + '" y="' + (n.y - 44) + '" width="88" height="88" fill="#0c0b12" stroke="#9161d6" stroke-width="6"/><image href="' + P + 'picks/' + n.art + '.png" x="' + (n.x - 38) + '" y="' + (n.y - 38) + '" width="76" height="76" style="image-rendering:pixelated"/></g>';
      if (n.kind === 'core') return '<g>' + title + '<circle cx="' + n.x + '" cy="' + n.y + '" r="50" fill="#1d1230" stroke="#ddc274" stroke-width="7"/><image href="' + P + 'skills/bw-bk-whirl.png" x="' + (n.x - 32) + '" y="' + (n.y - 32) + '" width="64" height="64" style="image-rendering:pixelated"/></g>';
      if (n.kind === 'capstone') return '<g>' + title + '<rect x="' + (n.x - 40) + '" y="' + (n.y - 40) + '" width="80" height="80" transform="rotate(45 ' + n.x + ' ' + n.y + ')" fill="#2a1748" stroke="#ddc274" stroke-width="7"/></g>';
      var r = n.kind === 'notable' ? 30 : 18;
      return '<g>' + title + '<circle cx="' + n.x + '" cy="' + n.y + '" r="' + r + '" fill="#0c0b12" stroke="' + c + '" stroke-width="' + (n.kind === 'notable' ? 8 : 5) + '"/></g>';
    }).join('');
    var legend = Object.keys(BUILD).filter(function (k) { return t.nodes.some(function (n) { return n.build === k; }); }).map(function (k) { return '<span style="--c:' + BUILD[k][1] + '">' + BUILD[k][0] + '</span>'; }).join('');
    return '<div class="hd-tree"><h3>' + esc(t.name) + ' tree</h3><svg viewBox="0 0 1000 640" role="img" aria-label="' + esc(t.name) + ' skill tree">' + rings + links + nodes + '</svg><div class="hd-legend">' + legend + '<span class="hd-tf">Transform</span></div></div>';
  }

  function pick(i) {
    var h = D.heroes[i];
    var cards = roster.querySelectorAll('.hs-card');
    cards.forEach(function (c, k) { c.setAttribute('aria-pressed', k === i ? 'true' : 'false'); c._breathe(k === i); });
    var left = '<div class="hd-col"><h2>' + esc(h.name) + '</h2><p class="hd-pitch">' + esc(h.pitch) + '</p><h3>Skills</h3>' +
      (h.skills && !(!h.playable && !h.shown) ? '<ul class="hd-skills">' + h.skills.map(skillRow).join('') + '</ul>' : '<p class="hd-soon">Coming soon</p>') + '</div>';
    var right = '<div class="hd-col"><h3>Towers</h3>' + (h.towers.length ? '<ul class="hd-towers">' + h.towers.map(towerTile).join('') + h.coming.map(comingTile).join('') + '</ul>' : '<p class="hd-soon">Coming soon</p>') + '</div>';
    detail.innerHTML = '<div class="hd-grid">' + left + right + '</div>' + (h.id === 'berserker' ? treeSvg(D.tree) : '');
  }
  D.heroes.forEach(function (h, i) { roster.appendChild(card(h, i)); });
  pick(0);
  var boss = document.querySelector('[data-cw-boss]');
  if (boss && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { setTimeout(function () { boss.classList.add('lit'); }, 500); io.disconnect(); } });
    }, { threshold: 0.6 });
    io.observe(boss);
  } else if (boss) { boss.classList.add('lit'); }
})();
