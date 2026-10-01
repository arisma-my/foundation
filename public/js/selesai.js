/* Halaman selepas pembayaran: sahkan status dengan pelayan (bukan dengan parameter URL) */
(function () {
  "use strict";
  var q = new URLSearchParams(location.search);
  var id = q.get("id"), t = q.get("t");
  var keadaan = {
    semak: document.getElementById("sSemak"), berjaya: document.getElementById("sBerjaya"),
    menunggu: document.getElementById("sMenunggu"), gagal: document.getElementById("sGagal")
  };
  function papar(k) { Object.keys(keadaan).forEach(function (x) { keadaan[x].hidden = x !== k; }); }
  if (!id || !t) return papar("gagal");

  var cubaan = 0;
  (function semak() {
    fetch("/api/sumbang/status?id=" + encodeURIComponent(id) + "&t=" + encodeURIComponent(t))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.ok && j.status === "berjaya") {
          document.getElementById("noResit").textContent = j.no_resit;
          document.getElementById("pautanResit").href = j.resit;
          papar("berjaya");
          var h = document.getElementById("tajukBerjaya");
          if (h && window.Pecah) { window.Pecah(h); requestAnimationFrame(function () { h.classList.add("nampak"); }); }
          return;
        }
        if (j.ok && j.status === "menunggu" && q.get("status_id") === "3") return papar("gagal");
        if (j.ok && j.status === "menunggu" && cubaan++ < 6) return setTimeout(semak, 3000);
        if (j.ok && (j.status === "menunggu" || j.status === "semak")) return papar("menunggu");
        papar("gagal");
      })
      .catch(function () { papar("menunggu"); });
  })();
})();
