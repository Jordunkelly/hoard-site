(function () {
  var API = 'https://api.github.com/repos/Jordunkelly/hoard-releases/releases';
  var RELEASES_PAGE = 'https://github.com/Jordunkelly/hoard-releases/releases';
  var CACHE_KEY = 'hoard-patch-notes';
  // GitHub allows 60 anonymous API calls an hour per IP, and the home page
  // already spends one on every visit. Ten minutes of cache keeps a reader
  // clicking back and forth from burning through the rest.
  var CACHE_MS = 10 * 60 * 1000;
  var PER_PAGE = 100;
  var MAX_PAGES = 10;

  var list = document.querySelector('[data-notes-list]');
  var status = document.querySelector('[data-notes-status]');
  if (!list || !status) return;

  function readCache() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var c = JSON.parse(raw);
      if (!c || !Array.isArray(c.rels) || Date.now() - c.t > CACHE_MS) return null;
      return c.rels;
    } catch (e) { return null; }
  }
  function writeCache(rels) {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), rels: rels })); } catch (e) {}
  }

  // Only the fields the page renders, so the cache stays small.
  function slim(r) {
    return { tag: r.tag_name || '', name: r.name || '', date: r.published_at || r.created_at || '', body: r.body || '', url: r.html_url || '', pre: !!r.prerelease };
  }

  function fetchAll() {
    var out = [];
    function page(n) {
      return fetch(API + '?per_page=' + PER_PAGE + '&page=' + n, { headers: { Accept: 'application/vnd.github+json' } })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (rows) {
          if (!Array.isArray(rows)) throw new Error('Unexpected reply');
          rows.forEach(function (r) { if (!r.draft) out.push(slim(r)); });
          if (rows.length === PER_PAGE && n < MAX_PAGES) return page(n + 1);
          return out;
        });
    }
    return page(1);
  }

  // Newest first by version number, not by upload time, so a re-published
  // old build does not jump to the top. Date breaks a tie.
  function parts(tag) {
    var m = String(tag).match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
    return m ? [+m[1], +(m[2] || 0), +(m[3] || 0)] : null;
  }
  function byVersion(a, b) {
    var pa = parts(a.tag), pb = parts(b.tag);
    if (pa && pb) {
      for (var i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pb[i] - pa[i];
    } else if (pa || pb) {
      return pa ? -1 : 1;
    }
    return String(b.date).localeCompare(String(a.date));
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Runs on text that is already escaped. Links are kept only when they point
  // at github.com; anything else is shown as its label, so a note cannot carry
  // a reader off to somewhere nobody checked.
  function inline(s) {
    s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/__([^_]+)__/g, '<b>$1</b>');
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (all, label, href) {
      var raw = href.replace(/&amp;/g, '&');
      if (/^https:\/\/github\.com\//i.test(raw)) return '<a href="' + href + '" rel="noopener">' + label + '</a>';
      return label;
    });
    return s;
  }

  function kindOf(heading) {
    var h = heading.toLowerCase();
    if (/fix|bug/.test(h)) return 'fixes';
    if (/feature|new|added|add/.test(h)) return 'features';
    return '';
  }

  // The release script writes "Hoard v1.7.6: summary" as the body. The
  // version is already in the card header, so that prefix is dropped.
  function trimPrefix(body, tag) {
    var t = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return body.replace(new RegExp('^\\s*Hoard\\s+' + t + '\\s*:?\\s*', 'i'), '');
  }

  function renderBody(body) {
    var lines = body.replace(/\r\n?/g, '\n').split('\n');
    var html = '';
    var inList = false;
    var inSection = false;
    function closeList() { if (inList) { html += '</ul>'; inList = false; } }
    function closeSection() { closeList(); if (inSection) { html += '</section>'; inSection = false; } }
    lines.forEach(function (line) {
      var t = line.trim();
      if (!t) { closeList(); return; }
      var h = t.match(/^#{1,6}\s+(.*)$/);
      if (h) {
        closeSection();
        var kind = kindOf(h[1]);
        var label = kind === 'fixes' ? 'Fixes' : kind === 'features' ? 'Features' : inline(esc(h[1].replace(/#+\s*$/, '')));
        html += '<section class="note-group' + (kind ? ' is-' + kind : '') + '"><h3>' + label + '</h3>';
        inSection = true;
        return;
      }
      var b = t.match(/^[-*+]\s+(.*)$/);
      if (b) {
        if (!inList) { html += '<ul>'; inList = true; }
        html += '<li>' + inline(esc(b[1])) + '</li>';
        return;
      }
      closeList();
      html += '<p>' + inline(esc(t)) + '</p>';
    });
    closeSection();
    return html;
  }

  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function render(rels) {
    rels.sort(byVersion);
    if (!rels.length) {
      status.innerHTML = 'No releases yet. <a href="' + RELEASES_PAGE + '">Check GitHub</a>.';
      return;
    }
    status.textContent = rels.length + (rels.length === 1 ? ' release.' : ' releases.');
    // Only the newest build gets the animated gold tag the home page uses;
    // eleven of them sweeping at once is a busy screen.
    list.innerHTML = rels.map(function (r, i) {
      var id = r.tag.replace(/[^A-Za-z0-9._-]/g, '');
      var body = trimPrefix(r.body, r.tag).trim();
      var notes = body ? renderBody(body) : '<p class="note-empty">No notes for this one.</p>';
      var link = /^https:\/\/github\.com\//.test(r.url) ? ' <a class="note-link" href="' + esc(r.url) + '" rel="noopener">On GitHub</a>' : '';
      return '<li class="note panel"' + (id ? ' id="' + id + '"' : '') + '>' +
        '<div class="note-head">' +
          '<span class="' + (i === 0 ? 'ver-tag' : 'note-ver') + '">' + esc(r.tag || r.name) + '</span>' +
          (r.pre ? '<span class="note-pre">Pre-release</span>' : '') +
          '<time datetime="' + esc(r.date) + '">' + esc(fmtDate(r.date)) + '</time>' +
          link +
        '</div>' +
        '<div class="note-body">' + notes + '</div>' +
      '</li>';
    }).join('');
    if (location.hash) {
      var target = document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    }
  }

  function fail() {
    status.innerHTML = 'GitHub is not answering right now, so the notes could not load. ' +
      '<a href="' + RELEASES_PAGE + '">Read them on the releases page</a>, or try again in a few minutes.';
    status.classList.add('is-error');
  }

  var cached = readCache();
  if (cached) { render(cached); return; }
  if (!window.fetch) { fail(); return; }
  fetchAll().then(function (rels) { writeCache(rels); render(rels); }).catch(fail);
})();
