/* Bantuan borang: Turnstile, mesej ralat dwibahasa, hantar JSON */
(function () {
  "use strict";
  var MESEJ = {
    asal: ["Permintaan ditolak. Muat semula halaman dan cuba lagi.", "Request rejected. Reload the page and try again."],
    had: ["Terlalu banyak cubaan. Tunggu seminit dan cuba lagi.", "Too many attempts. Wait a minute and try again."],
    tutup: ["Sumbangan dalam talian belum dibuka.", "Online donations are not open yet."],
    turnstile: ["Pengesahan keselamatan gagal. Tandakan kotak pengesahan sekali lagi.", "Security check failed. Complete the verification box again."],
    data: ["Semak medan yang ditanda.", "Check the highlighted field."],
    amaun: ["Amaun di luar had yang dibenarkan.", "Amount is outside the allowed range."],
    toyyibpay: ["Pintu pembayaran tidak dapat dihubungi. Cuba lagi sebentar.", "The payment gateway could not be reached. Try again shortly."],
    dalaman: ["Ralat pelayan. Cuba lagi sebentar.", "Server error. Try again shortly."],
    rangkaian: ["Tiada sambungan. Semak internet anda dan cuba lagi.", "No connection. Check your internet and try again."]
  };
  window.Borang = {
    mesej: function (kod) { var m = MESEJ[kod] || MESEJ.dalaman; return window.T(m[0], m[1]); },

    turnstile: function (el, sitekey) {
      return new Promise(function (sedia) {
        var n = 0;
        (function cuba() {
          if (window.turnstile && sitekey) {
            sedia(window.turnstile.render(el, { sitekey: sitekey, theme: "light", language: "auto" }));
          } else if (n++ < 60) setTimeout(cuba, 200);
          else sedia(null);
        })();
      });
    },

    token: function (id) { return id != null && window.turnstile ? window.turnstile.getResponse(id) : ""; },
    reset: function (id) { if (id != null && window.turnstile) window.turnstile.reset(id); },

    tanda: function (borang, nama) {
      Array.prototype.forEach.call(borang.querySelectorAll("[aria-invalid]"), function (e) { e.removeAttribute("aria-invalid"); });
      if (!nama) return;
      var el = borang.querySelector('[name="' + nama + '"]');
      if (el) { el.setAttribute("aria-invalid", "true"); el.focus(); }
    },

    hantar: function (url, data) {
      return fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return { ok: false, kod: "dalaman" }; }); })
        .catch(function () { return { ok: false, kod: "rangkaian" }; });
    }
  };
})();
