/* Halaman kempen DEGUP: ringkasan, item yang boleh ditaja, sumbangan terkini, kongsi */
(function () {
  "use strict";
  var PROJEK = "degup2027";
  var T = window.T, RM = window.RM;
  var data = null, konfig = null, penapis = "semua";

  function el(tag, kelas, teks) { var e = document.createElement(tag); if (kelas) e.className = kelas; if (teks != null) e.textContent = teks; return e; }
  function dwi(ms, en) {
    var f = document.createDocumentFragment(), a = el("span", null, ms), b = el("span", null, en);
    a.setAttribute("lang", "ms"); b.setAttribute("lang", "en"); f.appendChild(a); f.appendChild(b); return f;
  }
  var KEUTAMAAN = { tinggi: ["Tinggi", "High"], sederhana: ["Sederhana", "Medium"], rendah: ["Rendah", "Low"] };

  /* ---------- Ringkasan ---------- */
  function ringkasan() {
    var s = data.sasaran, t = data.terkumpul, pct = s ? (t / s) * 100 : 0;
    document.querySelectorAll("[data-k=terkumpul]").forEach(function (e) { e.textContent = RM(t); });
    document.querySelectorAll("[data-k=sasaran]").forEach(function (e) { e.textContent = RM(s); });
    document.querySelector("[data-k=peratus]").textContent = (pct > 0 && pct < 10 ? pct.toFixed(1) : Math.round(pct)) + "%";
    document.querySelector("[data-k=baki]").textContent = RM(Math.max(0, s - t));
    document.querySelector("[data-k=penderma]").textContent = data.sumbangan.toLocaleString("en-MY");
    document.querySelector("[data-k=purata]").textContent = data.sumbangan ? RM(data.purata) : "–";
    window.IsiBar(document.getElementById("barUtama"), Math.min(100, pct));
    // Tukar tajuk sandaran kepada tajuk berangka, kemudian mainkan semula gerakan
    var asal = document.getElementById("tajukAsal"), wang = document.getElementById("tajukWang");
    if (asal && wang && t > 0) { asal.hidden = true; wang.hidden = false; window.Pecah(wang); requestAnimationFrame(function () { wang.classList.add("nampak"); }); }
  }

  /* ---------- Item ---------- */
  function kad(id, it, kut) {
    var a = el("article", "item");
    a.setAttribute("data-keutamaan", it ? it.keutamaan : "am");
    var atas = el("div", "atas"), h = el("h3");
    if (it) {
      h.appendChild(dwi(it.ms, it.en));
      var l = el("span", "lencana"), d = el("span", "titik-warna t-" + it.keutamaan);
      l.appendChild(d); l.appendChild(dwi(KEUTAMAAN[it.keutamaan][0], KEUTAMAAN[it.keutamaan][1]));
      atas.appendChild(h); atas.appendChild(l);
    } else {
      a.className += " am";
      h.appendChild(dwi("Di mana paling diperlukan", "Where it’s needed most"));
      atas.appendChild(h);
    }
    a.appendChild(atas);
    var ket = el("p", "ket");
    ket.appendChild(it ? dwi(it.ket_ms, it.ket_en) : dwi("Tidak pasti nak pilih? Yayasan akan salurkan kepada item yang paling memerlukan.", "Not sure which to choose? The Foundation will direct it to the item most in need."));
    a.appendChild(ket);

    var terkumpul = kut ? kut.terkumpul : 0, bil = kut ? kut.penyumbang : 0;
    var j = el("p", "jumlah", RM(terkumpul));
    if (it) { var sm = el("small"); sm.appendChild(document.createTextNode(" ")); sm.appendChild(dwi("daripada " + RM(it.sasaran) + "*", "of " + RM(it.sasaran) + "*")); j.appendChild(sm); }
    a.appendChild(j);

    if (it) {
      var pct = Math.min(100, (terkumpul / it.sasaran) * 100);
      var bar = el("div", "bar"); bar.setAttribute("role", "progressbar"); bar.setAttribute("aria-valuemin", "0"); bar.setAttribute("aria-valuemax", "100");
      bar.setAttribute("aria-label", it.ms); bar.appendChild(el("i"));
      a.appendChild(bar);
      var peratus = Math.round((terkumpul / it.sasaran) * 100);
      var m = el("p", "meta"), kiri = el("span"), kanan = el("b");
      kiri.appendChild(dwi(bil + " penyumbang", bil + " donors"));
      kanan.appendChild(dwi(peratus + "% tercapai", peratus + "% funded"));
      m.appendChild(kiri); m.appendChild(kanan); a.appendChild(m);
      requestAnimationFrame(function () { window.IsiBar(bar, pct); });
    } else {
      var m2 = el("p", "meta"); m2.appendChild(dwi(bil + " penyumbang", bil + " donors")); a.appendChild(m2);
    }

    var t = el("div", "tindakan"), asas = "/sumbang/?projek=" + PROJEK + (id ? "&item=" + id : "");
    var b1 = el("a", "btn btn-emas"); b1.href = asas + "&amaun=" + (it ? it.unit : 100);
    b1.appendChild(it ? dwi("Taja seunit · " + RM(it.unit), "Sponsor a unit · " + RM(it.unit)) : dwi("Sumbang " + RM(100), "Give " + RM(100)));
    var b2 = el("a", "btn btn-putih"); b2.href = asas; b2.appendChild(dwi("Amaun lain", "Custom"));
    t.appendChild(b1); t.appendChild(b2); a.appendChild(t);
    a.setAttribute("data-muncul", "");
    return a;
  }

  function senaraiItem() {
    var grid = document.getElementById("itemGrid");
    grid.textContent = "";
    var item = konfig.item || {}, kut = (data && data.item) || {};
    Object.keys(item).forEach(function (id) { grid.appendChild(kad(id, item[id], kut[id])); });
    grid.appendChild(kad("", null, kut._am));
    tapis();
    window.Muncul(grid);
    document.querySelectorAll("[data-bil-item]").forEach(function (e) { e.textContent = Object.keys(item).length + 1; });
  }

  function tapis() {
    var n = 0;
    document.querySelectorAll("#itemGrid .item").forEach(function (a) {
      var k = a.getAttribute("data-keutamaan");
      var nampak = penapis === "semua" || k === penapis;
      a.hidden = !nampak; if (nampak) n++;
    });
  }
  document.querySelectorAll(".penapis button").forEach(function (b) {
    b.addEventListener("click", function () {
      penapis = b.getAttribute("data-tapis");
      document.querySelectorAll(".penapis button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      tapis();
    });
  });

  /* ---------- Sumbangan terkini ---------- */
  function bila(iso) {
    var s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
    var u = [[86400, "hari", "day"], [3600, "jam", "hour"], [60, "minit", "minute"]];
    for (var i = 0; i < u.length; i++) {
      var n = Math.floor(s / u[i][0]);
      if (n >= 1) return [n + " " + u[i][1] + " lalu", n + " " + u[i][2] + (n > 1 ? "s" : "") + " ago"];
    }
    return ["sebentar tadi", "just now"];
  }
  function suapan() {
    var ul = document.getElementById("suapan"), bhg = document.getElementById("terkini");
    if (!data.terkini || !data.terkini.length) { bhg.hidden = true; return; }
    ul.textContent = "";
    data.terkini.forEach(function (d) {
      var li = el("li"), av = el("span", "av", d.nama ? d.nama.charAt(0).toUpperCase() : "?"), p = el("p"), b = bila(d.masa);
      av.setAttribute("aria-hidden", "true");
      p.appendChild(dwi((d.nama || "Penderma tanpa nama") + " menyumbang " + RM(d.amaun), (d.nama || "An anonymous donor") + " gave " + RM(d.amaun)));
      var w = el("span", "bila"); w.appendChild(dwi(b[0], b[1]));
      li.appendChild(av); li.appendChild(p); li.appendChild(w); ul.appendChild(li);
    });
    bhg.hidden = false;
  }

  /* ---------- Muat ---------- */
  function muat(segar) {
    var k = segar
      ? fetch("/api/kutipan?projek=" + PROJEK, { cache: "no-store" }).then(function (r) { return r.json(); })
      : window.Kutipan(PROJEK);
    return k.then(function (j) { if (j.ok) { data = j; } });
  }
  Promise.all([fetch("/api/tetapan").then(function (r) { return r.json(); }), muat(false).catch(function () {})])
    .then(function (h) {
      konfig = h[0].projek[PROJEK];
      if (data) { ringkasan(); suapan(); }
      senaraiItem();
    })
    .catch(function () { document.getElementById("itemRalat").hidden = false; });

  setInterval(function () { if (document.visibilityState === "visible") muat(true).then(function () { if (data) suapan(); }).catch(function () {}); }, 60000);

  /* ---------- Kongsi ---------- */
  var url = encodeURIComponent(location.origin + "/degup2027/");
  var teks = encodeURIComponent("Bantu bawa filem DEGUP dan forum kesedaran autisme ke 10 bandar. ");
  var pautan = {
    wa: "https://wa.me/?text=" + teks + url,
    tg: "https://t.me/share/url?url=" + url + "&text=" + teks,
    fb: "https://www.facebook.com/sharer/sharer.php?u=" + url,
    x: "https://x.com/intent/tweet?text=" + teks + "&url=" + url
  };
  document.querySelectorAll("[data-kongsi]").forEach(function (a) { a.href = pautan[a.getAttribute("data-kongsi")]; });
})();
