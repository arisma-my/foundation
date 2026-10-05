# Panduan GitHub dan Cloudflare: kemas kini tanpa tersilap

Repo: `arisma-my/foundation`. Setiap commit ke cabang `main` akan dibina dan dideploy oleh Cloudflare secara automatik (kira-kira 1 hingga 2 minit).

## Empat peraturan yang mengelakkan 90% kesilapan

1. **`wrangler.jsonc` mesti berada di akar repo**, iaitu di halaman paling atas repo, bukan di dalam folder. Kalau ia terletak di `arisma-foundation/wrangler.jsonc`, build akan gagal.
2. **Pembolehubah biasa diubah di GitHub, rahsia diubah di Cloudflare.**
   - Nilai biasa (`LAMAN_URL`, `BUKA_SUMBANGAN`, `TOYYIBPAY_BASE`, `EMEL_DARI`, dan seumpamanya) ialah baris dalam `wrangler.jsonc`. **Jangan edit nilai ini di dashboard Cloudflare.** Deploy seterusnya akan menimpanya semula dengan nilai dalam GitHub.
   - Rahsia (kunci toyyibPay, Turnstile, penyulitan) hanya dimasukkan di dashboard sebagai jenis **Secret**. **Jangan sekali-kali tulis di GitHub.**
3. **Setiap commit ke `main` terus mengubah laman sebenar.** Kumpulkan beberapa perubahan dalam satu commit, dan tulis mesej commit yang jelas.
4. **Jangan tambah `routes` atau domain dalam `wrangler.jsonc`.** Domain diurus di dashboard (Worker, Settings, Domains & Routes). Mencampurkan kedua-duanya boleh menggagalkan seluruh build.

## Susunan repo yang betul (halaman paling atas)

```
.gitignore
BACA-SAYA.md
PANDUAN-GITHUB.md
SENARAI-SEMAK.md
package.json
wrangler.jsonc
migrations/
public/
src/
sumber/
```

Kalau yang kelihatan ialah satu folder bernama `arisma-foundation` sahaja, susunan salah. Pindahkan isinya ke atas.

---

## Cara A: dengan Git (disyorkan, paling kurang risiko)

1. Ekstrak zip. Di dalamnya ada satu folder `arisma-foundation`. **Isi folder itulah** yang akan disalin, bukan folder itu sendiri.
2. Buka terminal:
   ```
   git clone https://github.com/arisma-my/foundation.git
   cd foundation
   ```
3. Padam semua kandungan folder `foundation` **kecuali folder tersembunyi `.git`**. Kemudian salin masuk semua isi folder `arisma-foundation` daripada zip (termasuk fail tersembunyi seperti `.gitignore`).
4. Semak apa yang berubah:
   ```
   git status
   ```
   Pastikan `wrangler.jsonc` disenaraikan di paling atas (bukan `arisma-foundation/wrangler.jsonc`).
5. Hantar:
   ```
   git add -A
   git commit -m "Kemas kini laman v4.3"
   git push
   ```

## Cara B: melalui laman GitHub (tanpa Git)

1. Ekstrak zip. Buka folder `arisma-foundation` di dalamnya. Pada Windows, hidupkan "Show hidden items" supaya `.gitignore` kelihatan.
2. Di GitHub, buka repo `arisma-my/foundation`, **Add file, Upload files**.
3. Dalam folder `arisma-foundation`, tekan **Ctrl+A** (pilih semua) dan seret ke kawasan muat naik. Anda menyeret isi, bukan fail zip dan bukan folder luar.
4. Tunggu semua fail dan folder naik. Di bawah, taip mesej commit dan pilih **Commit directly to the main branch**.
5. Selepas itu, **semak halaman paling atas repo** (lihat susunan di atas). Ini langkah yang paling kerap dilupakan.

Nota: muat naik melalui web hanya menimpa dan menambah fail. Ia tidak memadam fail lama. Dalam kemas kini ini tiada fail yang perlu dipadam.

## Cara C: ubah satu fail sahaja

**Menggantikan satu fail dengan fail baharu** (contoh `src/util.js`):
1. Di GitHub, klik masuk ke folder `src`.
2. **Add file, Upload files**, seret `util.js` sahaja, dan commit. Fail itu menimpa yang lama.

**Menukar satu baris** (contoh nilai dalam `wrangler.jsonc`):
1. Klik `wrangler.jsonc`, kemudian ikon pensel.
2. Ubah **hanya nilai di dalam tanda petik**. Jangan padam koma di hujung baris atau tanda petik.
3. **Commit changes**, kemudian pilih Commit directly to the `main` branch.

---

## Apa diubah di mana

| Perkara | Tempat | Cara |
|---|---|---|
| `LAMAN_URL`, `BUKA_SUMBANGAN`, `TOYYIBPAY_BASE` | `wrangler.jsonc` di GitHub | pensel, commit |
| `TURNSTILE_SITEKEY` (awam) | `wrangler.jsonc` di GitHub | pensel, commit |
| `EMEL_DARI`, `EMEL_PENTADBIR`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` | `wrangler.jsonc` di GitHub | pensel, commit |
| Teks, gambar, halaman | fail dalam `public/` | muat naik atau pensel |
| Senarai projek dan sasaran | `src/projek.js` | pensel, commit |
| `TURNSTILE_SECRET`, `TOYYIBPAY_SECRET`, `TOYYIBPAY_CATEGORY`, `KUNCI_DATA`, `KUNCI_RESIT`, `RESEND_API_KEY` | **Dashboard Cloudflare sahaja** | Worker `foundation`, Settings, Variables and Secrets, Add, jenis **Secret** |

`LAMAN_URL` sudah diisi `https://arismafoundation.org.my`. Jika bos mahu alamat utama dengan `www`, tukar kepada `https://www.arismafoundation.org.my`. Borang tetap berfungsi pada kedua-dua alamat.

## Susunan "buka laman" (satu langkah demi satu langkah)

1. **Sekarang:** commit versi ini (dengan `LAMAN_URL` sudah diisi). Tunggu build berjaya. Buka `https://arismafoundation.org.my` dan `https://www.arismafoundation.org.my`, tekan Ctrl+Shift+R. Uji pada telefon (data mudah alih dan Wi-Fi).
2. **Selepas domain disahkan berfungsi:** dalam `wrangler.jsonc`, buang tanda `//` di hadapan dua baris `workers_dev` dan `preview_urls`, kemudian commit. Alamat `workers.dev` dan pautan pratonton awam akan ditutup.
3. **Kemudian, satu persatu:** isi rahsia (Turnstile, toyyibPay, kunci), `TURNSTILE_SITEKEY` sebenar, e-mel Resend, Access.
4. **Terakhir, dalam satu commit:** `TOYYIBPAY_BASE` ke `https://toyyibpay.com` dan `BUKA_SUMBANGAN` ke `"ya"`. Hanya selepas resit diluluskan KPHDN dan akaun toyyibPay live sedia.

## Selepas setiap commit

1. Cloudflare, Workers & Pages, `foundation`, tab **Deployments** (atau Builds). Pastikan entri paling atas berstatus berjaya dan bertarikh baharu.
2. Buka laman dan tekan **Ctrl+Shift+R**.
3. Pastikan di Settings, Domains & Routes, **kedua-dua domain masih tersenarai**.

## Jika build gagal

Buka log build, lihat baris yang bermula dengan `ERROR`.

| Mesej atau gejala | Punca | Penyelesaian |
|---|---|---|
| Tidak jumpa konfigurasi / `No config` | `wrangler.jsonc` bukan di akar repo | Betulkan susunan repo (peraturan 1) |
| `Unexpected token`, `parse error`, ralat JSON | Koma atau tanda petik hilang dalam `wrangler.jsonc` | Buka fail, semak baris yang diubah, atau kembalikan versi asal |
| `database_id` tidak sah | Baris `database_id` ditambah semula dengan nilai palsu | Buang baris itu; pangkalan data dicipta automatik |
| Amaran nama Worker tidak sepadan | `name` dalam fail berbeza daripada nama Worker | `name` mesti `"foundation"` |
| Build gagal selepas `routes` ditambah | Domain dicampur dalam konfigurasi | Buang `routes`; urus domain di dashboard |

Cloudflare mungkin membuka **Pull Request** automatik di GitHub kononnya untuk membetulkan nama Worker. Nama dalam fail sudah betul, jadi PR itu boleh **ditutup** (Close) tanpa digabungkan.

## Jika tersilap

- **Kembalikan commit:** GitHub, Commits, klik commit yang bermasalah, butang **Revert**, kemudian gabungkan (Merge) PR yang dibuka. Cloudflare akan deploy versi lama.
- **Kecemasan:** Cloudflare, Workers & Pages, `foundation`, Deployments, pilih versi sebelumnya, Rollback. Selepas itu betulkan di GitHub supaya commit seterusnya tidak membawa balik kesilapan.

## Keselamatan GitHub

- Repo mesti **Private**.
- Hidupkan 2FA untuk setiap ahli organisasi `arisma-my` (Organization settings, Authentication security).
- Hanya orang yang perlu diberi kebenaran menulis (Write) ke repo.
- Jangan commit fail `.dev.vars` atau mana-mana rahsia. `.gitignore` sudah menyekatnya, tapi semak sebelum memuat naik secara manual.
