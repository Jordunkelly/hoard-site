(function () {
  var RELEASES = 'https://api.github.com/repos/Jordunkelly/hoard-releases/releases/latest';
  var INSTALLER = 'Hoard-Setup.exe';

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
        var bits = [];
        if (asset) bits.push(Math.round(asset.size / 1048576) + ' MB');
        bits.push('Windows only');
        document.querySelectorAll('[data-dl-meta]').forEach(function (el) {
          var tag = document.createElement('span');
          tag.className = 'ver-tag';
          tag.textContent = rel.tag_name;
          el.textContent = '';
          el.appendChild(tag);
          el.appendChild(document.createTextNode(' · ' + bits.join(' · ')));
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

/* The two doors: the game alone, or both. Remembered in this browser only. */
(function () {
  document.documentElement.classList.add('js');
  var doors = document.querySelectorAll('[data-door]');
  function choose(path, scroll) {
    document.body.setAttribute('data-path', path);
    doors.forEach(function (d) { d.setAttribute('aria-pressed', String(d.getAttribute('data-door') === path)); });
    try { localStorage.setItem('hoard-door', path); } catch (e) {}
    if (scroll) {
      var to = document.getElementById(path === 'game' ? 'watch' : 'quest');
      if (to) to.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  doors.forEach(function (d) { d.addEventListener('click', function () { choose(d.getAttribute('data-door'), true); }); });
  var saved = null;
  try { saved = localStorage.getItem('hoard-door'); } catch (e) {}
  if (saved === 'game' || saved === 'both') choose(saved, false);
})();

/* Gibbles, support goblin. A chat widget that answers from a few canned
   lines in the page. Nothing typed is sent anywhere or kept. */
(function () {
  var root = document.querySelector('[data-gchat]');
  if (!root) return;
  var panel = root.querySelector('[data-gchat-panel]');
  var log = root.querySelector('[data-gchat-log]');
  var chips = root.querySelector('[data-gchat-chips]');
  var form = root.querySelector('[data-gchat-form]');
  var input = root.querySelector('[data-gchat-input]');
  var badge = root.querySelector('[data-gchat-badge]');
  var tease = root.querySelector('[data-gchat-tease]');
  var sticker = document.querySelector('[data-gib-sticker]');
  var unread = 1, busy = false, opened = false;

  var TOPICS = [
    { k: /(safe|data|privacy|private|secure|hack|spy|track|cloud|server)/, a: [
      'Your data stays on your PC. I do not have a server. I barely have a desk.',
      'Nothing leaves your machine but your own mail fetch and an update check. I checked. Twice. Grudgingly.' ] },
    { k: /(game|maul|crystal|tower|defen[cs]e|play|monster|boss|wave)/, a: [
      'Crystal Watch. A maze tower defense under the hoard. Thirty waves. You will die a lot. I will laugh a lot.',
      'Yes there is a game. No it is not easy. Build towers. Keep the crystal alive. Stop asking me.' ] },
    { k: /(steam|when|release|launch|out|date)/, a: [
      'Steam, aiming for Christmas 2026. Aiming. Not promising. Goblins do not do promises.',
      'Christmas 2026, on Steam. Ask again and it moves to Easter.' ] },
    { k: /(price|cost|free|pay|money|cheap|how much)/, a: [
      'Testers get a free Steam key at launch. Everyone else will pay. I like gold. Obviously.',
      'Free while you test it. After that, I take your gold. It is in my name.' ] },
    { k: /(mac|apple|phone|mobile|android|iphone|linux)/, a: [
      'Windows only. Mac bros, skill issue. Phone is coming. Not today. Sit at your PC.' ] },
    { k: /(what is|what's|hoard|budget|finance|bank|how does|how do)/, a: [
      'Hoard reads your bank alert emails and files every account in one place. On your PC. Then it judges you.',
      'It is a budget app that is secretly a goblin RPG. I am the goblin. Hello. Goodbye.' ] },
    { k: /(gmail|proton|mail|email|imap|password)/, a: [
      'Gmail with an app password, or Proton through Bridge. Your password goes to your mailbox, not me. I do not want it.' ] },
    { k: /(human|agent|manager|person|real|supervisor|speak to)/, a: [
      'There is no human. There is only me. I am the manager. I am also the janitor.',
      'Transferring you to a human. Please hold. Forever.' ] },
    { k: /(thank|thanks|thx|ty|cool|nice|love)/, a: [
      'Do not thank me. It encourages you.', 'Yeah, yeah. Go download it.' ] },
    { k: /(hi|hello|hey|sup|yo)\b/, a: [ 'Hi. What. Quickly.', 'Yes? I was counting.' ] },
    { k: /(bug|broke|crash|error|issue)/, a: [
      'A bug? In MY hoard? Screenshot it for the group chat. Testers get a Steam key for the crime.' ] }
  ];
  var MEH = [
    'I did not understand that and I am choosing not to try.',
    'Wow. Riveting. Anything else.',
    'I am an AI assistant. Artificially Irritated.',
    'Have you tried turning yourself off and on again.',
    'Your call is important to us. It is not important to me.',
    'Try the buttons. They are smarter than both of us.'
  ];
  var CHIPS = ['What is Hoard?', 'Is my data safe?', 'Is there a game?', 'When is Steam?', 'Talk to a human'];

  function add(cls, text) {
    var li = document.createElement('li');
    li.className = cls;
    li.textContent = text;
    log.appendChild(li);
    log.scrollTop = log.scrollHeight;
    return li;
  }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function reply(text) {
    busy = true;
    var t = add('bot typing', 'Gibbles is typing. Reluctantly.');
    setTimeout(function () {
      t.className = 'bot';
      t.textContent = text;
      log.scrollTop = log.scrollHeight;
      busy = false;
      if (panel.hidden) { unread += 1; badge.textContent = String(unread); badge.hidden = false; }
    }, 700 + Math.min(text.length * 12, 900));
  }
  function answer(q) {
    var s = q.toLowerCase();
    for (var i = 0; i < TOPICS.length; i++) if (TOPICS[i].k.test(s)) return pick(TOPICS[i].a);
    return pick(MEH);
  }
  // Asking for a human puts you on hold. Every time you ask, you lose a place.
  var caller = 0;
  function hold() {
    var lines;
    if (!caller) {
      caller = 4813;
      lines = ['Transferring you to a human. Please hold.', 'You are caller 4,812.', 'You are now caller 4,813. Someone cut in. It was me.', 'Estimated wait: Christmas.'];
    } else {
      caller += 1;
      lines = ['Back on hold. You are caller ' + caller.toLocaleString('en-US') + '. You are going the wrong way.'];
    }
    var i = 0;
    (function next() {
      if (i >= lines.length) return;
      busy = true;
      var t = add('bot typing', 'Gibbles is typing. Reluctantly.');
      var line = lines[i++];
      setTimeout(function () {
        t.className = 'bot';
        t.textContent = line;
        log.scrollTop = log.scrollHeight;
        busy = false;
        if (panel.hidden) { unread += 1; badge.textContent = String(unread); badge.hidden = false; }
        setTimeout(next, i === 2 ? 2600 : 500);
      }, 900);
    })();
  }
  function ask(q) {
    q = (q || '').trim();
    if (!q || busy) return;
    add('me', q);
    if (/(human|agent|manager|person|real|supervisor|speak to)/.test(q.toLowerCase())) { hold(); return; }
    reply(answer(q));
  }
  function open() {
    panel.hidden = false;
    tease.hidden = true;
    badge.hidden = true;
    unread = 0;
    if (!opened) {
      opened = true;
      add('bot', 'Hi. I am Gibbles, your AI assistant. I am not an AI. I am a goblin. What do you want.');
    }
    try { input.focus({ preventScroll: true }); } catch (e) {}
  }
  CHIPS.forEach(function (c) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = c;
    b.addEventListener('click', function () { ask(c); });
    chips.appendChild(b);
  });
  root.querySelector('[data-gchat-open]').addEventListener('click', function () { if (panel.hidden) open(); else panel.hidden = true; });
  root.querySelector('[data-gchat-close]').addEventListener('click', function () { panel.hidden = true; });
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); input.value = ''; });

  // The doors: he has opinions about those too.
  var DOOR = {
    game: 'You picked just the game. Bold. I will be down here guarding your money from you.',
    both: 'You picked both. Finally, someone with ambition. Here is your quest.'
  };
  // Both doors picked: a random handful of gold-grubbing stickers bursts up
  // across the screen and leaves. Never the Slay one; that is the game door's.
  var BOTH = ['w', 'go-off-king', 'bet', 'hoard', 'ya-boi', 'just-one-more', 'shiiii'];
  function burst() {
    var pool = BOTH.slice(), n = 2 + Math.floor(Math.random() * 3);
    for (var i = 0; i < n; i++) {
      var name = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      (function (name, i) {
        setTimeout(function () {
          var img = document.createElement('img');
          img.className = 'slay-pop';
          img.alt = '';
          img.src = 'assets/art/gibbles/' + name + '.png';
          img.style.left = (18 + Math.random() * 64) + '%';
          img.style.top = (25 + Math.random() * 45) + '%';
          img.style.width = 'min(200px, 45vw)';
          img.addEventListener('animationend', function () { img.remove(); });
          document.body.appendChild(img);
        }, i * 260);
      })(name, i);
    }
  }
  document.querySelectorAll('[data-door]').forEach(function (d) {
    var which = d.getAttribute('data-door');
    d.addEventListener('click', function () {
      if (sticker) {
        sticker.hidden = which !== 'game';
        if (which === 'game') { sticker.style.animation = 'none'; void sticker.offsetWidth; sticker.style.animation = ''; }
        sticker.onanimationend = function () { sticker.hidden = true; };
      }
      if (which === 'both') burst();
      if (!opened) { opened = true; add('bot', 'Hi. I am Gibbles, your AI assistant. I am not an AI. I am a goblin.'); }
      reply(DOOR[which]);
      tease.textContent = 'I have thoughts.';
    });
  });
})();
