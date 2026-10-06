/* Galeri gambar: klik gambar untuk buka paparan besar, boleh ke gambar seterusnya/sebelumnya
   dalam satu kumpulan (data-galeri="nama"). Papan kekunci, leret (swipe) dan butang disokong.
   Tanpa JS, pautan membuka gambar penuh seperti biasa. */
(function () {
  "use strict";
  var pautan = Array.prototype.slice.call(document.querySelectorAll("a[data-galeri]"));
  if (!pautan.length) return;
  var akar = document.documentElement;
  var T = window.T || function (ms) { return ms; };
  var kumpulan = {};
  pautan.forEach(function (a) { var g = a.getAttribute("data-galeri"); (kumpulan[g] = kumpulan[g] || []).push(a); });

  var kotak, img, kira, bTutup, bPrev, bNext, senarai = [], idx = 0, pemicu = null, tutupMasa = 0;

  var IKON = {
    tutup: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    kiri: '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M14.5 5l-7 7 7 7"/></svg>',
    kanan: '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M9.5 5l7 7-7 7"/></svg>'
  };

  function bina() {
    if (kotak) return;
    kotak = document.createElement("div");
    kotak.className = "cahaya";
    kotak.setAttribute("role", "dialog");
    kotak.setAttribute("aria-modal", "true");
    kotak.hidden = true;
    kotak.innerHTML =
      '<button type="button" class="cahaya-btn cahaya-tutup">' + IKON.tutup + '</button>' +
      '<button type="button" class="cahaya-btn cahaya-nav cahaya-prev">' + IKON.kiri + '</button>' +
      '<figure class="cahaya-rajah"><img alt=""><figcaption class="cahaya-kira" aria-live="polite"></figcaption></figure>' +
      '<button type="button" class="cahaya-btn cahaya-nav cahaya-next">' + IKON.kanan + '</button>';
    document.body.appendChild(kotak);
    img = kotak.querySelector("img");
    kira = kotak.querySelector(".cahaya-kira");
    bTutup = kotak.querySelector(".cahaya-tutup");
    bPrev = kotak.querySelector(".cahaya-prev");
    bNext = kotak.querySelector(".cahaya-next");

    bTutup.addEventListener("click", tutup);
    bPrev.addEventListener("click", function () { pergi(-1); });
    bNext.addEventListener("click", function () { pergi(1); });
    // Ketik gambar = gambar seterusnya; ketik latar gelap = tutup
    img.addEventListener("click", function () { pergi(1); });
    kotak.addEventListener("click", function (e) { if (e.target === kotak || e.target.classList.contains("cahaya-rajah")) tutup(); });

    // Leret kiri/kanan di telefon
    var x0 = 0, y0 = 0;
    kotak.addEventListener("touchstart", function (e) { var t = e.changedTouches[0]; x0 = t.clientX; y0 = t.clientY; }, { passive: true });
    kotak.addEventListener("touchend", function (e) {
      var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) pergi(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  function label() {
    bTutup.setAttribute("aria-label", T("Tutup", "Close"));
    bPrev.setAttribute("aria-label", T("Gambar sebelumnya", "Previous image"));
    bNext.setAttribute("aria-label", T("Gambar seterusnya", "Next image"));
    kotak.setAttribute("aria-label", T("Galeri gambar", "Image gallery"));
  }

  function muatDahulu(n) {
    var a = senarai[(idx + n + senarai.length) % senarai.length];
    if (a) { var i = new Image(); i.src = a.getAttribute("href"); }
  }

  function papar() {
    var a = senarai[idx], kecil = a.querySelector("img"), url = a.href;
    img.alt = kecil ? kecil.alt : "";
    kira.textContent = (idx + 1) + " / " + senarai.length;
    img.classList.remove("masuk");
    var tunjuk = function () { img.classList.add("masuk"); };
    if (img.src === url && img.complete) tunjuk();
    else { img.onload = tunjuk; img.onerror = tunjuk; img.src = url; }
    muatDahulu(1); muatDahulu(-1);
  }

  function pergi(d) {
    if (senarai.length < 2) return;
    idx = (idx + d + senarai.length) % senarai.length;
    papar();
  }

  function buka(a) {
    bina(); label();
    clearTimeout(tutupMasa);
    senarai = kumpulan[a.getAttribute("data-galeri")];
    idx = senarai.indexOf(a);
    pemicu = a;
    var banyak = senarai.length > 1;
    bPrev.hidden = bNext.hidden = !banyak;
    kira.hidden = !banyak;
    papar();
    kotak.hidden = false;
    akar.classList.add("kunci-skrol");
    void kotak.offsetWidth;            // paksa reka letak supaya peralihan fade berjalan
    kotak.classList.add("buka");
    bTutup.focus({ preventScroll: true });
    document.addEventListener("keydown", kekunci);
  }

  function tutup() {
    if (!kotak || kotak.hidden) return;
    document.removeEventListener("keydown", kekunci);
    kotak.classList.remove("buka");
    akar.classList.remove("kunci-skrol");
    var selesai = function () { kotak.hidden = true; img.removeAttribute("src"); img.classList.remove("masuk"); };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) selesai(); else tutupMasa = setTimeout(selesai, 300);
    if (pemicu) pemicu.focus({ preventScroll: true });
  }

  function kekunci(e) {
    if (e.key === "Escape") { e.preventDefault(); tutup(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); pergi(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); pergi(-1); }
    else if (e.key === "Tab") {
      // Kunci fokus dalam paparan
      var btn = [bTutup, bPrev, bNext].filter(function (b) { return !b.hidden; });
      var i = btn.indexOf(document.activeElement);
      e.preventDefault();
      btn[(i + (e.shiftKey ? -1 : 1) + btn.length) % btn.length].focus();
    }
  }

  pautan.forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;   // biar pengguna buka di tab baharu jika mahu
      e.preventDefault();
      buka(a);
    });
  });
})();
