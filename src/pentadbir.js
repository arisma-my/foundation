// Eksport data untuk pentadbir. Dilindungi oleh Cloudflare Access (Zero Trust):
// laluan /pentadbir/* mesti ada aplikasi Access, dan Worker ini MENGESAHKAN token Access sendiri
// (bukan sekadar percaya header). Tanpa ACCESS_TEAM_DOMAIN & ACCESS_AUD, laluan ini tidak wujud (404).

import { dariB64url, nyahsulit, tarikhMY } from "./util.js";
import { namaPeruntukan } from "./projek.js";
import { noResit } from "./sumbang.js";

const enc = new TextEncoder();
const dec = new TextDecoder();
let cache = { masa: 0, kunci: null, domain: "" };

async function kunciAccess(domain) {
  if (cache.kunci && cache.domain === domain && Date.now() - cache.masa < 3600e3) return cache.kunci;
  const r = await fetch(`https://${domain}/cdn-cgi/access/certs`);
  const j = await r.json();
  const peta = {};
  for (const k of j.keys || []) {
    peta[k.kid] = await crypto.subtle.importKey("jwk", k, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  }
  cache = { masa: Date.now(), kunci: peta, domain };
  return peta;
}

async function penggunaAccess(request, env) {
  const domain = (env.ACCESS_TEAM_DOMAIN || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!domain || !env.ACCESS_AUD) return null;
  const jwt = request.headers.get("Cf-Access-Jwt-Assertion") || "";
  const [h, p, s] = jwt.split(".");
  if (!h || !p || !s) return null;
  try {
    const kepala = JSON.parse(dec.decode(dariB64url(h)));
    const isi = JSON.parse(dec.decode(dariB64url(p)));
    if (kepala.alg !== "RS256") return null;
    const kunci = (await kunciAccess(domain))[kepala.kid];
    if (!kunci) return null;
    const sah = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", kunci, dariB64url(s), enc.encode(`${h}.${p}`));
    if (!sah) return null;
    const aud = Array.isArray(isi.aud) ? isi.aud : [isi.aud];
    const kini = Math.floor(Date.now() / 1000);
    if (!aud.includes(env.ACCESS_AUD)) return null;
    if (!isi.exp || isi.exp < kini) return null;
    if (isi.iss !== `https://${domain}`) return null;
    return isi.email || "pentadbir";
  } catch (e) {
    return null;
  }
}

// Elak suntikan formula apabila CSV dibuka dalam Excel/Sheets
function sel(v) {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

function csv(nama, baris) {
  const badan = "\ufeff" + baris.map((r) => r.map(sel).join(",")).join("\r\n");
  return new Response(badan, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${nama}"`,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });
}

const tarikhSah = (t) => /^\d{4}-\d{2}-\d{2}$/.test(t || "");

export async function pentadbir(request, env) {
  const pengguna = await penggunaAccess(request, env);
  if (!pengguna) return new Response("Not found", { status: 404 });

  const u = new URL(request.url);
  const dari = tarikhSah(u.searchParams.get("dari")) ? u.searchParams.get("dari") : "2000-01-01";
  const hingga = tarikhSah(u.searchParams.get("hingga")) ? u.searchParams.get("hingga") : "2999-12-31";
  console.log(JSON.stringify({ audit: "eksport", pengguna, laluan: u.pathname, dari, hingga }));

  if (u.pathname === "/pentadbir/sumbangan.csv") {
    const { results } = await env.DB.prepare(
      `SELECT * FROM derma WHERE status IN ('berjaya','semak') AND dibayar >= ?1 AND dibayar < date(?2, '+1 day')
       ORDER BY tahun_resit, siri_resit`
    ).bind(dari, hingga).all();
    const baris = [["no_resit", "tarikh", "status", "peruntukan", "papar_nama", "jenis", "nama", "no_id", "alamat", "emel", "telefon", "amaun_rm", "ruj_toyyibpay", "saluran", "emel_resit", "catatan"]];
    for (const d of results) {
      baris.push([
        noResit(d), d.dibayar ? tarikhMY(d.dibayar) : "", d.status, namaPeruntukan(d.projek, d.item), d.papar_nama ? "ya" : "tidak",
        d.jenis, d.nama, await nyahsulit(env, d.no_id_enc), await nyahsulit(env, d.alamat_enc), d.emel,
        await nyahsulit(env, d.telefon_enc), (d.amaun_sen / 100).toFixed(2), d.refno, d.saluran, d.emel_resit, d.catatan
      ]);
    }
    return csv(`sumbangan_${dari}_${hingga}.csv`, baris);
  }

  if (u.pathname === "/pentadbir/taja.csv") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM taja WHERE dicipta >= ?1 AND dicipta < date(?2, '+1 day') ORDER BY dicipta"
    ).bind(dari, hingga).all();
    const baris = [["tarikh", "syarikat", "pegawai", "jawatan", "emel", "telefon", "minat", "mesej"]];
    for (const r of results) baris.push([tarikhMY(r.dicipta), r.syarikat, r.pegawai, r.jawatan, r.emel, r.telefon, r.minat, r.mesej]);
    return csv(`taja_${dari}_${hingga}.csv`, baris);
  }

  return new Response("Not found", { status: 404 });
}
