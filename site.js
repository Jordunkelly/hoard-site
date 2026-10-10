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

/* Crystal Watch tease */
(function () {
  var P = 'assets/art/maul/';
  var TREE = [
    ['Whirlwind', 'titan-cleave', 'void-vortex', 'inferno-spin'],
    ['Fury Strikes', 'executioner', 'thousand-cuts', 'thunder-fist'],
    ['War Cry', 'battle-hymn', 'bloodcall', 'the-scream'],
    ['Earthquake', 'fissure', 'aftershock', 'molten-core'],
    ['Relentless', 'bloodlust-engine', 'soul-siphon', 'undying-rage']
  ];
  var HEROES = [
    { id: 'berserker', name: 'Zerker', diff: 'Hard', acc: '#9b5cff', fx: 'rage', glow: true,
      line: 'A demon sealed in the blood. The seal is half open.',
      skills: [['bw-bk-crash', 'Breach Fall'], ['bw-bk-whirl', 'Reaping Whirl'], ['bw-bk-dust', 'Blood Frenzy'], ['bw-bk-burst', 'Loosen the Seal', 1]],
      ranks: true, tree: true },
    { id: 'paladin', name: 'Paladin', diff: 'Easy', acc: '#f6eebc', fx: 'light',
      line: 'A wall in plate.',
      skills: [['cr-pl-brightfall', 'Hammer of Dawn'], ['cr-pl-vow', 'Lay on Hands'], ['cr-pl-shield', 'Tower Shield'], ['cr-pl-writ', 'Divine Shield', 1]] },
    { id: 'goblin-king', name: 'Goblin King', diff: 'Medium', acc: '#f2c23a', fx: 'coins',
      line: 'Gold first. Gold always.' },
    { id: 'god-mage', name: 'Wizard', diff: 'Medium', acc: '#4ad8ae', fx: 'storm',
      line: 'Too big for any tower.' }
  ];
  var roster = document.querySelector('[data-cw-roster]');
  var detail = document.querySelector('[data-cw-detail]');
  if (!roster || !detail) return;
  function fx(kind) {
    var n = kind === 'storm' ? 4 : kind === 'coins' ? 10 : 7, s = '';
    for (var i = 0; i < n; i++) {
      var left = 8 + (i * 84 / n) + (i % 2 ? 4 : 0);
      s += kind === 'storm' ? '<i></i>' : '<i style="left:' + left + '%;animation-delay:' + ((i * 0.37) % 1.3).toFixed(2) + 's"></i>';
    }
    return '<span class="fx fx-' + kind + '">' + s + '</span>';
  }
  HEROES.forEach(function (h, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'cw-card'; b.setAttribute('role', 'tab');
    b.style.setProperty('--acc', h.acc);
    b.innerHTML = fx(h.fx) + '<img src="' + P + 'heroes/' + h.id + '-card.png" alt="">' +
      (h.glow ? '<img class="cw-glow" src="' + P + 'heroes/' + h.id + '-card-glow.png" alt="">' : '') +
      '<b>' + h.name + '</b><em>' + h.diff.toUpperCase() + '</em>';
    b.addEventListener('click', function () { pick(i); });
    b.addEventListener('mouseenter', function () { if (window.matchMedia('(hover: hover)').matches) pick(i); });
    roster.appendChild(b);
  });
  function skills(h) {
    var list = h.skills || [[0, '?'], [0, '?'], [0, '?'], [0, '?', 1]];
    return '<div class="cw-skills">' + list.map(function (s) {
      return '<div class="cw-skill' + (s[2] ? ' ult' : '') + '">' + (s[0] ? '<img src="' + P + 'skills/' + s[0] + '.png" alt="">' : '<span class="q">?</span>') + '<span>' + s[1] + '</span></div>';
    }).join('') + '</div>';
  }
  function pick(i) {
    var h = HEROES[i];
    roster.querySelectorAll('.cw-card').forEach(function (c, k) { c.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
    detail.style.setProperty('--acc', h.acc);
    var html = '<h3>' + h.name + '</h3><p class="cw-line">' + h.line + '</p><h4>Skills</h4>' + skills(h);
    if (h.ranks) html += '<h4>Knight</h4><div class="cw-ranks-row">' + ['recruit', 'squire', 'knight', 'berserker', 'god-berserker'].map(function (r) { return '<img src="' + P + 'rank-' + r + '.png" alt="">'; }).join('') + '</div>';
    if (h.tree) html += '<h4>Cards</h4><div class="cw-tree">' + TREE.map(function (t) { return '<div><b>' + t[0] + '</b>' + t.slice(1).map(function (a) { return '<img src="' + P + 'picks/tf-' + a + '.png" alt="" title="' + a.replace(/-/g, ' ') + '">'; }).join('') + '</div>'; }).join('') + '</div>';
    if (!h.skills) html = '<h3>' + h.name + '</h3><p class="cw-line">' + h.line + '</p><h4>Skills</h4>' + skills(h);
    detail.innerHTML = html;
  }
  pick(0);
  var boss = document.querySelector('[data-cw-boss]');
  if (boss && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { setTimeout(function () { boss.classList.add('lit'); }, 500); io.disconnect(); } });
    }, { threshold: 0.6 });
    io.observe(boss);
  } else if (boss) { boss.classList.add('lit'); }
})();
