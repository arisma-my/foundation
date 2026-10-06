# ARISMA Foundation: laman web di Cloudflare

> **Mengemas kini fail, commit ke GitHub dan menyemak deploy: baca `PANDUAN-GITHUB.md` dahulu.** Ia menerangkan di mana setiap perubahan dibuat supaya tidak tersilap. Apa yang masih perlu disediakan ada dalam `SENARAI-SEMAK.md`.

Satu Cloudflare Worker melayan laman statik (`public/`) dan backend sumbangan (`src/`).
Data disimpan dalam Cloudflare D1. Tiada Vercel, Google Sheet atau Apps Script.

```
public/                   LAMAN YANG DIDEPLOY (HTML, CSS, JS, imej, video)
  index.html              utama: video logo, hero, lencana kredibiliti, mengenai, 4 inisiatif, program, sumbang, tadbir urus
  siapa-kami/             visi, misi, objektif, tadbir urus + senarai pemegang amanah
  kredibiliti/            JPM/BHEUU, ALPA, Fisabilillah MAIS, potongan cukai 44(6), laporan ketelusan
  program/                OKU Berdoa, Program MAIS, UIA & USIM, aktiviti kesedaran
  inisiatif/              senarai 4 inisiatif
    (degup2027/ taman-agro/ infaq-jumaat/ solidarity-raudhah/ ialah halaman setiap inisiatif)
  hubungi/                lokasi + borang pertanyaan / CSR / penajaan
  sumbang/                borang sumbangan semua projek (+ selesai/ selepas bayar)
  terma/  privasi/        Terma & Syarat, Dasar Privasi (DRAF, semak dengan peguam)
  media/                  intro.mp4 + poster.jpg (video logo)
  img/                    logo-emas.png, favicon.png, infaq-jumaat.jpg (poster asal 904x1280)
  _headers                pengepala keselamatan fail statik
sumber/                   PILIHAN: kerangka menu/kaki + isi halaman + bina.py (jana semula public/*.html)
src/                      backend (Worker)
  index.js  penghala + cron          projek.js  SENARAI PROJEK & ITEM (sasaran, unit, minimum)
  sumbang.js  sumbangan, pengesahan  toyyibpay.js  klien toyyibPay
  resit.js  resit 44(6) web + e-mel  awam.js  /api/tetapan, /api/kutipan, /api/taja (pertanyaan & penajaan)
  pentadbir.js  eksport CSV (Access) util.js  keselamatan, penyulitan
migrations/0001_awal.sql  skema pangkalan data
wrangler.jsonc            tetapan Worker
SENARAI-SEMAK.md          apa yang masih perlu disediakan sebelum siar
```

## Apa yang menjaga keselamatan

- Status bayaran **sentiasa disahkan terus dengan toyyibPay**. Callback dan URL pulang hanya dianggap isyarat, jadi bayaran palsu tidak boleh menghasilkan resit.
- Nombor resit `AF/TAHUN/000001` diberi dalam satu kenyataan pangkalan data atomik: tiada nombor berulang, tiada resit pendua.
- No. IC / pendaftaran, alamat dan telefon penderma disimpan **bersulit AES-256-GCM**. Konsol D1 hanya menunjukkan teks tersulit.
- Borang dilindungi Cloudflare Turnstile, had kadar per IP, semakan asal permintaan (CSRF) dan had saiz input.
- CSP ketat (tiada skrip sebaris), HSTS, larangan bingkai, `nosniff`, Permissions-Policy.
- Pautan resit ditandatangani HMAC dan tamat selepas 30 hari. Salinan penuh ada dalam e-mel penderma.
- Eksport data pentadbir hanya melalui Cloudflare Access, dan Worker mengesahkan token Access sendiri.
- Rahsia (kunci toyyibPay, Turnstile, penyulitan) disimpan sebagai Secret di Cloudflare, bukan dalam kod.

---

## Pasang (tanpa domain dahulu)

### 0. Akaun
- Cloudflare: aktifkan **2FA** (My Profile > Authentication).
- GitHub: cipta repo **Private** dan muat naik semua fail folder ini.

### 1. Sambung repo kepada Cloudflare
1. **Workers & Pages > Create > Import a repository** > pilih repo. Nama Worker: `foundation` (sama dengan `name` dalam `wrangler.jsonc`).
2. Arahan deploy: `npx wrangler deploy`. Klik **Deploy**.
3. Pangkalan data D1 `arisma-foundation` dicipta **automatik** semasa deploy pertama. Tiada ID perlu ditampal.
4. Anda dapat alamat `https://foundation.<nama-akaun>.workers.dev`. Laman sudah boleh dilihat.
   Setiap kali anda push ke GitHub, Cloudflare deploy semula secara automatik.

### 2. Isi jadual pangkalan data (sekali sahaja)
Cloudflare > **Storage & databases > D1 SQL database > arisma-foundation > Console**.
Tampal seluruh isi `migrations/0001_awal.sql` > **Execute**. Tanpa langkah ini, kutipan dan sumbangan tidak berfungsi.

### 3. Turnstile (anti-bot)
1. **Turnstile > Add widget**. Hostname: alamat workers.dev di atas. Mode: Managed.
2. Salin **Site Key** ke `TURNSTILE_SITEKEY` dalam `wrangler.jsonc`.
3. Simpan **Secret Key** untuk langkah 4.

### 4. Rahsia
Worker > **Settings > Variables and Secrets > Add**, jenis **Secret**:

| Nama | Nilai |
|---|---|
| `TURNSTILE_SECRET` | Secret Key Turnstile |
| `TOYYIBPAY_SECRET` | userSecretKey toyyibPay (sandbox dahulu) |
| `TOYYIBPAY_CATEGORY` | categoryCode toyyibPay |
| `KUNCI_DATA` | kunci penyulitan, lihat di bawah |
| `KUNCI_RESIT` | kunci tandatangan resit, lihat di bawah |
| `RESEND_API_KEY` | selepas domain dibeli (langkah 7) |

Jana `KUNCI_DATA` dan `KUNCI_RESIT` (dua kali, nilai berbeza): buka mana-mana laman, tekan F12 > Console, tampal:

```js
btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
```

**Simpan salinan `KUNCI_DATA` dalam pengurus kata laluan Yayasan.** Jika hilang, no. IC dan alamat penderma tidak boleh dibaca semula. Jangan sekali-kali tukar kunci ini selepas kutipan bermula.

Dalam `wrangler.jsonc`, isi `LAMAN_URL` dengan alamat workers.dev, commit.

### 5. Uji dengan toyyibPay sandbox
1. Daftar di `dev.toyyibpay.com`, cipta Category, ambil userSecretKey dan categoryCode.
2. `wrangler.jsonc`: pastikan `TOYYIBPAY_BASE` = `https://dev.toyyibpay.com`, tukar `BUKA_SUMBANGAN` ke `"ya"`. Commit.
3. Buat sumbangan ujian di `/sumbang/`. Selepas bayar, halaman selesai tunjuk no. resit dan pautan resit.
4. Semak dalam D1 Console: `SELECT id, status, amaun_sen, tahun_resit, siri_resit, emel_resit FROM derma;`
5. Selesai menguji: kembalikan `BUKA_SUMBANGAN` ke `"tidak"` sehingga langkah 6–8 siap.

---

## Sebelum kutipan sebenar dibuka

Jangan buka kutipan awam sehingga **ketiga-tiga** ini selesai:

1. **Contoh resit diluluskan KPHDN.** Surat kelulusan perenggan 3.1(d) mewajibkan contoh resit dikemukakan untuk persetujuan sebelum digunakan. Cetak satu resit sandbox (butang Cetak / simpan PDF) dan kemukakan. Jika LHDN minta ubah format, ubah `src/resit.js`.
2. **Akaun toyyibPay atas nama ARISMA Foundation** (bukan WIBARISMA), disahkan untuk mod live.
3. **Domain dibeli dan disambung** (langkah 6–7), supaya penderma nampak alamat rasmi dan resit boleh dihantar melalui e-mel.

Kemudian: `TOYYIBPAY_BASE` = `https://toyyibpay.com`, tukar dua rahsia toyyibPay kepada akaun live, `BUKA_SUMBANGAN` = `"ya"`.

## 6. Domain
1. Beli `arismafoundation.org.my` melalui pendaftar MYNIC (perlukan sijil pemerbadanan Yayasan).
2. Cloudflare > **Add a domain** > pelan Free. Tukar nameserver di pendaftar kepada yang Cloudflare beri.
3. Worker > **Settings > Domains & Routes > Add > Custom domain**: `arismafoundation.org.my` dan `www.arismafoundation.org.my`.
4. `LAMAN_URL` dalam `wrangler.jsonc` sudah diisi `https://arismafoundation.org.my` (tukar kepada versi `www` jika itu alamat utama). Tambah domain pada widget Turnstile. Jangan tambah domain dalam `wrangler.jsonc` (urus di dashboard sahaja).
5. Tetapan zon domain:
   - **SSL/TLS > Edge Certificates**: Always Use HTTPS = On, Minimum TLS = 1.2.
   - **DNS > Settings**: Enable DNSSEC, kemudian masukkan rekod DS di pendaftar.
   - **Security > Bots**: Bot Fight Mode = On.
   - **Security > WAF**: aktifkan peraturan terurus (managed rules) yang tersedia.

## 7. E-mel resit (Resend)
1. Daftar di resend.com > **Domains > Add** `arismafoundation.org.my`. Masukkan rekod DNS yang diberi ke Cloudflare DNS.
2. Cipta API key > simpan sebagai Secret `RESEND_API_KEY`.
3. `wrangler.jsonc`: `EMEL_DARI` = `"ARISMA Foundation <resit@arismafoundation.org.my>"`, `EMEL_PENTADBIR` = e-mel bendahari (menerima salinan setiap resit dan notis penajaan).

Tanpa Resend, sistem tetap berfungsi: penderma dapat resit di halaman selesai, dan e-mel ditanda `tiada konfigurasi`.

## 8. Akses pentadbir (eksport CSV)
1. **Zero Trust > Access > Applications > Add > Self-hosted**. Domain: `arismafoundation.org.my`, path: `pentadbir`.
2. Policy: Allow, Emails = e-mel bendahari dan pentadbir. Kaedah log masuk: One-time PIN.
3. Salin **Application Audience (AUD) Tag** ke `ACCESS_AUD`, dan nama pasukan (`<nama>.cloudflareaccess.com`) ke `ACCESS_TEAM_DOMAIN` dalam `wrangler.jsonc`.
4. Muat turun:
   - `https://arismafoundation.org.my/pentadbir/sumbangan.csv?dari=2027-01-01&hingga=2027-12-31`
   - `https://arismafoundation.org.my/pentadbir/taja.csv`

CSV mengandungi no. IC dan alamat penuh untuk e-Invois dan audit. Simpan di tempat terkawal.

---

## Kerja harian

**Kutipan luar talian** (pindahan bank, cek, penaja korporat) supaya penjejak di laman tepat. D1 Console:
```sql
INSERT INTO kutipan_luar (projek, item, amaun_sen, tarikh, catatan)
VALUES ('degup2027', 'dewan', 1500000, '2027-02-01', 'Penaja zonal: Syarikat X');
```
`projek`: `degup2027`, `infaq` atau `umum`. `item`: id item dalam `src/projek.js`, atau `NULL` untuk
"di mana paling diperlukan". `amaun_sen` dalam sen (RM15,000 = 1500000). Resit untuk kutipan ini dikeluarkan secara manual.

**Tambah atau ubah projek / item / sasaran**: sunting `src/projek.js`, commit. Untuk projek baharu, tambah juga
satu kad dalam bahagian Projek di `public/index.html` (salin kad Infaq Jumaat) dan halaman sendiri jika perlu.

**DuitNow QR Infaq**: QR dalam poster tidak dapat disahkan dari sini, jadi ia tidak dipaparkan berasingan.
Jika ada fail QR rasmi daripada bank, letak sebagai `public/img/duitnow.png` dan tambah `<img class="qr">` dalam
`public/infaq-jumaat/index.html` di kotak Pindahan bank.

**Sumbangan berstatus `semak`**: amaun dibayar tidak sama dengan amaun bil. Semak di dashboard toyyibPay sebelum tindakan.

**Video logo**: `public/media/intro.mp4` dan `poster.jpg` sudah ada. Jika video tidak dapat dimainkan, poster dipaparkan.

**Fail pilihan yang muncul sendiri** (letak fail, commit, selesai; tiada kod perlu diubah):
- `public/img/duitnow-qr.png`: kod QR DuitNow rasmi ARISMA Foundation, muncul di laman utama dan halaman Infaq.
- `public/laporan/kelulusan-44-6.pdf`, `sijil-pemerbadanan.pdf`, `laporan-aktiviti.pdf`, `surat-mais.pdf`: muncul dengan butang Muat turun di halaman Kredibiliti. Sebelum itu, ia tertulis "Akan dimuat naik". Hitamkan no. kad pengenalan dalam sijil sebelum memuat naik.

**Cache CSS/JS**: pautan CSS/JS dalam HTML ada `?v=...` dan `public/_headers` menetapkan `no-cache`, jadi perubahan gaya/skrip sampai kepada pelawat selepas deploy. Jika anda ubah `public/css` atau `public/js` tanpa menjalankan `sumber/bina.py`, tukar nombor `?v=` secara manual dalam fail HTML (atau tekan Ctrl+Shift+R semasa menguji).

**Menu & kaki halaman**: dikongsi oleh semua halaman. Jika anda ada Python, ubah `sumber/kerangka.html` atau `sumber/kaki.html`, kemudian jalankan `python3 sumber/bina.py` untuk menjana semula semua halaman. Jika tidak, ubah menu/kaki dalam setiap fail `public/**/index.html`.

**Ubah teks**: sunting fail HTML terus. Setiap teks ada dua versi, `<span lang="ms">` dan `<span lang="en">`. Teks dalam `sumber/halaman/*.html` ditulis sebagai `[[teks BM||English text]]`.

**Pemegang amanah**: senarai dalam `public/index.html` (bahagian Tadbir urus) diambil daripada notis 2019. Sahkan sebelum siar.

**Sasaran**: dalam `src/projek.js` (DEGUP RM330,000; setiap item ada sasaran dan harga seunit sendiri).

**Gerakan laman**: peralihan antara halaman guna View Transitions (Chrome, Edge, Safari 18.2+; pelayar lain
terus buka halaman seperti biasa). Tajuk muncul perkataan demi perkataan dan blok muncul ketika skrol.
Semua gerakan dimatikan jika pengguna memilih "kurangkan gerakan" dalam tetapan peranti.

## Laman Akademi
Dalam `index.html` Akademi, isi `yayasan_sumbang` (atau tetapan Sheet `pautan_sumbang_yayasan`) dengan
`https://arismafoundation.org.my/sumbang/` (sebelum domain: alamat workers.dev + `/sumbang/`).
Butang "Sumbang melalui ARISMA Foundation" akan muncul. Laluan `/api/desa` dalam Worker Akademi tidak digunakan lagi.

## Uji di komputer (pilihan)
```
npm install
cp .dev.vars.contoh .dev.vars     # isi nilai
npm run db:local
npm run dev                       # http://localhost:8787
```

## Halaman Program & Acara: tab dan galeri gambar
- Empat bahagian program ialah **tab** (kandungan bertukar di tempat). Semuanya dalam `sumber/halaman/program.html`. Setiap tab ialah satu `<div class="tab-panel" id="...">`; butangnya dalam `.tab-bar`. `id` panel mesti sama dengan `aria-controls` butang, kerana pautan menu `/program/#mais` membuka tab yang betul. Tanpa JavaScript semua bahagian dipaparkan bersusun.
- **Menambah gambar ke galeri:** letak fail dalam `public/img/`, kemudian bungkus gambar begini (kumpulan yang sama = boleh ke gambar seterusnya):
  `<a class="galeri-pautan" data-galeri="oku" href="/img/nama.jpg" aria-label="Lihat gambar / View image"><img src="/img/nama.jpg" alt="Huraian gambar" width="..." height="..." loading="lazy"></a>`
  Acara baharu guna nama kumpulan lain (cth. `data-galeri="mais"`). Isi `width` dan `height` sebenar supaya halaman tidak terenjat. Jalankan `python3 sumber/bina.py` selepas edit `sumber/`.
- Fail: `public/js/program.js` (tab) dan `public/js/galeri.js` (paparan besar). Untuk gunakan galeri di halaman lain, tambah `skrip: galeri` pada blok `---` halaman itu.

