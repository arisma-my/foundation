# ARISMA Foundation: laman web di Cloudflare

Satu Cloudflare Worker melayan laman statik (`public/`) dan backend sumbangan (`src/`).
Data disimpan dalam Cloudflare D1. Tiada Vercel, Google Sheet atau Apps Script.

```
public/                 laman awam (HTML, CSS, JS, video)
  index.html            laman utama: video logo, tentang, projek, tadbir urus & pemegang amanah
  degup2027/            kempen Kembara DEGUP 2027: kutipan, item yang boleh ditaja, penajaan korporat
  infaq-jumaat/         projek Infaq Jumaat
  sumbang/              borang sumbangan semua projek (+ selesai/ selepas bayar)
  media/                intro.mp4 dan poster.jpg (video logo)
  img/                  logo emas, favicon, poster Infaq Jumaat
  _headers              pengepala keselamatan untuk fail statik
src/                    backend (Worker)
  index.js              penghala + cron
  projek.js             SENARAI PROJEK & ITEM (sasaran, unit, amaun minimum)
  sumbang.js            cipta sumbangan, sahkan bayaran, cron
  toyyibpay.js          klien toyyibPay
  resit.js              resit rasmi 44(6) (web + e-mel)
  awam.js               /api/tetapan, /api/kutipan, /api/taja
  pentadbir.js          eksport CSV (dilindungi Cloudflare Access)
  util.js               keselamatan, penyulitan, utiliti
migrations/0001_awal.sql  skema pangkalan data
wrangler.jsonc          tetapan Worker
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

### 1. Cipta pangkalan data D1
1. Dashboard Cloudflare > **Storage & databases > D1 SQL database > Create**. Nama: `arisma-foundation`.
2. Salin **Database ID**, tampal dalam `wrangler.jsonc` menggantikan `GANTI-DENGAN-DATABASE-ID`. Commit ke GitHub.
3. Buka pangkalan data itu > **Console**. Tampal seluruh isi `migrations/0001_awal.sql` > **Execute**.

### 2. Sambung repo kepada Cloudflare
1. **Workers & Pages > Create > Import a repository** > pilih repo.
2. Biarkan arahan deploy `npx wrangler deploy`. Klik **Deploy**.
3. Anda dapat alamat `https://arisma-foundation.<nama-akaun>.workers.dev`. Laman sudah boleh dilihat.
   Setiap kali anda push ke GitHub, Cloudflare deploy semula secara automatik.

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
4. Kemas kini `LAMAN_URL` = `https://arismafoundation.org.my`. Tambah hostname domain dalam widget Turnstile.
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

**Ubah teks**: sunting fail HTML terus. Setiap teks ada dua versi, `<span lang="ms">` dan `<span lang="en">`. Kepala dan kaki halaman berulang dalam 6 fail HTML.

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
