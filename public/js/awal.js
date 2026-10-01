/* Dimuat dalam <head>: tetapkan bahasa sebelum halaman dilukis (elak kelipan) */
(function () {
  var h = document.documentElement, b = "ms";
  h.classList.add("js");
  try { b = localStorage.getItem("bahasa") || "ms"; } catch (e) {}
  var q = new URLSearchParams(location.search).get("lang");
  if (q === "en" || q === "ms") b = q;
  h.setAttribute("data-b", b);
  h.setAttribute("lang", b);
  // Jaring keselamatan: jika skrip utama gagal, tunjuk semua kandungan
  setTimeout(function () { if (!h.classList.contains("sedia")) h.classList.remove("js"); }, 3000);
})();
