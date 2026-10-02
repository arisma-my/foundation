/* ARISMA Foundation: bahasa, menu, video, gerakan teks, penjejak ringkas */
(function () {
  "use strict";
  var akar = document.documentElement;
  var kurang = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Bahasa ---------- */
  function tetapBahasa(b) {
    b = b === "en" ? "en" : "ms";
    akar.setAttribute("data-b", b);
    akar.setAttribute("lang", b);
    try { localStorage.setItem("bahasa", b); } catch (e) {}
    document.dispatchEvent(new CustomEvent("bahasa", { detail: b }));
  }
  window.T = function (ms, en) { return akar.getAttribute("data-b") === "en" ? en : ms; };
  var bb = document.getElementById("bahasa");
  if (bb) bb.addEventListener("click", function () { tetapBahasa(akar.getAttribute("data-b") === "en" ? "ms" : "en"); });

  /* ---------- Menu mudah alih ---------- */
  var mb = document.getElementById("menuBtn"), nav = document.getElementById("nav");
  if (mb && nav) {
    mb.addEventListener("click", function () {
      var buka = mb.getAttribute("aria-expanded") !== "true";
      mb.setAttribute("aria-expanded", String(buka));
      nav.classList.toggle("buka", buka);
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { mb.setAttribute("aria-expanded", "false"); nav.classList.remove("buka"); }
    });
  }

  /* ---------- Submenu mudah alih ---------- */
  Array.prototype.forEach.call(document.querySelectorAll(".sub-btn"), function (b) {
    b.addEventListener("click", function () {
      var li = b.parentElement, buka = !li.classList.contains("buka-sub");
      li.classList.toggle("buka-sub", buka);
      b.setAttribute("aria-expanded", String(buka));
    });
  });

  /* ---------- Fail pilihan: papar hanya jika fail wujud (laporan PDF, kod QR) ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-jika-ada]"), function (el) {
    var u = el.getAttribute("data-jika-ada");
    fetch(u, { method: "HEAD", cache: "no-store" }).then(function (r) {
      if (!r.ok || /text\/html/.test(r.headers.get("content-type") || "")) return;
      el.classList.add("ada");
      Array.prototype.forEach.call(el.querySelectorAll("[data-pautan]"), function (a) { a.href = u; });
      Array.prototype.forEach.call(el.querySelectorAll("[data-gambar]"), function (i) { i.src = u; });
    }).catch(function () {});
  });

  /* ---------- Pecah ayat kepada perkataan ---------- */
  function pecah(el) {
    if (el.getAttribute("data-dipecah")) return;
    el.setAttribute("data-dipecah", "1");
    var kira = {}, nod = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    while (w.nextNode()) nod.push(w.currentNode);
    nod.forEach(function (n) {
      if (!n.nodeValue.trim()) return;
      var l = n.parentElement.closest("[lang]");
      var kunci = l && el.contains(l) ? l.getAttribute("lang") : "_";
      var frag = document.createDocumentFragment();
      n.nodeValue.split(/(\s+)/).forEach(function (k) {
        if (!k) return;
        if (/^\s+$/.test(k)) { frag.appendChild(document.createTextNode(k)); return; }
        var s = document.createElement("span");
        s.className = "p-k";
        s.textContent = k;
        kira[kunci] = kira[kunci] || 0;
        s.style.setProperty("--i", kira[kunci]++);
        frag.appendChild(s);
      });
      n.parentNode.replaceChild(frag, n);
    });
  }
  window.Pecah = pecah;

  /* ---------- Muncul ketika skrol ---------- */
  function indeks(el) {
    var p = el.parentElement, i = 0;
    if (!p) return 0;
    for (var c = p.firstElementChild; c && c !== el; c = c.nextElementSibling) if (c.hasAttribute("data-muncul")) i++;
    return i;
  }
  var pemerhati = "IntersectionObserver" in window && !kurang
    ? new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("nampak"); pemerhati.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" })
    : null;
  window.Muncul = function (akarEl) {
    Array.prototype.forEach.call((akarEl || document).querySelectorAll("[data-pecah],[data-muncul]"), function (el) {
      if (el.hasAttribute("data-pecah")) pecah(el);
      if (el.hasAttribute("data-muncul") && !el.style.getPropertyValue("--i")) el.style.setProperty("--i", indeks(el));
      if (el.getAttribute("data-pecah") === "manual" || el.getAttribute("data-muncul") === "manual") return;
      if (pemerhati) pemerhati.observe(el); else el.classList.add("nampak");
    });
  };
  window.Muncul();

  /* ---------- Video logo (laman utama) ---------- */
  var v = document.getElementById("introVid"), heroTeks = document.getElementById("heroTeks");
  function bukaHero() {
    if (!heroTeks || heroTeks.getAttribute("data-dibuka")) return;
    heroTeks.setAttribute("data-dibuka", "1");
    Array.prototype.forEach.call(heroTeks.querySelectorAll('[data-pecah="manual"],[data-muncul="manual"]'), function (el) { el.classList.add("nampak"); });
  }
  if (v) {
    var pentas = v.closest(".pentas"), ulang = document.getElementById("mainSemula"), bunyi = document.getElementById("bunyiBtn");
    // Jika video tidak dapat dimainkan, tunjuk bingkai poster sebagai gambar
    var hilang = function () {
      if (pentas && !pentas.querySelector("img")) {
        var img = document.createElement("img");
        img.src = v.getAttribute("poster"); img.alt = "ARISMA Foundation";
        v.replaceWith(img);
        var c = pentas.querySelector(".pentas-ctl"); if (c) c.hidden = true;
      }
      bukaHero();
    };
    v.addEventListener("error", hilang, true);
    if (kurang) { v.removeAttribute("autoplay"); v.pause(); bukaHero(); }
    v.addEventListener("timeupdate", function () { if (v.currentTime > 5) bukaHero(); });
    v.addEventListener("ended", bukaHero);
    setTimeout(bukaHero, 6500);
    if (ulang) ulang.addEventListener("click", function () { v.currentTime = 0; v.play(); });
    if (bunyi) bunyi.addEventListener("click", function () {
      v.muted = !v.muted;
      bunyi.querySelector('[lang="ms"]').textContent = v.muted ? "Hidupkan bunyi" : "Matikan bunyi";
      bunyi.querySelector('[lang="en"]').textContent = v.muted ? "Sound on" : "Sound off";
      if (!v.muted && v.paused) v.play();
    });
  } else bukaHero();

  /* ---------- Data kutipan ---------- */
  window.RM = function (n) { return "RM" + Math.round(n).toLocaleString("en-MY"); };
  var cacheKutipan = {};
  window.Kutipan = function (projek) {
    if (!cacheKutipan[projek]) {
      cacheKutipan[projek] = fetch("/api/kutipan?projek=" + encodeURIComponent(projek))
        .then(function (r) { if (!r.ok) throw 0; return r.json(); });
    }
    return cacheKutipan[projek];
  };
  function isiBar(bar, pct) {
    bar.setAttribute("aria-valuenow", String(Math.round(pct)));
    var i = bar.firstElementChild;
    if (kurang) { i.style.width = pct + "%"; return; }
    var o = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { requestAnimationFrame(function () { i.style.width = pct + "%"; }); o.disconnect(); }
    }, { threshold: 0.5 });
    o.observe(bar);
  }
  window.IsiBar = isiBar;

  // Ringkasan kecil pada kad projek: <div data-ringkas="degup2027">
  Array.prototype.forEach.call(document.querySelectorAll("[data-ringkas]"), function (el) {
    window.Kutipan(el.getAttribute("data-ringkas")).then(function (j) {
      if (!j.ok) return;
      el.querySelector("[data-jumlah]").textContent = window.RM(j.terkumpul);
      var bar = el.querySelector("[role=progressbar]");
      if (bar && j.sasaran) isiBar(bar, Math.min(100, (j.terkumpul / j.sasaran) * 100));
      var bil = el.querySelector("[data-bilangan]");
      if (bil) bil.textContent = j.sumbangan.toLocaleString("en-MY");
      el.hidden = false;
    }).catch(function () {});
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-tahun]"), function (e) { e.textContent = new Date().getFullYear(); });
  akar.classList.add("sedia");
})();
