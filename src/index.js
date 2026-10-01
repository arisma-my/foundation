// ARISMA Foundation — Cloudflare Worker
// Fail statik dalam /public dilayan terus oleh Cloudflare (pengepala keselamatan dalam public/_headers).
// Worker ini hanya berjalan untuk laluan yang tiada fail statik: /api/*, /resit/*, /pentadbir/*.

import { ralat } from "./util.js";
import { ciptaSumbangan, statusSumbangan, panggilBalik, semakTertunggak } from "./sumbang.js";
import { tetapan, kutipan, hantarTaja } from "./awam.js";
import { paparResit } from "./resit.js";
import { pentadbir } from "./pentadbir.js";

const LALUAN = {
  "GET /api/tetapan": (r, env) => tetapan(env),
  "GET /api/kutipan": kutipan,
  "POST /api/sumbang": ciptaSumbangan,
  "GET /api/sumbang/status": statusSumbangan,
  "POST /api/toyyibpay/callback": panggilBalik,
  "POST /api/taja": hantarTaja
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const p = url.pathname;
    try {
      const kendali = LALUAN[`${request.method} ${p}`];
      if (kendali) return await kendali(request, env, ctx);
      if (p.startsWith("/api/")) {
        const adaLaluan = Object.keys(LALUAN).some((k) => k.endsWith(" " + p));
        return adaLaluan ? ralat(405, "kaedah") : ralat(404, "tiada");
      }
      if (p.startsWith("/resit/") && request.method === "GET") return await paparResit(request, env);
      if (p.startsWith("/pentadbir/") && request.method === "GET") return await pentadbir(request, env);
      if (p === "/.well-known/security.txt") return securityTxt(env);
      return env.ASSETS.fetch(request);
    } catch (e) {
      console.error("ralat", p, e && e.stack);
      return ralat(500, "dalaman");
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(semakTertunggak(env, ctx));
  }
};

function securityTxt(env) {
  const tamat = new Date(Date.now() + 180 * 86400e3).toISOString();
  const emel = env.EMEL_KESELAMATAN || env.EMEL_YAYASAN || "arisma2012@gmail.com";
  return new Response(`Contact: mailto:${emel}\nExpires: ${tamat}\nPreferred-Languages: ms, en\n`, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" }
  });
}
