/* SoundLoop: navigation, drawer, find-track demo. Needs js/data.js loaded first. */
(function () {
  var ICON = '<svg><use href="#i-note"/></svg>';
  var DATA = window.SOUNDLOOP_DATA.tracks;
  var HISTORY = window.SOUNDLOOP_DATA.history;
  var DEMO_FOUND = window.SOUNDLOOP_DATA.demoFound;
  var NAMES = window.SOUNDLOOP_DATA.names;
  var CHROME = {
    splash: ["#FFFFFF","#FFFFFF"], signin: ["#F7CE4D","#F7CE4D"], find: ["#F7CE4D","#0B0B0C"],
    trends: ["#F7CE4D","#FFFFFF"], music: ["#F7CE4D","#FFFFFF"], playlist: ["#F7CE4D","#0B0B0C"],
    profile: ["#0B0B0C","#0B0B0C"], about: ["#FFFFFF","#FFFFFF"]
  };
  var TOKENS = ["splash","signin","find","trends","music","playlist","profile","about"];

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  var current = "", currentList = "p1", splashTimer = 0, findTimer = 0, toastTimer = 0, lastFound = null;

  function store(key, val) { try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) {} return null; }

  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  /* ---------- renderers ---------- */
  function rankCard(title, list) {
    return '<section class="card" aria-label="' + esc(title) + '"><div class="card-head" style="pointer-events:none">' + esc(title) + '</div><div class="card-body">' +
      list.map(function (t, i) { return '<div class="rank"><span class="n">' + (i + 1) + '</span><span class="t">' + esc(t[0]) + ' <i>' + esc(t[1]) + '</i></span></div>'; }).join("") +
      '</div></section>';
  }
  function coverCard(key) {
    var list = DATA[key];
    var rows = list.length ? list.slice(0, 5).map(function (t, i) {
      return '<div class="row"><span class="cover">' + ICON + '</span><span class="t">' + esc(t[0]) + '<i>' + esc(t[1]) + '</i></span><span class="n">' + (i + 1) + '</span></div>';
    }).join("") : '<p class="empty">No tracks yet. Find one and add it here.</p>';
    return '<section class="card"><button class="card-head" type="button" data-playlist="' + key + '" aria-label="Open ' + esc(NAMES[key]) + '">' + esc(NAMES[key]) + '</button><div class="card-body">' + rows + '</div></section>';
  }
  function renderTrends() { $("#trends-cards").innerHTML = rankCard("POP", DATA.pop.slice(0, 5)) + rankCard("Classic", DATA.classic.slice(0, 5)); }
  function renderMusic() { $("#music-cards").innerHTML = coverCard("favorite") + coverCard("p1") + coverCard("p2"); }
  function renderPlaylist() {
    $("#pl-title").textContent = NAMES[currentList];
    var list = DATA[currentList];
    $("#pl-list").innerHTML = list.length ? list.map(function (t, i) {
      return '<li class="row"><span class="cover">' + ICON + '</span><span class="t">' + esc(t[0]) + '<i>' + esc(t[1]) + '</i></span><span class="n">' + (i + 1) + '</span></li>';
    }).join("") : '<li class="empty">No tracks yet.</li>';
  }
  function renderProfile() {
    var f = DATA.favorite, html = "";
    for (var i = 0; i < 4; i++) {
      html += f[i] ? '<div class="fav-slot">' + ICON + '<span>' + esc(f[i][0]) + '</span></div>' : '<div class="fav-slot empty-slot" aria-label="Empty slot"></div>';
    }
    $("#fav-grid").innerHTML = html;
  }
  function renderHistory() {
    $("#history-list").innerHTML = HISTORY.map(function (t, i) {
      return '<div class="row"><span class="cover">' + ICON + '</span><span class="t">' + esc(t[0]) + '<i>' + esc(t[1]) + '</i></span><span class="n">' + (i + 1) + '</span></div>';
    }).join("");
  }

  /* ---------- navigation ---------- */
  function show(name, fromHash) {
    if (TOKENS.indexOf(name) < 0) name = "splash";
    clearTimeout(splashTimer);
    closeDrawer();
    current = name;
    $("#app").toggleAttribute("data-bare", name === "splash" || name === "signin");
    $$("[data-screen]").forEach(function (s) { s.hidden = s.getAttribute("data-screen") !== name; });
    var c = CHROME[name];
    document.documentElement.style.setProperty("--chrome-top", c[0]);
    document.documentElement.style.setProperty("--chrome-bottom", c[1]);
    $$("#menu button").forEach(function (b) {
      var on = b.getAttribute("data-go") === (name === "playlist" ? "music" : name);
      if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    if (name === "trends") renderTrends();
    if (name === "music") renderMusic();
    if (name === "playlist") renderPlaylist();
    if (name === "profile") renderProfile();
    if (name === "find") { renderHistory(); setTab("music"); }
    if (name === "splash") {
      var bar = $(".progress i"); bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = "";
      splashTimer = setTimeout(function () { if (current === "splash") go("signin"); }, 2600);
    }
    window.scrollTo(0, 0);
    if (!fromHash) { try { if (location.hash !== "#" + name) location.hash = name; } catch (e) {} }
  }
  function go(name) { show(name); }

  /* ---------- drawer ---------- */
  var lastFocus = null;
  function openDrawer() { lastFocus = document.activeElement; $("#drawer-wrap").classList.add("open"); setTimeout(function () { $("#drawer-close").focus(); }, 50); }
  function closeDrawer() {
    var w = $("#drawer-wrap");
    if (!w.classList.contains("open")) return;
    w.classList.remove("open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- find track ---------- */
  function setTab(tab) {
    $$(".tab").forEach(function (t) { t.setAttribute("aria-selected", String(t.getAttribute("data-tab") === tab)); });
    $("#pane-music").hidden = tab !== "music";
    $("#pane-history").hidden = tab !== "history";
  }
  function startListening() {
    var btn = $("#find-btn");
    if (btn.classList.contains("listening")) return;
    btn.classList.add("listening");
    $("#result").hidden = true;
    $("#status").textContent = "Listening…";
    clearTimeout(findTimer);
    findTimer = setTimeout(function () {
      btn.classList.remove("listening");
      lastFound = DEMO_FOUND[Math.floor(Math.random() * DEMO_FOUND.length)];
      $("#res-title").textContent = lastFound[0];
      $("#res-artist").textContent = lastFound[1];
      var add = $("#res-add"); add.disabled = false; add.textContent = "Add to Favorite";
      $("#result").hidden = false;
      $("#status").textContent = "Found a match";
      HISTORY.unshift(lastFound); HISTORY = HISTORY.slice(0, 8); renderHistory();
    }, 2600);
  }
  function addFavorite() {
    if (!lastFound) return;
    var dup = DATA.favorite.some(function (t) { return t[0] === lastFound[0]; });
    if (!dup) DATA.favorite.unshift(lastFound);
    var add = $("#res-add"); add.disabled = true; add.textContent = "Added to Favorite";
    toast(dup ? "Already in Favorite" : "Added to Favorite");
  }

  /* ---------- events ---------- */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-go],[data-drawer],[data-playlist],[data-tab]");
    if (!el) return;
    if (el.hasAttribute("data-drawer")) { openDrawer(); return; }
    if (el.hasAttribute("data-playlist")) { currentList = el.getAttribute("data-playlist"); go("playlist"); return; }
    if (el.hasAttribute("data-tab")) { setTab(el.getAttribute("data-tab")); return; }
    go(el.getAttribute("data-go"));
  });
  $("#scrim").addEventListener("click", closeDrawer);
  $("#drawer-close").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });
  $("#find-btn").addEventListener("click", startListening);
  $("#res-add").addEventListener("click", addFavorite);
  $("#signin-form").addEventListener("submit", function (e) { e.preventDefault(); go("find"); });
  $("#forgot").addEventListener("click", function () { toast("Password reset is not part of this demo"); });
  $("#create").addEventListener("click", function () { toast("Registration is not part of this demo"); });
  var un = $("#username");
  var saved = store("sl-username"); if (saved) un.value = saved;
  un.addEventListener("input", function () { store("sl-username", un.value); });
  window.addEventListener("hashchange", function () {
    var h = location.hash.replace("#", "");
    if (h && h !== current && TOKENS.indexOf(h) > -1) show(h, true);
  });

  var start = location.hash.replace("#", "");
  show(TOKENS.indexOf(start) > -1 && start !== "playlist" ? start : "splash", true);
})();
