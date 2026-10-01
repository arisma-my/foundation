/* Halaman Sumbang: pilih projek, peruntukan (item) dan amaun */
(function () {
  "use strict";
  var f = document.getElementById("borangSumbang");
  if (!f) return;
  var T = window.T;
  var mesej = document.getElementById("mesej"), btn = document.getElementById("hantar");
  var tutup = document.getElementById("tutup"), memuat = document.getElementById("memuat");
  var kotakProjek = document.getElementById("pilihProjek"), kotakAmaun = document.getElementById("pilihAmaun");
  var medanItem = document.getElementById("medanItem"), pilihItem = document.getElementById("item");
  var lain = document.getElementById("amaunLain");
  var q = new URLSearchParams(location.search);
  var konfig = null, tsId = null, maks = 30000, mulaAmaun = Number(q.get("amaun")) || 0, mulaItem = q.get("item") || "";

  function el(tag, kelas, teks) { var e = document.createElement(tag); if (kelas) e.className = kelas; if (teks != null) e.textContent = teks; return e; }
  function dwi(ms, en) { var f = document.createDocumentFragment(), a = el("span", null, ms), b = el("span", null, en); a.lang = "ms"; b.lang = "en"; f.appendChild(a); f.appendChild(b); return f; }
  function pil(nama, nilai, utama, ket) {
    var l = el("label"), i = el("input"), b = el("b");
    i.type = "radio"; i.name = nama; i.value = nilai;
    b.appendChild(utama); l.appendChild(i); l.appendChild(b);
    if (ket) { var k = el("span", "ket"); k.appendChild(ket); l.appendChild(k); }
    return l;
  }
  function projekDipilih() { var r = f.querySelector('input[name="projek"]:checked'); return r ? r.value : ""; }

  function binaAmaun() {
    var p = konfig[projekDipilih()];
    kotakAmaun.textContent = "";
    var senarai = p.pratetap.slice();
    var it = p.item && p.item[pilihItem.value];
    if (it && senarai.indexOf(it.unit) < 0) senarai.unshift(it.unit);
    senarai.forEach(function (n) {
      var ket = it && n === it.unit ? dwi("Seunit", "One unit") : null;
      kotakAmaun.appendChild(pil("amaun", String(n), document.createTextNode("RM" + n.toLocaleString("en-MY")), ket));
    });
    kotakAmaun.appendChild(pil("amaun", "lain", dwi("Amaun lain", "Other")));
    var sasaran = mulaAmaun && senarai.indexOf(mulaAmaun) >= 0 ? String(mulaAmaun) : (mulaAmaun ? "lain" : String(senarai[0]));
    kotakAmaun.querySelector('input[value="' + sasaran + '"]').checked = true;
    lain.disabled = sasaran !== "lain";
    if (sasaran === "lain" && mulaAmaun) lain.value = mulaAmaun;
    mulaAmaun = 0;
    lain.min = p.min; lain.max = maks;
    document.getElementById("hadMin").textContent = "RM" + p.min;
  }

  function binaItem() {
    var p = konfig[projekDipilih()];
    pilihItem.textContent = "";
    if (!p.item) { medanItem.hidden = true; return; }
    medanItem.hidden = false;
    var o = el("option", null, T("Di mana paling diperlukan", "Where it’s needed most")); o.value = ""; pilihItem.appendChild(o);
    Object.keys(p.item).forEach(function (k) {
      var it = p.item[k], op = el("option", null, T(it.ms, it.en) + " (" + T("seunit", "per unit") + " RM" + it.unit.toLocaleString("en-MY") + ")");
      op.value = k; pilihItem.appendChild(op);
    });
    if (mulaItem && p.item[mulaItem]) pilihItem.value = mulaItem;
    mulaItem = "";
  }

  function labelId() {
    var s = f.querySelector('input[name="jenis"]:checked').value === "syarikat";
    ["labelIndividu", "labelNamaIndividu"].forEach(function (id) { document.getElementById(id).hidden = s; });
    ["labelSyarikat", "labelNamaSyarikat"].forEach(function (id) { document.getElementById(id).hidden = !s; });
  }

  f.addEventListener("change", function (e) {
    if (e.target.name === "projek") { binaItem(); binaAmaun(); }
    if (e.target === pilihItem) binaAmaun();
    if (e.target.name === "amaun") { lain.disabled = e.target.value !== "lain"; if (!lain.disabled) lain.focus(); }
    if (e.target.name === "jenis") labelId();
  });
  document.addEventListener("bahasa", function () { if (konfig) { var v = pilihItem.value; mulaItem = v; binaItem(); } });
  labelId();

  fetch("/api/tetapan").then(function (r) { return r.json(); }).then(function (j) {
    memuat.hidden = true;
    if (!j.buka) { tutup.hidden = false; return; }
    konfig = j.projek; maks = j.maks;
    document.getElementById("hadMaks").textContent = "RM" + Number(maks).toLocaleString("en-MY");
    ["degup2027", "infaq", "umum"].forEach(function (id) {
      if (!konfig[id]) return;
      kotakProjek.appendChild(pil("projek", id, dwi(konfig[id].ms, konfig[id].en)));
    });
    var mula = konfig[q.get("projek")] ? q.get("projek") : "degup2027";
    kotakProjek.querySelector('input[value="' + mula + '"]').checked = true;
    binaItem(); binaAmaun();
    f.hidden = false;
    return Borang.turnstile(document.getElementById("ts"), j.turnstile).then(function (id) { tsId = id; });
  }).catch(function () { memuat.hidden = true; tutup.hidden = false; });

  function tunjuk(teks, jenis) { mesej.textContent = teks; mesej.className = "mesej " + (jenis || "ralat"); }

  f.addEventListener("submit", function (e) {
    e.preventDefault();
    Borang.tanda(f);
    var p = konfig[projekDipilih()], r = f.querySelector('input[name="amaun"]:checked');
    var amaun = r && r.value === "lain" ? Number(lain.value) : Number(r && r.value);
    if (!amaun || amaun < p.min || amaun > maks) {
      if (r && r.value === "lain") Borang.tanda(f, "amaunLain");
      return tunjuk(T("Masukkan amaun antara RM" + p.min + " dan RM" + maks.toLocaleString("en-MY") + ".", "Enter an amount between RM" + p.min + " and RM" + maks.toLocaleString("en-MY") + "."));
    }
    if (!f.reportValidity()) return;
    var token = Borang.token(tsId);
    if (!token) return tunjuk(Borang.mesej("turnstile"));
    btn.disabled = true;
    tunjuk(T("Menyediakan pembayaran…", "Preparing payment…"), "ok");
    Borang.hantar("/api/sumbang", {
      projek: projekDipilih(), item: medanItem.hidden ? "" : pilihItem.value,
      amaun: Math.round(amaun * 100) / 100,
      jenis: f.querySelector('input[name="jenis"]:checked').value,
      nama: f.nama.value, no_id: f.no_id.value, alamat: f.alamat.value,
      emel: f.emel.value, telefon: f.telefon.value,
      papar_nama: f.papar_nama.checked, setuju: f.setuju.checked, turnstile: token
    }).then(function (j) {
      if (j.ok && /^https:\/\/(dev\.)?toyyibpay\.com\/[A-Za-z0-9]+$/.test(j.url)) { location.assign(j.url); return; }
      btn.disabled = false;
      Borang.reset(tsId);
      Borang.tanda(f, j.medan);
      tunjuk(Borang.mesej(j.kod));
    });
  });
})();
