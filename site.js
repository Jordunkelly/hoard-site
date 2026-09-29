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
    tunesBtn.setAttribute('aria-pressed', String(on));
    tunesLabel.textContent = on ? 'Tunes on' : 'Tunes off';
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

  tunesBtn.addEventListener('click', function () {
    if (!audio.paused) { audio.pause(); return; }
    play(audio.getAttribute('src') || MAIN_THEME);
  });

  stagePlay.addEventListener('click', function () {
    var lair = LAIRS[current];
    if (!audio.paused && audio.getAttribute('src') === lair.track) { audio.pause(); return; }
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
    t.addEventListener('click', function () { pick(t.dataset.lair); });
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
