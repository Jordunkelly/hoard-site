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
})();
