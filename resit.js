// Resit rasmi subseksyen 44(6). Medan ikut Lampiran A, perenggan 3.1(b) surat kelulusan LHDN.
// PENTING (3.1(d)): contoh resit mesti dikemukakan kepada KPHDN untuk persetujuan sebelum digunakan.

import { esc, html, tandaSah, tanda, nyahsulit, tarikhMY, rm, ringgitPerkataan } from "./util.js";
import { namaPeruntukan } from "./projek.js";
import { noResit } from "./sumbang.js";

const SAH_HARI = 30; // pautan resit web sah 30 hari selepas bayaran; salinan penuh ada dalam e-mel

function info(env) {
  return {
    nama: env.NAMA_YAYASAN || "ARISMA FOUNDATION",
    daftar: env.NO_DAFTAR_YAYASAN || "PPAB-29/2014",
    alamat: env.ALAMAT_YAYASAN || "2, Jalan UP 3/7E, Ukay Perdana, 68000 Ampang, Selangor",
    emel: env.EMEL_YAYASAN || "",
    pemungut: env.JAWATAN_PEMUNGUT || "Bendahari / Treasurer",
    rujukan: env.LHDN_RUJUKAN || "LHDN.AG.600-16/1/108.8403",
    tempoh: env.LHDN_TEMPOH || "01 Julai 2024 hingga 31 Disember 2027"
  };
}

async function dataResit(env, d) {
  return {
    no: noResit(d),
    tarikh: tarikhMY(d.dibayar),
    nama: d.nama,
    noId: await nyahsulit(env, d.no_id_enc),
    alamat: await nyahsulit(env, d.alamat_enc),
    jenisBm: d.jenis === "syarikat" ? "No. pendaftaran" : "No. kad pengenalan / pasport",
    jenisEn: d.jenis === "syarikat" ? "Registration no." : "IC / passport no.",
    amaun: rm(d.amaun_sen),
    perkataan: ringgitPerkataan(d.amaun_sen),
    peruntukan: namaPeruntukan(d.projek, d.item, "ms"),
    cara: "Dalam talian (toyyibPay" + (d.saluran ? ", " + d.saluran : "") + ")",
    refno: d.refno || "-"
  };
}

function badanResit(f, r) {
  const baris = (bm, en, nilai) =>
    `<tr><th scope="row">${bm}<span>${en}</span></th><td>${nilai}</td></tr>`;
  return `
<article class="resit">
  <header>
    <p class="org">${esc(f.nama)}</p>
    <p class="kecil">(${esc(f.daftar)})<br>${esc(f.alamat)}${f.emel ? "<br>" + esc(f.emel) : ""}</p>
    <h1>Resit Rasmi <span>Official Receipt</span></h1>
  </header>
  <table>
    ${baris("No. resit", "Receipt no.", `<strong>${esc(r.no)}</strong>`)}
    ${baris("Tarikh", "Date", esc(r.tarikh))}
    ${baris("Diterima daripada", "Received from", esc(r.nama))}
    ${baris(esc(r.jenisBm), esc(r.jenisEn), esc(r.noId))}
    ${baris("Alamat", "Address", esc(r.alamat))}
    ${baris("Amaun", "Amount", `<strong>${esc(r.amaun)}</strong><br>${esc(r.perkataan)}`)}
    ${baris("Tujuan", "Purpose", "Sumbangan / Donation: " + esc(r.peruntukan))}
    ${baris("Cara bayaran", "Payment method", esc(r.cara) + "<br>Ruj. / Ref.: " + esc(r.refno))}
    ${baris("Pemungut", "Collector", esc(f.pemungut) + ", " + esc(f.nama))}
  </table>
  <div class="nota">
    “Potongan Di Bawah Subseksyen 44(6), Akta Cukai Pendapatan 1967,<br>
    No. Rujukan: ${esc(f.rujukan)}<br>
    Tempoh Kuat Kuasa: ${esc(f.tempoh)}”
  </div>
</article>`;
}

/* ---------- GET /resit/:id?t=.. ---------- */
export async function paparResit(request, env) {
  const u = new URL(request.url);
  const id = u.pathname.split("/")[2] || "";
  const t = u.searchParams.get("t") || "";
  const tiada = () => html(halaman("Resit tidak dijumpai", "<p>Pautan tidak sah atau telah tamat. Hubungi ARISMA Foundation untuk salinan resit.</p>"), 404);

  if (!/^[a-f0-9]{24}$/.test(id) || !(await tandaSah(env, "derma:" + id, t))) return tiada();
  const d = await env.DB.prepare("SELECT * FROM derma WHERE id = ?1 AND status = 'berjaya'").bind(id).first();
  if (!d || !d.dibayar) return tiada();
  if (Date.now() - Date.parse(d.dibayar) > SAH_HARI * 86400e3) return tiada();

  const r = await dataResit(env, d);
  const badan = badanResit(info(env), r) +
    `<p class="tindakan"><button type="button" id="cetak">Cetak / simpan PDF · Print / save PDF</button></p>`;
  return html(halaman("Resit " + r.no, badan));
}

function halaman(tajuk, badan) {
  return `<!doctype html><html lang="ms"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(tajuk)} · ARISMA Foundation</title>
<link rel="stylesheet" href="/css/resit.css">
</head><body><main>${badan}</main><script src="/js/cetak.js" defer></script></body></html>`;
}

/* ---------- E-mel resit (Resend) ---------- */
export async function hantarResitEmel(env, id, laman) {
  if (!env.RESEND_API_KEY || !env.EMEL_DARI) {
    await env.DB.prepare("UPDATE derma SET emel_resit = 'tiada konfigurasi' WHERE id = ?1 AND emel_resit IS NULL").bind(id).run();
    return;
  }
  // Tuntut tugas secara atomik supaya resit tidak dihantar dua kali
  const tuntut = await env.DB.prepare(
    "UPDATE derma SET emel_resit = 'menghantar' WHERE id = ?1 AND status = 'berjaya' AND (emel_resit IS NULL OR emel_resit LIKE 'gagal%')"
  ).bind(id).run();
  if (!tuntut.meta || tuntut.meta.changes !== 1) return;

  const d = await env.DB.prepare("SELECT * FROM derma WHERE id = ?1").bind(id).first();
  const f = info(env);
  const r = await dataResit(env, d);
  const t = await tanda(env, "derma:" + id);
  const pautan = laman ? `${laman}/resit/${id}?t=${t}` : "";

  const gaya = `<style>
    body{font-family:Arial,Helvetica,sans-serif;color:#13221C;line-height:1.5}
    .resit{max-width:620px;border:1px solid #D3DDD7;padding:24px}
    .org{font-size:20px;font-weight:bold;margin:0}.kecil{font-size:13px;color:#55665E;margin:4px 0 16px}
    h1{font-size:18px;margin:0 0 12px}h1 span,th span{display:block;font-weight:normal;color:#55665E;font-size:12px}
    table{border-collapse:collapse;width:100%}th,td{text-align:left;vertical-align:top;padding:8px 6px;border-top:1px solid #E3EAE6;font-size:14px}
    th{width:38%}.nota{border:2px solid #13221C;padding:10px;font-size:12px;font-weight:bold;max-width:360px;margin-top:20px}
    .tindakan{display:none}</style>`;

  const htmlEmel = `<!doctype html><html><head><meta charset="utf-8">${gaya}</head><body>
<p>Terima kasih atas sumbangan anda kepada ${esc(f.nama)}. Resit rasmi anda di bawah. Sila simpan e-mel ini untuk rekod cukai.</p>
<p>Thank you for your donation. Your official receipt is below. Please keep this email for your tax records.</p>
${badanResit(f, r)}
${pautan ? `<p>Versi boleh cetak (sah ${SAH_HARI} hari) · Printable version (valid ${SAH_HARI} days):<br><a href="${esc(pautan)}">${esc(pautan)}</a></p>` : ""}
</body></html>`;

  const teks = `Resit rasmi ${r.no}\n${f.nama} (${f.daftar})\nTarikh: ${r.tarikh}\nDiterima daripada: ${r.nama}\n` +
    `Amaun: ${r.amaun} (${r.perkataan})\n\nPotongan Di Bawah Subseksyen 44(6), Akta Cukai Pendapatan 1967, ` +
    `No. Rujukan: ${f.rujukan}, Tempoh Kuat Kuasa: ${f.tempoh}\n${pautan}`;

  const badan = {
    from: env.EMEL_DARI,
    to: [d.emel],
    subject: `Resit sumbangan ${r.no} · ARISMA Foundation`,
    html: htmlEmel,
    text: teks
  };
  if (env.EMEL_PENTADBIR) badan.bcc = [env.EMEL_PENTADBIR];

  let status;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify(badan)
    });
    status = res.ok ? "dihantar" : `gagal: HTTP ${res.status}`;
  } catch (e) {
    status = "gagal: rangkaian";
  }
  await env.DB.prepare("UPDATE derma SET emel_resit = ?2 WHERE id = ?1").bind(id, status).run();
}
