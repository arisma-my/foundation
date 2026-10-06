#!/usr/bin/env python3
"""Binaan halaman ARISMA Foundation (PILIHAN, untuk pembangun).

Laman sebenar ialah fail dalam public/. Skrip ini hanya menjana semula semua fail HTML itu daripada
sumber/kerangka.html (kepala + menu), sumber/kaki.html (kaki) dan sumber/halaman/*.html (isi tiap halaman),
supaya menu dan kaki sentiasa sama di setiap halaman.

Penggunaan (dari folder utama repo):   python3 sumber/bina.py

Sintaks dwibahasa dalam sumber:   [[teks BM||English text]]   ->   <span lang="ms">..</span><span lang="en">..</span>
Setiap halaman bermula dengan blok  ---  laluan / tajuk / desk / nav / skrip / turnstile / noindex / og  ---
Jika anda tidak menjalankan skrip ini, sunting terus fail dalam public/ (menu & kaki perlu diubah di setiap fail).
"""
import os, re, glob, sys, hashlib

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUMBER = os.path.join(AKAR, "sumber")
PUBLIC = os.path.join(AKAR, "public")
# ---- Tetapan pusat (ubah di sini, kemudian jalankan skrip ini semula) ----
SITE = "https://arismafoundation.org.my"   # URL penuh laman; WAJIB penuh untuk kad pratonton WhatsApp/Facebook (og:image, og:url)
WA_USERNAME = "OMARAHMAD1966"              # WhatsApp username Hj. Omar bin Ahmad (tanpa @). Pautan: wa.me/<username>
# ---------------------------------------------------------------------------
TURNSTILE = '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>'
DWI = re.compile(r"\[\[(.+?)\|\|(.+?)\]\]", re.S)


def dwibahasa(s):
    return DWI.sub(lambda m: f'<span lang="ms">{m.group(1)}</span><span lang="en">{m.group(2)}</span>', s)


def baca_halaman(fail):
    t = open(fail, encoding="utf-8").read()
    m = re.match(r"---\n(.*?)\n---\n(.*)", t, re.S)
    if not m:
        sys.exit(f"Tiada blok '---' di {fail}")
    meta = {}
    for baris in m.group(1).splitlines():
        if ":" in baris:
            k, v = baris.split(":", 1)
            meta[k.strip()] = v.strip()
    return meta, m.group(2)


def versi():
    """Cap jari ringkas kandungan CSS + JS. Berubah bila fail berubah, supaya pelayar sentiasa ambil versi baharu."""
    h = hashlib.md5()
    for f in sorted(glob.glob(os.path.join(PUBLIC, "css", "*.css")) + glob.glob(os.path.join(PUBLIC, "js", "*.js"))):
        h.update(open(f, "rb").read())
    return h.hexdigest()[:8]


def main():
    V = versi()
    kerangka = open(os.path.join(SUMBER, "kerangka.html"), encoding="utf-8").read()
    kaki = open(os.path.join(SUMBER, "kaki.html"), encoding="utf-8").read()
    n = 0
    for fail in sorted(glob.glob(os.path.join(SUMBER, "halaman", "*.html"))):
        meta, badan = baca_halaman(fail)
        nav = meta.get("nav", "")
        tambah = TURNSTILE if meta.get("turnstile") == "ya" else ""
        if meta.get("noindex") == "ya":
            tambah += '<meta name="robots" content="noindex">'
        k = (kerangka.replace("{{TAJUK}}", meta["tajuk"]).replace("{{DESKRIPSI}}", meta["desk"])
             .replace("{{OGIMG}}", meta.get("og", "/media/poster.jpg")).replace("{{KEPALA_TAMBAHAN}}", tambah))
        laman = "/" + meta["laluan"].replace("index.html", "")
        k = k.replace("{{SITE}}", SITE).replace("{{LAMAN}}", laman)
        k = re.sub(r' data-nav="([a-z]+)"', lambda m: ' aria-current="page"' if m.group(1) == nav else "", k)
        skrip = "".join(f'<script src="/js/{s.strip()}.js?v={V}"></script>\n' for s in meta.get("skrip", "").split(",") if s.strip())
        html = (k + badan + kaki.replace("{{SKRIP}}", skrip)).replace("{{V}}", V)
        html = html.replace("{{WA_URL}}", f"https://wa.me/{WA_USERNAME}").replace("{{WA_NAMA}}", f"@{WA_USERNAME}")
        html = dwibahasa(html)
        keluar = os.path.join(PUBLIC, meta["laluan"])
        os.makedirs(os.path.dirname(keluar), exist_ok=True)
        open(keluar, "w", encoding="utf-8").write(html)
        n += 1
    print(f"{n} halaman dijana (versi aset {V})")
    tinggal = []
    for f in glob.glob(os.path.join(PUBLIC, "**", "*.html"), recursive=True):
        if "[NOMBOR" in open(f, encoding="utf-8").read():
            tinggal.append(os.path.relpath(f, PUBLIC))
    if tinggal:
        print("AMARAN: masih ada ruang kosong [NOMBOR ...] dalam:", ", ".join(sorted(tinggal)))


if __name__ == "__main__":
    main()
