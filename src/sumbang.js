import {
  json, ralat, asalSah, ip, bacaJson, dalamHad, turnstileSah,
  baris, emelSah, telefonSah, idRawak, tanda, tandaSah, sulit, tahunMY, lamanUrl
} from "./util.js";
import { PROJEK } from "./projek.js";
import { ciptaBil, pautanBayar, semakBayaran } from "./toyyibpay.js";
import { hantarResitEmel } from "./resit.js";

const SEMAK_ID_INDIVIDU = /^(\d{12}|[A-Z0-9]{5,20})$/;           // IC 12 digit, atau pasport/polis/tentera
const SEMAK_ID_SYARIKAT = /^[A-Z0-9][A-Z0-9 \-\/().]{2,29}$/;     // SSM baharu / lama, ROS, dll.

function nomborId(jenis, mentah) {
  const t = baris(mentah, 40).toUpperCase();
  if (jenis === "individu") {
    const padat = t.replace(/[\s-]/g, "");
    if (!SEMAK_ID_INDIVIDU.test(padat)) return "";
    return /^\d{12}$/.test(padat) ? `${padat.slice(0, 6)}-${padat.slice(6, 8)}-${padat.slice(8)}` : padat;
  }
  return SEMAK_ID_SYARIKAT.test(t) ? t : "";
}

export function bukaSumbangan(env) {
  return String(env.BUKA_SUMBANGAN || "").toLowerCase() === "ya";
}

/* ---------- POST /api/sumbang ---------- */
export async function ciptaSumbangan(request, env) {
  if (!asalSah(request, env)) return ralat(403, "asal");
  if (!(await dalamHad(env.HAD_BORANG, "sumbang:" + ip(request)))) return ralat(429, "had");
  if (!bukaSumbangan(env)) return ralat(403, "tutup");

  let b;
  try { b = await bacaJson(request); } catch (e) { return ralat(400, "data"); }

  if (!(await turnstileSah(env, b.turnstile, ip(request)))) return ralat(403, "turnstile");

  // Pengesahan medan
  const projek = Object.hasOwn(PROJEK, b.projek) ? b.projek : "";
  const p = PROJEK[projek];
  const item = p && p.item && typeof b.item === "string" && Object.hasOwn(p.item, b.item) ? b.item : null;
  const paparNama = b.papar_nama === true ? 1 : 0;
  const jenis = b.jenis === "syarikat" ? "syarikat" : b.jenis === "individu" ? "individu" : "";
  const nama = baris(b.nama, 120);
  const noId = jenis ? nomborId(jenis, b.no_id) : "";
  const alamat = baris(b.alamat, 300);
  const emel = baris(b.emel, 254).toLowerCase();
  const telefon = baris(b.telefon, 20);
  const amaun = Number(b.amaun);
  const amaunSen = Math.round(amaun * 100);
  const min = Math.max(Number(env.MIN_SUMBANGAN || 1), p ? p.min : 10) * 100;
  const maks = Number(env.MAKS_SUMBANGAN || 30000) * 100;

  if (!projek) return ralat(400, "data", "projek");
  if (b.item && !item) return ralat(400, "data", "item");
  if (!jenis) return ralat(400, "data", "jenis");
  if (nama.length < 3) return ralat(400, "data", "nama");
  if (!noId) return ralat(400, "data", "no_id");
  if (alamat.length < 10) return ralat(400, "data", "alamat");
  if (!emelSah(emel)) return ralat(400, "data", "emel");
  if (!telefonSah(telefon)) return ralat(400, "data", "telefon");
  if (!Number.isFinite(amaun) || Math.abs(amaun * 100 - amaunSen) > 1e-6 || amaunSen < min || amaunSen > maks) {
    return ralat(400, "amaun");
  }
  if (b.setuju !== true) return ralat(400, "data", "setuju");

  // Rekod dahulu (status menunggu), kemudian cipta bil
  const id = idRawak(12);
  const t = await tanda(env, "derma:" + id);
  await env.DB.prepare(
    `INSERT INTO derma (id, dicipta, projek, item, papar_nama, jenis, nama, emel, no_id_enc, alamat_enc, telefon_enc, amaun_sen, status)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, 'menunggu')`
  ).bind(
    id, new Date().toISOString(), projek, item, paparNama, jenis, nama, emel,
    await sulit(env, noId), await sulit(env, alamat), await sulit(env, telefon), amaunSen
  ).run();

  const laman = lamanUrl(env, request);
  let billcode;
  try {
    billcode = await ciptaBil(env, {
      id, nama, emel, telefon,
      amaun_sen: amaunSen,
      keterangan: p.bil + (item ? " " + item : ""),
      pulang: `${laman}/sumbang/selesai/?id=${id}&t=${t}`,
      panggilBalik: `${laman}/api/toyyibpay/callback`
    });
  } catch (e) {
    console.error("ciptaBil", e && e.message);
    await env.DB.prepare("UPDATE derma SET status = 'batal', catatan = 'bil gagal dicipta' WHERE id = ?1").bind(id).run();
    return ralat(502, "toyyibpay");
  }
  await env.DB.prepare("UPDATE derma SET billcode = ?2 WHERE id = ?1").bind(id, billcode).run();

  return json({ ok: true, url: pautanBayar(env, billcode) });
}

/* ---------- Pengesahan bayaran (dikongsi: status, callback, cron) ---------- */
export async function sahkan(env, ctx, derma, laman) {
  if (!derma || derma.status !== "menunggu" || !derma.billcode) return derma && derma.status;

  let hasil;
  try { hasil = await semakBayaran(env, derma); } catch (e) { return "menunggu"; }

  if (hasil.status === "semak") {
    await env.DB.prepare("UPDATE derma SET status = 'semak', catatan = ?2 WHERE id = ?1 AND status = 'menunggu'")
      .bind(derma.id, hasil.sebab).run();
    return "semak";
  }
  if (hasil.status !== "berjaya") return "menunggu";

  // Satu kenyataan atomik: hanya satu proses boleh menukar 'menunggu' → 'berjaya'.
  // Nombor siri resit diambil dalam kenyataan yang sama supaya tiada jurang atau pertindihan.
  const tahun = tahunMY();
  const r = await env.DB.prepare(
    `UPDATE derma SET status = 'berjaya', refno = ?2, saluran = ?3, dibayar = ?4, tahun_resit = ?5,
       siri_resit = (SELECT COALESCE(MAX(siri_resit), 0) + 1 FROM derma WHERE tahun_resit = ?5)
     WHERE id = ?1 AND status = 'menunggu'`
  ).bind(derma.id, hasil.refno, hasil.saluran, new Date().toISOString(), tahun).run();

  if (r.meta && r.meta.changes === 1) {
    const kerja = hantarResitEmel(env, derma.id, laman).catch((e) => console.error("emel resit", e && e.message));
    if (ctx) ctx.waitUntil(kerja); else await kerja;
  }
  return "berjaya";
}

/* ---------- GET /api/sumbang/status?id=..&t=.. ---------- */
export async function statusSumbangan(request, env, ctx) {
  if (!(await dalamHad(env.HAD_API, "status:" + ip(request)))) return ralat(429, "had");
  const u = new URL(request.url);
  const id = u.searchParams.get("id") || "";
  const t = u.searchParams.get("t") || "";
  if (!/^[a-f0-9]{24}$/.test(id) || !(await tandaSah(env, "derma:" + id, t))) return ralat(404, "tiada");

  let d = await env.DB.prepare("SELECT * FROM derma WHERE id = ?1").bind(id).first();
  if (!d) return ralat(404, "tiada");
  if (d.status === "menunggu") {
    await sahkan(env, ctx, d, lamanUrl(env, request));
    d = await env.DB.prepare("SELECT * FROM derma WHERE id = ?1").bind(id).first();
  }
  const keluar = { ok: true, status: d.status, amaun: d.amaun_sen / 100 };
  if (d.status === "berjaya") {
    keluar.no_resit = noResit(d);
    keluar.resit = `/resit/${id}?t=${t}`;
  }
  return json(keluar);
}

export function noResit(d) {
  return d.siri_resit ? `AF/${d.tahun_resit}/${String(d.siri_resit).padStart(6, "0")}` : "";
}

/* ---------- POST /api/toyyibpay/callback ---------- */
// Data callback tidak dipercayai. Ia hanya dijadikan isyarat untuk menyemak semula dengan toyyibPay.
export async function panggilBalik(request, env, ctx) {
  const ok = () => new Response("OK", { headers: { "content-type": "text/plain", "cache-control": "no-store" } });
  if (!(await dalamHad(env.HAD_API, "callback:" + ip(request)))) return ok();

  let billcode = "", rujukan = "";
  try {
    const f = await request.formData();
    billcode = String(f.get("billcode") || "");
    rujukan = String(f.get("order_id") || "");
  } catch (e) {
    return ok();
  }
  if (!/^[A-Za-z0-9]{4,32}$/.test(billcode)) return ok();

  const d = await env.DB.prepare("SELECT * FROM derma WHERE billcode = ?1").bind(billcode).first();
  if (d && (!rujukan || rujukan === d.id)) await sahkan(env, ctx, d, lamanUrl(env, request));
  return ok();
}

/* ---------- Cron: semak bayaran tertunggak & hantar semula resit gagal ---------- */
export async function semakTertunggak(env, ctx) {
  const laman = (env.LAMAN_URL || "").replace(/\/$/, "");
  const kini = Date.now();
  const sepuluhMinit = new Date(kini - 10 * 60e3).toISOString();
  const tigaHari = new Date(kini - 3 * 86400e3).toISOString();
  const tujuhHari = new Date(kini - 7 * 86400e3).toISOString();

  const { results: tunggu } = await env.DB.prepare(
    `SELECT * FROM derma WHERE status = 'menunggu' AND billcode IS NOT NULL
       AND dicipta < ?1 AND dicipta > ?2 ORDER BY dicipta LIMIT 40`
  ).bind(sepuluhMinit, tigaHari).all();
  for (const d of tunggu) await sahkan(env, ctx, d, laman);

  // Bil luput selepas 3 hari: semak sekali lagi sebelum ditanda luput
  const { results: lama } = await env.DB.prepare(
    "SELECT * FROM derma WHERE status = 'menunggu' AND dicipta <= ?1 LIMIT 40"
  ).bind(tigaHari).all();
  for (const d of lama) {
    const s = d.billcode ? await sahkan(env, ctx, d, laman) : "menunggu";
    if (s === "menunggu") {
      await env.DB.prepare("UPDATE derma SET status = 'luput' WHERE id = ?1 AND status = 'menunggu'").bind(d.id).run();
    }
  }

  // Resit yang belum/gagal dihantar dalam 7 hari terakhir
  const { results: resit } = await env.DB.prepare(
    `SELECT id FROM derma WHERE status = 'berjaya' AND dibayar > ?1
       AND (emel_resit IS NULL OR emel_resit LIKE 'gagal%') LIMIT 20`
  ).bind(tujuhHari).all();
  for (const r of resit) await hantarResitEmel(env, r.id, laman).catch(() => {});
}
