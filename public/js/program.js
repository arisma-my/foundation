/* Halaman Program & Acara: tab (kandungan bertukar di tempat, tanpa skrol).
   Tanpa JS, semua bahagian dipaparkan bersusun, jadi tiada kandungan yang tersembunyi. */
(function () {
  "use strict";
  var bar = document.querySelector(".tab-bar");
  if (!bar) return;
  var kurang = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var kepala = document.querySelector(".kepala");
  // Matikan "scroll anchoring" pelayar di halaman ini: bila panel bertukar tinggi, pelayar tidak patut menganjak skrol sendiri
  document.documentElement.style.overflowAnchor = "none";
  var tab = Array.prototype.slice.call(bar.querySelectorAll('[role="tab"]'));
  var panel = {};
  tab.forEach(function (t) { panel[t.getAttribute("aria-controls")] = document.getElementById(t.getAttribute("aria-controls")); });

  function pilih(id, opsyen) {
    if (!panel[id]) return false;
    opsyen = opsyen || {};
    tab.forEach(function (t) {
      var kod = t.getAttribute("aria-controls"), hidup = kod === id;
      t.setAttribute("aria-selected", String(hidup));
      t.tabIndex = hidup ? 0 : -1;
      panel[kod].classList.toggle("aktif", hidup);
      panel[kod].hidden = !hidup;
      if (hidup && opsyen.fokus) t.focus();
      // Bar boleh dileret di telefon: pastikan tab terpilih sentiasa kelihatan (hanya menggerakkan bar, bukan halaman)
      if (hidup && bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: t.offsetLeft - (bar.clientWidth - t.offsetWidth) / 2, behavior: kurang ? "auto" : "smooth" });
    });
    // Skrol ke bar tab hanya bila datang dari pautan (menu atau URL #...), tidak bila menekan tab itu sendiri
    if (opsyen.skrol) bar.scrollIntoView({ block: "start", behavior: kurang ? "auto" : "smooth" });
    return true;
  }

  // Selepas tukar tab: jika permulaan kandungan baharu terlindung di bawah header/bar yang melekat
  // (pengguna sudah skrol jauh), letakkan ia betul-betul di bawah bar supaya tak perlu skrol ke atas.
  function sejajar(id) {
    var tetap = (kepala ? kepala.offsetHeight : 72) + bar.offsetHeight, atas = panel[id].getBoundingClientRect().top;
    if (atas < tetap) window.scrollTo({ top: window.pageYOffset + atas - tetap - 8, behavior: "instant" });
  }

  tab.forEach(function (t, i) {
    t.addEventListener("click", function () {
      var id = t.getAttribute("aria-controls");
      pilih(id); sejajar(id);
      // replaceState tidak menyebabkan halaman melompat (berbeza daripada location.hash = ...)
      if (history.replaceState) history.replaceState(null, "", "#" + id);
    });
    t.addEventListener("keydown", function (e) {
      var k = e.key, n = tab.length, ke = -1;
      if (k === "ArrowRight") ke = (i + 1) % n;
      else if (k === "ArrowLeft") ke = (i - 1 + n) % n;
      else if (k === "Home") ke = 0;
      else if (k === "End") ke = n - 1;
      if (ke < 0) return;
      e.preventDefault();
      var id = tab[ke].getAttribute("aria-controls");
      pilih(id, { fokus: true }); sejajar(id);
      if (history.replaceState) history.replaceState(null, "", "#" + id);
    });
  });

  // Pautan menu (Program & Acara > Siri OKU Berdoa, dll.) dan URL berhash
  window.addEventListener("hashchange", function () { pilih(location.hash.slice(1), { skrol: true }); });
  var awal = location.hash.slice(1);
  if (!pilih(awal, { skrol: !!panel[awal] })) pilih(tab[0].getAttribute("aria-controls"));
})();
