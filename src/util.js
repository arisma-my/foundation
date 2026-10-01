// Utiliti dikongsi: respons, pengesahan input, Turnstile, had kadar, HMAC, penyulitan.

const enc = new TextEncoder();
const dec = new TextDecoder();

/* ---------- Respons ---------- */
const HDR_API = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "cross-origin-resource-policy": "same-origin",
  "x-robots-tag": "noindex"
};

export function json(data, status = 200, tambahan = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...HDR_API, ...tambahan } });
}

// kod: kunci mesej yang diterjemah di pelayar (BM/EN)
export function ralat(status, kod, medan) {
  return json(medan ? { ok: false, kod, medan } : { ok: false, kod }, status);
}

export const CSP_HALAMAN =
  "default-src 'none'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; " +
  "script-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

export function html(badan, status = 200) {
  return new Response(badan, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "content-security-policy": CSP_HALAMAN,
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      "x-robots-tag": "noindex, nofollow"
    }
  });
}

export function lamanUrl(env, request) {
  const v = (env.LAMAN_URL || "").trim().replace(/\/$/, "");
  return v || new URL(request.url).origin;
}

/* ---------- Asal permintaan (CSRF) ---------- */
export function asalSah(request, env) {
  const o = request.headers.get("Origin");
  if (!o) return false;
  return o === new URL(request.url).origin || o === (env.LAMAN_URL || "").replace(/\/$/, "");
}

export function ip(request) {
  return request.headers.get("CF-Connecting-IP") || "0.0.0.0";
}

export async function bacaJson(request, had = 8192) {
  const jenis = request.headers.get("content-type") || "";
  if (!jenis.toLowerCase().startsWith("application/json")) throw new Error("jenis");
  const panjang = Number(request.headers.get("content-length") || 0);
  if (panjang > had) throw new Error("besar");
  const teks = await request.text();
  if (teks.length > had) throw new Error("besar");
  const o = JSON.parse(teks);
  if (!o || typeof o !== "object" || Array.isArray(o)) throw new Error("bentuk");
  return o;
}

/* ---------- Had kadar (Workers Rate Limiting) ---------- */
export async function dalamHad(binding, kunci) {
  if (!binding) return true; // binding tiada (cth. dev tempatan): jangan sekat
  try {
    const { success } = await binding.limit({ key: kunci });
    return success;
  } catch (e) {
    return true;
  }
}

/* ---------- Turnstile ---------- */
export async function turnstileSah(env, token, alamatIp) {
  if (!env.TURNSTILE_SECRET) return false;
  if (typeof token !== "string" || token.length < 10 || token.length > 2048) return false;
  const f = new FormData();
  f.append("secret", env.TURNSTILE_SECRET);
  f.append("response", token);
  f.append("remoteip", alamatIp);
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: f });
    const j = await r.json();
    return j && j.success === true;
  } catch (e) {
    return false;
  }
}

/* ---------- Pembersihan input ---------- */
export function baris(s, maks) {
  if (typeof s !== "string") return "";
  return s.replace(/[\u0000-\u001F\u007F\u2028\u2029]/g, " ").replace(/\s+/g, " ").trim().slice(0, maks);
}

export function blok(s, maks) {
  if (typeof s !== "string") return "";
  return s.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, maks);
}

export function emelSah(e) {
  return typeof e === "string" && e.length <= 254 && /^[^\s@<>"'(),;:]{1,64}@[a-z0-9.-]{1,190}\.[a-z]{2,24}$/i.test(e);
}

export function telefonSah(t) {
  return /^\+?[0-9][0-9 -]{7,15}$/.test(t);
}

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------- Rawak & base64 ---------- */
export function idRawak(bait = 12) {
  const a = new Uint8Array(bait);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function keB64(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function dariB64(s) {
  const t = atob(s);
  const a = new Uint8Array(t.length);
  for (let i = 0; i < t.length; i++) a[i] = t.charCodeAt(i);
  return a;
}
export function b64url(bytes) {
  return keB64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function dariB64url(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return dariB64(s);
}

/* ---------- HMAC untuk pautan resit/status ---------- */
const cacheKunci = new Map();

async function kunciHmac(rahsia) {
  if (!rahsia || rahsia.length < 32) throw new Error("KUNCI_RESIT belum ditetapkan (sekurang-kurangnya 32 aksara)");
  if (!cacheKunci.has("h:" + rahsia)) {
    cacheKunci.set("h:" + rahsia, await crypto.subtle.importKey("raw", enc.encode(rahsia), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]));
  }
  return cacheKunci.get("h:" + rahsia);
}

export async function tanda(env, teks) {
  const k = await kunciHmac(env.KUNCI_RESIT);
  const s = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(teks)));
  return b64url(s).slice(0, 32);
}

export async function tandaSah(env, teks, diberi) {
  if (typeof diberi !== "string" || diberi.length !== 32) return false;
  const betul = await tanda(env, teks);
  let beza = 0;
  for (let i = 0; i < 32; i++) beza |= betul.charCodeAt(i) ^ diberi.charCodeAt(i);
  return beza === 0;
}

/* ---------- Penyulitan AES-256-GCM untuk data peribadi ---------- */
async function kunciData(env) {
  const r = env.KUNCI_DATA || "";
  if (!cacheKunci.has("d:" + r)) {
    let mentah;
    try { mentah = dariB64(r); } catch (e) { mentah = new Uint8Array(0); }
    if (mentah.length !== 32) throw new Error("KUNCI_DATA mesti 32 bait dalam base64");
    cacheKunci.set("d:" + r, await crypto.subtle.importKey("raw", mentah, "AES-GCM", false, ["encrypt", "decrypt"]));
  }
  return cacheKunci.get("d:" + r);
}

export async function sulit(env, teks) {
  const k = await kunciData(env);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, enc.encode(teks)));
  return "v1." + keB64(iv) + "." + keB64(ct);
}

export async function nyahsulit(env, simpan) {
  if (typeof simpan !== "string" || !simpan.startsWith("v1.")) return "";
  const [, iv, ct] = simpan.split(".");
  const k = await kunciData(env);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: dariB64(iv) }, k, dariB64(ct));
  return dec.decode(pt);
}

/* ---------- Masa & wang ---------- */
export function tahunMY(d = new Date()) {
  return Number(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur", year: "numeric" }).format(d));
}

export function tarikhMY(iso) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kuala_Lumpur", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
}

export function rm(sen) {
  return "RM " + (sen / 100).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const SA = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "lapan", "sembilan"];
function bawahSeribu(n) {
  const o = [];
  const r = Math.floor(n / 100), b = n % 100;
  if (r) o.push(r === 1 ? "seratus" : SA[r] + " ratus");
  if (b) {
    if (b < 10) o.push(SA[b]);
    else if (b === 10) o.push("sepuluh");
    else if (b === 11) o.push("sebelas");
    else if (b < 20) o.push(SA[b - 10] + " belas");
    else o.push(SA[Math.floor(b / 10)] + " puluh" + (b % 10 ? " " + SA[b % 10] : ""));
  }
  return o.join(" ");
}
function perkataan(n) {
  if (n === 0) return "kosong";
  const o = [];
  const juta = Math.floor(n / 1e6), ribu = Math.floor((n % 1e6) / 1000), baki = n % 1000;
  if (juta) o.push(juta === 1 ? "sejuta" : bawahSeribu(juta) + " juta");
  if (ribu) o.push(ribu === 1 ? "seribu" : bawahSeribu(ribu) + " ribu");
  if (baki) o.push(bawahSeribu(baki));
  return o.join(" ");
}
const besar = (s) => s.replace(/(^|\s)\S/g, (c) => c.toUpperCase());

export function ringgitPerkataan(sen) {
  const r = Math.floor(sen / 100), s = sen % 100;
  return "Ringgit Malaysia " + besar(perkataan(r)) + (s ? " Dan Sen " + besar(perkataan(s)) : "") + " Sahaja";
}
