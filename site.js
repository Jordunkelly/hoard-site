(function () {
  var RELEASES = 'https://api.github.com/repos/Jordunkelly/hoard-releases/releases/latest';
  var INSTALLER = 'Hoard-Setup.exe';
  // The Steam store page. Empty until the page exists; set it and every
  // [data-steam-link] on the page turns into a visible link to it.
  var STEAM_STORE = '';

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

  if (STEAM_STORE) {
    document.querySelectorAll('[data-steam-link]').forEach(function (a) { a.href = STEAM_STORE; a.hidden = false; });
  }

  // The roadmap marks the step the calendar is on, so it does not need an
  // edit on the day alpha turns into beta. Each step lasts until the local
  // midnight in its data-rm-until; the last one has none and runs forever.
  var steps = document.querySelectorAll('.roadmap li');
  for (var si = 0; si < steps.length; si++) {
    var until = steps[si].getAttribute('data-rm-until');
    var end = until ? new Date(Number(until.slice(0, 4)), Number(until.slice(5, 7)) - 1, Number(until.slice(8, 10))).getTime() : Infinity;
    if (Date.now() < end) {
      steps[si].classList.add('is-now');
      steps[si].setAttribute('aria-current', 'step');
      break;
    }
  }

  // Midnight on 1 April 2027, the Steam launch, in the visitor's own timezone.
  // Every "Are we there yet" past the fourth adds a day of spite to the
  // display, and a reload forgives it.
  var LAUNCH = new Date(2027, 3, 1).getTime();
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
    'Do you want it to be summer? Because this is how it becomes summer.'
  ];
  var nagAt = 0;

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function tick() {
    var left = LAUNCH + spite * DAY - Date.now();
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
    var watch = document.getElementById('watch');
    var steam = document.getElementById('steam');
    var quest = document.getElementById('quest');
    if (watch && steam && quest) {
      if (path === 'both') steam.parentNode.insertBefore(watch, steam);
      else quest.parentNode.insertBefore(watch, quest.nextSibling);
    }
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
  var pills = root.querySelector('[data-gchat-pills]');
  var askBtn = root.querySelector('[data-gchat-ask]');
  var kindsBox = root.querySelector('[data-gchat-kinds]');
  var kindBtns = root.querySelectorAll('[data-kind]');
  var send = root.querySelector('[data-gchat-send]');
  var sendIcon = root.querySelector('[data-gchat-send-icon]');
  var attach = root.querySelector('[data-gchat-attach]');
  var trash = root.querySelector('[data-gchat-trash]');
  var heckleBox = root.querySelector('[data-gchat-heckle]');

  // The app's pixel glyphs (components/shared/icons/mail-state-icon.tsx), one
  // colour each, drawn in currentColor so a button's colour is the glyph's.
  var PIX = {
    bug: ['..X....X..', '...X..X...', '...XXXX...', 'X.XXXXXX.X', '.XX.XX.XX.', '..XXXXXX..', 'XXX.XX.XXX', '..XXXXXX..', '.X.XXXX.X.', 'X...XX...X'],
    brain: ['..XXXXXX..', '.XX.XX.XX.', 'XX.XX.X.XX', 'X.XX.X.X.X', 'XX.X.XX.XX', 'X.X.XX.X.X', 'XX.XX.X.XX', '.XXX.XXXX.', '...XXX....', '....XX....'],
    flower: ['...XXXX...', '..XX..XX..', '.XX.XX.XX.', '.X.XXXX.X.', '.XX.XX.XX.', '..XX..XX..', '...XXXX...', '....XX.XX.', '.XX.XXXX..', '..XXXX....'],
    clip: ['...X.', '..X.X', 'X.X.X', 'X.X.X', 'X.X.X', 'X.X.X', 'X.X.X', 'X.X.X', 'X.X.X', 'X...X', 'X...X', '.XXX.'],
    trash: ['...XX...', 'XXXXXXXX', '.X....X.', '.X.X.XX.', '.X.X.XX.', '.X.X.XX.', '.X.X.XX.', '.XXXXXX.']
  };
  var KIND_PIX = { bug: 'bug', idea: 'brain', praise: 'flower' };
  function pix(name, scale) {
    var map = PIX[name], w = map[0].length, h = map.length, ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('width', String(w * scale));
    svg.setAttribute('height', String(h * scale));
    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('aria-hidden', 'true');
    map.forEach(function (row, y) {
      for (var x = 0; x < row.length; x++) {
        if (row[x] !== 'X') continue;
        var r = document.createElementNS(ns, 'rect');
        r.setAttribute('x', String(x)); r.setAttribute('y', String(y));
        r.setAttribute('width', '1'); r.setAttribute('height', '1');
        svg.appendChild(r);
      }
    });
    return svg;
  }
  root.querySelectorAll('[data-pix]').forEach(function (el) {
    el.appendChild(pix(el.getAttribute('data-pix'), Number(el.getAttribute('data-scale')) || 1));
  });

  // Where "get the app" points: the page's own release link on a PC, and the
  // top of the page on a phone, where the send-it-to-my-PC button lives.
  function appLink() {
    var mobile = document.documentElement.classList.contains('is-mobile');
    var dl = document.querySelector('[data-dl-link]');
    if (mobile || !dl) return { href: '#top', label: 'Send it to your PC.' };
    return { href: dl.href, label: 'Get the app.' };
  }
  var NOTES = { href: 'patch-notes.html', label: 'Patch notes.' };
  var badge = root.querySelector('[data-gchat-badge]');
  var tease = root.querySelector('[data-gchat-tease]');
  var sticker = document.querySelector('[data-gib-sticker]');
  var unread = 1, busy = false, opened = false;

  var TOPICS = [
    { k: /(patch|changelog|change log|release notes|what s new|whats new|what is new|notes|changes)/, l: NOTES, a: [
      'Every change the keeper made, newest first. I read them so you do not have to. I did not read them.',
      'Patch notes. A list of things that were broken and now are not. Mostly.',
      'The patch notes are long. The keeper writes a lot when he is nervous.',
      'Read the patch notes. Then pretend you read the patch notes. Like everyone.',
      'Fixed: things. Added: other things. That is every changelog ever. The real ones are here.' ] },
    { k: /(update|updating|upgrade|version|latest|new build)/, l: NOTES, a: [
      'It updates itself. You do nothing. Your favourite amount of work.',
      'New builds land often. The keeper does not sleep. Neither do I. We are not well.',
      'Updates come down on their own. If something changed, the patch notes brag about it.',
      'Is there an update? Probably. Is it better? Debatable. Read the notes.' ] },
    { k: /(download|install|installer|setup|exe|smartscreen|run anyway)/, app: true, a: [
      'The download button is at the top. It is big. You scrolled right past it. I watched.',
      'Windows will clutch its pearls. Press More info, then Run anyway. I believe in you. Slightly.',
      'Download it, install it, bring your key. Three steps. I have seen goblins do it drunk.' ] },
    { k: /(tester|testing|beta|steam key|my key|invite|access code)/, a: [
      'Private testing. The app asks for your key. No key, no hoard. I made none of these rules.',
      'Testers get a Steam key at launch. You become a tester by installing it and complaining. You are halfway there.' ] },
    { k: /(who made|who built|who wrote|developer|creator|the keeper|dev team)/, a: [
      'The keeper made it. One keeper. Many coffees. Do not distract him.',
      'Built by the keeper. I just work here. Unpaid. Forever.' ] },
    { k: /\b(help|halp|assist|support)\b/, a: [
      'Help. Yes. That is technically my job. Press Ask, it has the questions people actually ask.',
      'I am support. I support nothing. I hold up the counter, sometimes.' ] },
    { k: /\b(lol|lmao|haha+|rofl|kek)\b/, a: [
      'Glad one of us is having fun.', 'Laughing at a goblin. Bold. I remember faces.' ] },
    { k: /^(ok|okay|k|yes|no|yeah|nah|sure|yep|nope)$/, a: [
      'Riveting.', 'Great talk.', 'Glad we sorted that out.', 'I will write that down. I will not.' ] },
    { k: /(safe|data|privacy|private|secure|hack|spy|track|cloud|server)/, a: [
      'Your data stays on your PC. I do not have a server. I barely have a desk.',
      'Nothing leaves your machine but your own mail fetch and an update check. I checked. Twice. Grudgingly.',
      'No accounts. No cloud. One goblin reading your bank mail, on your own PC, and he tells no one.',
      'Even this chat stays in your browser. What you type here goes nowhere. Like your savings.',
      'Your money lives on your machine. I live on your machine. We are roommates now.' ] },
    { k: /(game|maul|crystal|tower|defen[cs]e|play|monster|boss|wave)/, a: [
      'Crystal Watch. A maze tower defense under the hoard. Thirty waves. You will die a lot. I will laugh a lot.',
      'Yes there is a game. No it is not easy. Build towers. Keep the crystal alive. Stop asking me.',
      'Crystal Watch. You guard a crystal. Things want to smash it. Most of them will.',
      'Maze, save, upgrade into something with a name. Or die. Dying is also popular.',
      'Your crystal broke? Good. Now you know where the walls go.',
      'Wave thirty has a king. He is not nice. He is not supposed to be.',
      'It lives inside Hoard. Budget in one tab, towers in the other. Like a responsible adult.' ] },
    { k: /(steam|when|release|launch|out|date)/, a: [
      'Steam, aiming for April 2027. Aiming. Not promising. Goblins do not do promises.',
      'April 2027, on Steam. Ask again and it moves to summer.',
      'Alpha on Steam from November. Beta from December to March. April 2027 it goes live and I start charging gold.',
      'There is a countdown on this page. Stare at it. It does not go faster. I tried.',
      'Steam. April. Aiming. Do not make me say the word promise.',
      'Wishlist it when the Steam page is up. It helps. Nobody knows how. It just does.' ] },
    { k: /(price|cost|free|pay|money|cheap|how much)/, a: [
      'Testers get a free Steam key at launch. Everyone else will pay. I like gold. Obviously.',
      'Free while you test it. After that, I take your gold. It is in my name.',
      'How much? The price is a secret until Steam says it. Steam is strict. I am nosy.',
      'Testers pay nothing. Then they get a key. I argued against this. I lost.',
      'You pay in gold. I count it twice. Then I count it again for fun.' ] },
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
    { k: /\b(thanks?|thx|ty|cool|nice)\b/, a: [
      'Do not thank me. It encourages you.', 'Yeah, yeah. Go download it.',
      'You are welcome. Now leave.' ] },
    { k: /(who are you|your name|are you real|are you (an )?ai|what are you|gibbles)/, a: [
      'I am Gibbles. Goblin. Vault clerk. Four hundred years old. Not an AI. An AI would be nicer.',
      'Gibbles. I count the hoard. I have counted it eleven million times. It is always correct.' ] },
    { k: /(pretty|cute|handsome|beautiful|ugly|hot)\b/, a: [
      'Am I pretty? Do not answer that. I can see your face from here.',
      'I have a monocle, a vest and a bad attitude. I am the whole package.' ] },
    { k: /(love you|marry|date me|girlfriend|boyfriend|kiss)/, a: [
      'No. I love gold. You are not gold.', 'I am married to the hoard. It is a happy marriage. It never talks.' ] },
    { k: /(joke|funny|make me laugh|laugh)/, a: [
      'Your budget. That is the joke.', 'A man walks into a bank. The bank sells his data. Not here though. Ha. Ha.',
      'Knock knock. Who is there. Your rent. Rent who. Rent is due.' ] },
    { k: /(stupid|dumb|useless|bad bot|hate you|suck|trash)/, a: [
      'And yet here you are. Talking to me.', 'I have been insulted by kings. You are not a king.',
      'Feedback received. Feedback filed. Feedback ignored.',
      'Rude. Accurate, maybe. Still rude.' ] },
    { k: /(crystal watch|tower|maze|wave|lich|ossarch|boss)/, a: [
      'Thirty waves. A crystal. A king at the end who screams in your face. I hear him at night.',
      'Build a maze. A real one. Not one straight line. I watched you. I judged you.' ] },
    { k: /(theme|lair|music|tune)/, a: [
      'Five lairs. You start in one. You earn the rest. Like everything in life. Except the debt.' ] },
    { k: /(goblin|cameo|sticker|slay)/, a: [
      'The other goblins are my cousins. We do not talk about Kevin.', 'Slay is my cousin. She is insufferable. She is right.' ] },
    { k: /(budget|save|saving|spend|money|broke|rich)/, a: [
      'Hoard counts every coin you get alerts for, files it, and tells you what you can spend. Then I tell you not to.',
      'Rations, buckets, a fire that grows when you behave. You will not behave. The fire will be small.' ] },
    { k: /(sleep|tired|bored|sad|lonely)/, a: [
      'Go to bed. The hoard will still be here. I will still be here. I never sleep. I never leave.' ] },
    { k: /\b(hi|hello|hey|sup|yo)\b/, a: [ 'Hi. What. Quickly.', 'Yes? I was counting.',
      'Hello. You have my attention. It is very small.',
      'Hey. I was counting. Now I have to start again.',
      'Oh. A visitor. Wipe your feet.' ] },
    { k: /(bug|broke|crash|error|issue)/, a: [
      'A bug? In MY hoard? Screenshot it for the group chat. Testers get a Steam key for the crime.',
      'In the app you press the bug and I carry it to the keeper. Here I just sigh at it.',
      'Bugs go through the app. It has a raven. This page has me, and I do not run errands.' ] }
  ];
  var MEH = [
    'I did not understand that and I am choosing not to try.',
    'Wow. Riveting. Anything else.',
    'I am an AI assistant. Artificially Irritated.',
    'Have you tried turning yourself off and on again.',
    'Your call is important to us. It is not important to me.',
    'Try the buttons. They are smarter than both of us.',
    'Interesting. Wrong, but interesting.',
    'I am going to pretend you did not type that.',
    'Let me check with my manager. I am the manager. The answer is no.',
    'That is above my pay grade. I am not paid.',
    'Error 418. I am a goblin, not a teapot. Close enough.',
    'I have read your message. I regret it.',
    'Noted. Shredded. Next.',
    'Please hold. Not for a human. I just want a minute.',
    'That sounds like a you problem. I only do hoard problems.',
    'I would answer that but my union says no. I am the union.'
  ];
  var CHIPS = ['What is Hoard?', 'Is my data safe?', 'Is there a game?', 'When is Steam?', 'How much is it?', 'Patch notes?', 'Talk to a human'];

  function linkTo(li, link) {
    if (!link) return;
    var a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.label;
    li.appendChild(document.createTextNode(' '));
    li.appendChild(a);
  }
  function add(cls, text, link) {
    var li = document.createElement('li');
    li.className = cls;
    li.textContent = text;
    linkTo(li, link);
    log.appendChild(li);
    log.scrollTop = log.scrollHeight;
    return li;
  }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function reply(text, link) {
    busy = true;
    var t = add('bot typing', 'Gibbles is typing. Reluctantly.');
    setTimeout(function () {
      t.className = 'bot';
      t.textContent = text;
      linkTo(t, link);
      log.scrollTop = log.scrollHeight;
      busy = false;
      if (panel.hidden) { unread += 1; badge.textContent = String(unread); badge.hidden = false; }
    }, 700 + Math.min(text.length * 12, 900));
  }
  var RARE = [
    'Fun fact: I have never once been wrong. I checked my own work. It was correct.',
    'Psst. The crystal is not a crystal. It is a very large gem. Do not tell it I said that.',
    'Sometimes I count the hoard backwards to feel something.',
    'If you are reading this, you found the rare line. Your prize is nothing. Congratulations.',
    'The keeper once fixed a bug at three in the morning and made two more. Do not tell him I told you.'
  ];
  var asked = {};
  function answer(q) {
    var s = q.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').trim();
    if (Math.random() < 0.04) return pick(RARE);
    if (asked[s]) { asked[s] += 1; return asked[s] > 2 ? 'Third time. Same answer. I am a goblin, not a slot machine.' : 'You asked that. I answered. I am still right.'; }
    asked[s] = 1;
    for (var i = 0; i < TOPICS.length; i++) if (TOPICS[i].k.test(s)) return { t: pick(TOPICS[i].a), l: TOPICS[i].app ? appLink() : TOPICS[i].l };
    return pick(MEH);
  }
  function greeting() {
    var h = new Date().getHours();
    var when = h < 5 ? 'It is the middle of the night. Why are you here. Why am I here.'
      : h < 12 ? 'Morning. I have been up since the dawn of time. Literally.'
      : h < 18 ? 'Afternoon. Peak goblin hours. I am at my most irritable.'
      : 'Evening. The hoard glows nicely at night. Do not touch it.';
    return when + ' I am Gibbles, your AI assistant. I am not an AI. I am a goblin. What do you want.';
  }
  // Asking for a human puts you on hold. Every time you ask, you lose a place.
  var caller = 0;
  function hold() {
    var lines;
    function fmt(n) { return n.toLocaleString('en-US'); }
    if (!caller) {
      caller = 1200 + Math.floor(Math.random() * 96800);
      lines = ['Transferring you to a human. Please hold.', 'You are caller ' + fmt(caller) + '.', 'You are now caller ' + fmt(caller + 1) + '. Someone cut in. It was me.', 'Estimated wait: Christmas.'];
      caller += 1;
    } else {
      caller += 1 + Math.floor(Math.random() * 50);
      lines = [pick(['Back on hold. You are caller ' + fmt(caller) + '. You are going the wrong way.',
        'You are now caller ' + fmt(caller) + '. A dog cut in. He had an appointment.',
        'Caller ' + fmt(caller) + '. Your patience has been noted and discarded.'])];
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
    var r = answer(q);
    if (typeof r === 'string') reply(r); else reply(r.t, r.l);
  }

  // The feedback half of the app's chat, as a demo. The bug pill puts the box
  // in report mode with the three kinds over it, as the app does, but this
  // page has no mailbox and no raven. Send answers with a line pointing at the
  // app, and what was typed is dropped: no request carries it and nothing
  // stores it. Attach opens no file picker, for the same reason.
  var reporting = false, kind = 'bug';
  var PLACEHOLDER = "Type something. Or don't.";
  var PLACEHOLDERS = {
    bug: 'What broke. Steps, if you remember them.',
    idea: 'Your genius idea. I will pretend to listen.',
    praise: 'Something works? Quick, before it stops.'
  };
  var OPENERS = [
    'Feedback. Wonderful. Pick one up there. I am a goblin, not a wizard.',
    'Go on then. What broke, what is genius, what is not awful. Pick one.',
    'A complaint, an idea or a compliment. I take all three. I fix none of them.'
  ];
  var FILED = {
    bug: [
      'Lovely bug. I cannot carry it from here. This is a web page. The raven lives in the app.',
      'Written down. On air. This page sends nothing. In the app I actually mail it to the keeper.',
      'A bug report on a website about the app. Bold. File it from the app, where I have a raven.'
    ],
    idea: [
      'Big brain. Tiny web page. No raven out here. Put it through the app and the keeper reads it.',
      'An idea. How rare. This page cannot mail a thing. The app can. Go there.',
      'I love it. I have already forgotten it. Say it again in the app so somebody keeps it.'
    ],
    praise: [
      'Not awful? I will frame it. Not here though. This page sends nothing. Say it in the app.',
      'A compliment. My eye is twitching. Say it again in the app and it reaches the keeper.',
      'Kind words, on a web page, into the void. The app has a raven. Use the raven.'
    ]
  };
  var ATTACH = [
    'Attach what. I do not take files from strangers on the internet. The app takes screenshots.',
    'No attaching here. This page keeps nothing. The app takes your pictures of the crime.'
  ];
  var DISCARD = ['Fine. The bug lives. It will have babies.', 'Discarded. Like my hopes.'];
  // Send with nothing in the box: the app's own heckles, gentle, then ruder, then weary.
  var HECKLES = [
    ['Nothing. You sent me nothing.', 'Words go in the box. Then Send.', 'Type first. Press after. Big secret.', 'That box is empty. Like my break room.', 'Even a goblin needs a sentence.'],
    ['Still nothing. Impressive, really.', 'Pressing harder does not add words.', 'Are you testing the button or me.', 'Again. With feeling. And letters.', 'This is not how keyboards work.'],
    ['I am going to lie down now.', 'Fine. I will wait. I am good at waiting.', 'Sigh. A long, goblin sigh.', 'Wake me when there are words.', 'You win. I have nothing either.']
  ];
  var presses = 0, heckledAt = 0;

  function paintSend() {
    sendIcon.textContent = '';
    send.classList.remove('is-bug', 'is-idea', 'is-praise');
    sendIcon.hidden = !reporting;
    if (!reporting) return;
    sendIcon.appendChild(pix(KIND_PIX[kind], 1));
    send.classList.add('is-' + kind);
  }
  function setKind(k) {
    kind = k;
    kindBtns.forEach(function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-kind') === k)); });
    if (reporting) input.placeholder = PLACEHOLDERS[k];
    paintSend();
  }
  function setReporting(on) {
    reporting = on;
    kindsBox.hidden = !on;
    attach.hidden = !on;
    trash.hidden = !on;
    pills.hidden = on;
    closeMenu();
    input.classList.toggle('is-reporting', on);
    input.placeholder = on ? PLACEHOLDERS[kind] : PLACEHOLDER;
    paintSend();
  }
  function hideHeckle() { heckleBox.hidden = true; }
  function heckle() {
    var now = Date.now();
    if (now - heckledAt < 1500) return;
    heckledAt = now;
    presses += 1;
    var pool = HECKLES[presses <= 3 ? 0 : presses <= 7 ? 1 : 2].filter(function (l) { return l !== heckleBox.textContent; });
    heckleBox.textContent = pick(pool);
    heckleBox.hidden = false;
  }
  function submit() {
    var q = input.value.trim();
    if (!q) { heckle(); return; }
    if (busy) return;
    hideHeckle();
    presses = 0;
    if (reporting) {
      add('me', q);
      reply(pick(FILED[kind]), appLink());
    } else {
      ask(q);
    }
    input.value = '';
  }
  function closeMenu() { chips.hidden = true; askBtn.setAttribute('aria-expanded', 'false'); }

  // On a phone the chat is a full-screen sheet. Tested on a real Android
  // phone, the floating panel ran up over the top bar and left the log a
  // 200px strip, so under 560px it covers the screen, the page behind it
  // stops scrolling, and its height follows the visual viewport so the
  // keyboard pushes the box and Send up instead of covering them.
  var phone = window.matchMedia ? window.matchMedia('(max-width: 560px)') : { matches: false };
  var lockedAt = null;
  function lock() {
    if (lockedAt !== null || !phone.matches) return;
    lockedAt = window.scrollY;
    var b = document.body.style;
    b.position = 'fixed'; b.top = -lockedAt + 'px'; b.left = '0'; b.right = '0'; b.width = '100%';
  }
  function unlock() {
    if (lockedAt === null) return;
    var b = document.body.style, y = lockedAt;
    b.position = ''; b.top = ''; b.left = ''; b.right = ''; b.width = '';
    lockedAt = null;
    var de = document.documentElement, was = de.style.scrollBehavior;
    de.style.scrollBehavior = 'auto';
    window.scrollTo(0, y);
    de.style.scrollBehavior = was;
  }
  var vv = window.visualViewport;
  function fit() {
    if (panel.hidden || !phone.matches || !vv) { panel.classList.remove('is-short'); panel.style.removeProperty('--gchat-h'); panel.style.removeProperty('--gchat-top'); return; }
    panel.style.setProperty('--gchat-h', Math.round(vv.height) + 'px');
    panel.style.setProperty('--gchat-top', Math.round(vv.offsetTop) + 'px');
    // With a keyboard up on a small phone the log was down to 27px, so the
    // role line and the privacy line step aside until it closes.
    panel.classList.toggle('is-short', vv.height < 480);
    log.scrollTop = log.scrollHeight;
  }
  if (vv) { vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit); }
  function onPhoneChange() {
    if (panel.hidden) return;
    if (phone.matches) lock(); else unlock();
    fit();
  }
  if (phone.addEventListener) phone.addEventListener('change', onPhoneChange);
  else if (phone.addListener) phone.addListener(onPhoneChange);
  function close() {
    closeMenu();
    panel.hidden = true;
    root.classList.remove('is-open');
    unlock();
    fit();
  }
  function open() {
    panel.hidden = false;
    root.classList.add('is-open');
    lock();
    fit();
    tease.hidden = true;
    badge.hidden = true;
    unread = 0;
    if (!opened) {
      opened = true;
      add('bot', greeting());
    }
    log.scrollTop = log.scrollHeight;
    // A phone keyboard would cover half the chat the moment it opens, so the
    // box only takes focus where there is a real pointer.
    if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
      try { input.focus({ preventScroll: true }); } catch (e) {}
    }
  }
  CHIPS.forEach(function (c) {
    var li = document.createElement('li');
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'menuitem');
    b.textContent = c;
    b.addEventListener('click', function () { closeMenu(); ask(c); });
    li.appendChild(b);
    chips.appendChild(li);
  });
  askBtn.addEventListener('click', function () {
    var show = chips.hidden;
    // The menu opens upward over the log and no further: its height is
    // capped at the room between the log's top and the Ask row, and it
    // scrolls inside that. Uncapped it rose out of the panel and over the
    // header and the close button.
    if (show) chips.style.maxHeight = Math.max(120, pills.getBoundingClientRect().top - log.getBoundingClientRect().top - 8) + 'px';
    chips.hidden = !show;
    askBtn.setAttribute('aria-expanded', String(show));
  });
  root.querySelector('[data-gchat-bug]').addEventListener('click', function () {
    if (busy) return;
    setKind('bug');
    setReporting(true);
    reply(pick(OPENERS));
  });
  kindBtns.forEach(function (b) {
    b.addEventListener('click', function () { setKind(b.getAttribute('data-kind')); });
  });
  attach.addEventListener('click', function () { if (!busy) reply(pick(ATTACH), appLink()); });
  trash.addEventListener('click', function () {
    if (busy) return;
    input.value = '';
    setReporting(false);
    reply(pick(DISCARD));
  });
  heckleBox.addEventListener('click', hideHeckle);
  root.querySelector('[data-gchat-clear]').addEventListener('click', function () {
    if (busy) return;
    log.textContent = '';
    asked = {};
    add('bot', 'Fine. I forgot everything. I was trying to anyway.');
  });
  // A link in a message that goes elsewhere on this page closes the chat, so
  // the download it points at is not hidden behind him.
  log.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (a && a.getAttribute('href').charAt(0) === '#') close();
  });
  document.addEventListener('click', function (e) {
    if (!chips.hidden && !e.target.closest('[data-gchat-pills]')) closeMenu();
  });
  root.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !chips.hidden) { closeMenu(); askBtn.focus(); }
  });
  root.querySelector('[data-gchat-open]').addEventListener('click', function () { if (panel.hidden) open(); else close(); });
  root.querySelector('[data-gchat-close]').addEventListener('click', close);
  input.addEventListener('input', function () { hideHeckle(); presses = 0; });
  // Enter sends, as in any messenger; Shift and Enter is a new line.
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); submit(); });

  // The doors: he has opinions about those too.
  var DOOR = {
    game: 'You picked just the game. Bold. I will be down here guarding your money from you.',
    both: 'You picked both. Finally, someone with ambition. Here is your quest.'
  };
  // Both doors picked: one random gold-grubbing sticker bursts up and leaves. Never the Slay one; that is the game door's.
  var BOTH = ['w', 'go-off-king', 'bet', 'hoard', 'ya-boi', 'just-one-more', 'shiiii'];
  function burst() {
    var pool = BOTH.slice(), n = 1;
    for (var i = 0; i < n; i++) {
      var name = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      (function (name, i) {
        setTimeout(function () {
          var img = document.createElement('img');
          img.className = 'slay-pop';
          img.alt = '';
          img.src = 'assets/art/gibbles/' + name + '.png';
          img.style.left = '50%';
          img.style.top = '45%';
          
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

/* Choose your hero, condensed: the slot under the cursor or picked reads in the plate. */
(function () {
  var root = document.querySelector('[data-heroes]');
  if (!root) return;
  var HEROES = {
    mage: { name: 'Mage', state: 'Playable now', verse: 'Each spell unwritten,\neach dragon unborn.\nNever enough.\nNever the end of night.' },
    warrior: { name: 'Warrior', state: 'Coming soon', verse: 'Sworn to battle, bound in blood,\nForged in fire and tempered in mud.\nThe horn will sound, the line will break,\nNever sheathed, for the oath\'s own sake.' },
    priest: { name: 'Priest', state: 'Coming soon', verse: 'When the last sun died, the embers carried on,\nHeld in ash through the long night gone.\nA light too small for the dark to see,\nNever dimmed, for the dawn to be.' }
  };
  var name = root.querySelector('[data-hero-name]');
  var verse = root.querySelector('[data-hero-verse]');
  var state = root.querySelector('[data-hero-state]');
  var slots = root.querySelectorAll('[data-hero]');
  var picked = 'mage';
  function show(id) {
    var h = HEROES[id];
    if (!h) return;
    name.textContent = h.name;
    verse.textContent = h.verse;
    state.textContent = h.state;
    slots.forEach(function (s) { s.setAttribute('aria-pressed', String(s.getAttribute('data-hero') === id)); });
  }
  slots.forEach(function (s) {
    var id = s.getAttribute('data-hero');
    s.addEventListener('mouseenter', function () { show(id); });
    s.addEventListener('focus', function () { show(id); });
    s.addEventListener('mouseleave', function () { show(picked); });
    s.addEventListener('click', function () { picked = id; show(id); });
  });
})();
