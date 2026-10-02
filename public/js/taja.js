/* Borang hasrat penajaan korporat */
(function () {
  "use strict";
  var f = document.getElementById("borangTaja");
  if (!f) return;
  var mesej = document.getElementById("mesejTaja"), btn = document.getElementById("hantarTaja"), tsId = null;
  fetch("/api/tetapan").then(function (r) { return r.json(); }).then(function (j) {
    return Borang.turnstile(document.getElementById("tsTaja"), j.turnstile).then(function (id) { tsId = id; });
  }).catch(function () {});
  function opsyen() { Array.prototype.forEach.call(f.querySelectorAll("option[data-ms]"), function (o) { o.textContent = window.T(o.getAttribute("data-ms"), o.getAttribute("data-en")); }); }
  opsyen(); document.addEventListener("bahasa", opsyen);
  function tunjuk(teks, jenis) { mesej.textContent = teks; mesej.className = "mesej " + (jenis || "ralat"); }
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    Borang.tanda(f);
    if (!f.reportValidity()) return;
    var token = Borang.token(tsId);
    if (!token) return tunjuk(Borang.mesej("turnstile"));
    btn.disabled = true;
    Borang.hantar("/api/taja", {
      syarikat: f.syarikat.value, pegawai: f.pegawai.value, jawatan: f.jawatan.value,
      emel: f.emel.value, telefon: f.telefon.value,
      minat: (f.querySelector('input[name="minat"]:checked') || f.querySelector('select[name="minat"]') || {}).value,
      mesej: f.mesej.value, turnstile: token
    }).then(function (j) {
      btn.disabled = false;
      Borang.reset(tsId);
      if (j.ok) { f.reset(); return tunjuk(window.T("Terima kasih. Kami akan menghubungi anda dalam tiga hari bekerja.", "Thank you. We will contact you within three working days."), "ok"); }
      Borang.tanda(f, j.medan);
      tunjuk(Borang.mesej(j.kod));
    });
  });
})();
