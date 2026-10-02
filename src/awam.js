import { json, ralat, asalSah, ip, bacaJson, dalamHad, turnstileSah, baris, blok, emelSah, telefonSah, idRawak, esc } from "./util.js";
import { bukaSumbangan } from "./sumbang.js";
import { PROJEK, projekAwam } from "./projek.js";

/* ---------- GET /api/tetapan ---------- */
export function tetapan(env) {
  return json(
    {
      ok: true,
      buka: bukaSumbangan(env),
      turnstile: env.TURNSTILE_SITEKEY || "",
      maks: Number(env.MAKS_SUMBANGAN || 30000),
      projek: projekAwam()
    },
    200,
    { "cache-control": "public, max-age=60" }
  );
}

/* ---------- GET /api/kutipan?projek=degup2027 ---------- */
// Jumlah terkumpul (dalam talian + luar talian), mengikut item, dan sumbangan terkini.
// Nama penderma hanya dipapar jika penderma sendiri memilih, dan hanya perkataan pertama.
export async function kutipan(request, env, ctx) {
  const u = new URL(request.url);
  const projek = u.searchParams.get("projek") || "";
  const p = PROJEK[projek];
  if (!p) return ralat(404, "tiada");

  const kunciCache = new Request(`${u.origin}/api/kutipan?projek=${projek}`);
  const cache = caches.default;
  const ada = await cache.match(kunciCache);
  if (ada) return ada;

  const [dalam, luar, terkini] = await env.DB.batch([
    env.DB.prepare(
      "SELECT item, COALESCE(SUM(amaun_sen),0) AS s, COUNT(*) AS c FROM derma WHERE status = 'berjaya' AND projek = ?1 GROUP BY item"
    ).bind(projek),
    env.DB.prepare(
      "SELECT item, COALESCE(SUM(amaun_sen),0) AS s, COUNT(*) AS c FROM kutipan_luar WHERE projek = ?1 GROUP BY item"
    ).bind(projek),
    env.DB.prepare(
      "SELECT nama, papar_nama, amaun_sen, dibayar, item FROM derma WHERE status = 'berjaya' AND projek = ?1 ORDER BY dibayar DESC LIMIT 6"
    ).bind(projek)
  ]);

  let jumlah = 0, bilangan = 0;
  const item = {};
  for (const r of [...dalam.results, ...luar.results]) {
    jumlah += r.s;
    bilangan += r.c;
    const k = r.item && p.item && p.item[r.item] ? r.item : "_am";
    item[k] = item[k] || { terkumpul: 0, penyumbang: 0 };
    item[k].terkumpul += r.s / 100;
    item[k].penyumbang += r.c;
  }

  const res = json(
    {
      ok: true,
      projek,
      terkumpul: jumlah / 100,
      sumbangan: bilangan,
      purata: bilangan ? Math.round(jumlah / bilangan) / 100 : 0,
      sasaran: p.sasaran,
      item,
      terkini: terkini.results.map((r) => ({
        nama: r.papar_nama ? baris(r.nama, 40).split(" ")[0] : null,
        amaun: r.amaun_sen / 100,
        masa: r.dibayar,
        item: r.item
      }))
    },
    200,
    { "cache-control": "public, max-age=60" }
  );
  ctx.waitUntil(cache.put(kunciCache, res.clone()));
  return res;
}

/* ---------- POST /api/taja ---------- */
const MINAT = ["utama", "zonal", "kerusi", "csr", "pertanyaan", "kolaborasi"];

export async function hantarTaja(request, env, ctx) {
  if (!asalSah(request, env)) return ralat(403, "asal");
  if (!(await dalamHad(env.HAD_BORANG, "taja:" + ip(request)))) return ralat(429, "had");

  let b;
  try { b = await bacaJson(request); } catch (e) { return ralat(400, "data"); }
  if (!(await turnstileSah(env, b.turnstile, ip(request)))) return ralat(403, "turnstile");

  const r = {
    syarikat: baris(b.syarikat, 160),
    pegawai: baris(b.pegawai, 120),
    jawatan: baris(b.jawatan, 120),
    emel: baris(b.emel, 254).toLowerCase(),
    telefon: baris(b.telefon, 20),
    minat: MINAT.includes(b.minat) ? b.minat : "",
    mesej: blok(b.mesej, 2000)
  };
  if (r.syarikat && r.syarikat.length < 2) return ralat(400, "data", "syarikat");
  if (!r.syarikat) r.syarikat = "(tidak dinyatakan)";
  if (r.pegawai.length < 3) return ralat(400, "data", "pegawai");
  if (!emelSah(r.emel)) return ralat(400, "data", "emel");
  if (!telefonSah(r.telefon)) return ralat(400, "data", "telefon");
  if (!r.minat) return ralat(400, "data", "minat");

  const id = idRawak(8);
  await env.DB.prepare(
    `INSERT INTO taja (id, dicipta, syarikat, pegawai, jawatan, emel, telefon, minat, mesej)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
  ).bind(id, new Date().toISOString(), r.syarikat, r.pegawai, r.jawatan, r.emel, r.telefon, r.minat, r.mesej).run();

  if (env.RESEND_API_KEY && env.EMEL_DARI && env.EMEL_PENTADBIR) {
    const badan = Object.entries(r).map(([k, v]) => `<p><b>${esc(k)}</b>: ${esc(v).replace(/\n/g, "<br>")}</p>`).join("");
    ctx.waitUntil(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({
          from: env.EMEL_DARI,
          to: [env.EMEL_PENTADBIR],
          reply_to: r.emel,
          subject: `Pertanyaan laman web (${r.minat}): ${r.syarikat === "(tidak dinyatakan)" ? r.pegawai : r.syarikat}`,
          html: badan
        })
      }).catch(() => {})
    );
  }
  return json({ ok: true });
}
