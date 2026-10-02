# Senarai semak sebelum laman ARISMA Foundation disiarkan

Tandakan [x] bila siap. Bahagian A mesti selesai sebelum kutipan dalam talian dibuka (`BUKA_SUMBANGAN = "ya"`).

## A. Patuh syarat dan dokumen (mesti, sebelum kutipan dibuka)
- [ ] **Contoh resit 44(6) diluluskan KPHDN.** Surat LHDN perenggan 3.1(d): contoh resit mesti dikemukakan untuk persetujuan sebelum digunakan. Cetak satu resit sandbox dan hantar.
- [ ] **Bukti untuk lencana Fisabilillah MAIS.** Dapatkan surat sebenar, letak sebagai `public/laporan/surat-mais.pdf`. Nota: surat iringan Taman Agro sebut "penerima Asnaf Fisabilillah oleh Lembaga Zakat Selangor (LZS)", brief bos sebut MAIS. Sahkan badan mana yang betul dan seragamkan ayat.
- [ ] **Apa maksud "NGO Mualim" dalam brief?** (Mungkin "Muallaf"?) Ayat itu tidak dimasukkan dalam laman sehingga disahkan.
- [ ] **Bukti pendaftaran JPM/BHEUU.** Sijil pemerbadanan (hitamkan no. kad pengenalan) sebagai `public/laporan/sijil-pemerbadanan.pdf`.
- [ ] **Taman Agro: tiada tanah atau bangunan tanpa kelulusan.** Perenggan 3.4(a) surat LHDN: pembelian atau pembinaan tanah/bangunan perlu kelulusan bertulis KPHDN terlebih dahulu. Surat iringan Taman Agro 2.0 (RM235,000) menyebut "pembangunan fizikal". Halaman Taman Agro kini hanya menerangkan latihan, elaun dan SDG, tanpa sasaran dana. Jangan buka kutipan untuknya sehingga jelas.
- [ ] **Siapa operator Taman Agro dan Infaq Jumaat?** Jika nanas dan hasil tani berasal daripada perniagaan Akademi (WIBARISMA), pembelian oleh Yayasan perlu pada harga pasaran, direkod dan dipisahkan (rujuk perenggan 3.3(e) dan 3.11(i)).
- [ ] **Lebihan DEGUP RM95k.** Dalam Pitch dan Strategik ia bertajuk "Dana Desa ARISMA". Laman kini kata lebihan disalurkan kepada program kesedaran. Pemegang amanah perlu putuskan secara rasmi (juga Terma & Syarat perenggan 4).
- [ ] **Kos filem DEGUP:** RM110k (Pitch, ada pecahan) atau RM150k (Strategik)? Laman guna RM110k.
- [ ] **e-Invois.** Penderma boleh meminta e-Invois (surat LHDN 3.2). Tentukan siapa mengeluarkannya melalui MyInvois dan bagaimana.
- [ ] **Ejen cukai / akauntan** semak: format resit, penajaan yang disertai manfaat (hak penamaan, iklan), dan layanan sumbangan korporat.
- [ ] **Akaun toyyibPay atas nama ARISMA Foundation** (bukan WIBARISMA), disahkan untuk mod live.
- [ ] **Peguam semak** Terma & Syarat dan Dasar Privasi (draf). Putuskan polisi pembetulan/pengembalian sumbangan dan sama ada perlu pegawai perlindungan data.
- [ ] Poster Infaq Jumaat ada ayat "melalui inisiatif sosial enterprise". Pastikan ayat ini tidak mengelirukan penderma bahawa dana Yayasan membiayai perniagaan.

## B. Bahan yang belum ada (laman sudah ada ruang)
- [ ] **QR DuitNow rasmi** daripada bank: `public/img/duitnow-qr.png`. (QR pada poster Infaq tidak dapat dinyahkod semasa semakan; uji dengan telefon sebelum guna.)
- [ ] **Gambar/video aktiviti** untuk hero dan seksyen (brief minta aktiviti kemasyarakatan). Kini hanya video logo.
- [ ] **Laporan aktiviti / buletin tahunan** sebagai `public/laporan/laporan-aktiviti.pdf`, dan surat kelulusan LHDN sebagai `kelulusan-44-6.pdf`.
- [ ] **Siri OKU Berdoa, Program MAIS, UIA & USIM:** tarikh, lokasi, gambar, nama pegawai rakan.
- [ ] **Solidarity with Raudhah Autisme:** butiran kerjasama, logo rakan, kebenaran menggunakan nama mereka.
- [ ] **Taman Agro:** gambar projek rintis 2018, data pelatih (dengan kebenaran keluarga).
- [ ] **E-mel dan telefon rasmi pejabat** (brief minta "E-mel Rasmi"; kini arisma2012@gmail.com dan telefon pengasas), waktu pejabat.
- [ ] **Senarai pemegang amanah semasa** (kini daripada notis 2019) dan jawatan pemungut pada resit (kini "Bendahari").
- [ ] Sahkan akaun media sosial (Facebook arisma2013, Instagram arisma2012).
- [ ] Harga seunit item DEGUP (`src/projek.js`) dan tajuk jelajah yang diseragamkan (Kembara DEGUP ARISMA 2027).

## C. Pemasangan teknikal (ikut BACA-SAYA.md)
- [ ] Build Cloudflare berjaya dan D1 `arisma-foundation` wujud; jalankan `migrations/0001_awal.sql` di D1 Console.
- [ ] Turnstile (ganti kunci ujian), rahsia (`TURNSTILE_SECRET`, `TOYYIBPAY_*`, `KUNCI_DATA`, `KUNCI_RESIT`, `RESEND_API_KEY`). Simpan salinan `KUNCI_DATA` di pengurus kata laluan.
- [ ] Beli domain `arismafoundation.org.my` (pendaftar MYNIC), sambung ke Cloudflare, isi `LAMAN_URL`.
- [ ] Resend: sahkan domain, isi `EMEL_DARI` dan `EMEL_PENTADBIR`.
- [ ] Cloudflare Access untuk `/pentadbir/*`; 2FA akaun; DNSSEC; Always HTTPS.
- [ ] Uji sandbox toyyibPay hingga resit sampai, kemudian tukar ke live dan `BUKA_SUMBANGAN = "ya"`.
- [ ] Laman Akademi: isi `yayasan_sumbang` supaya butang Sumbang menunjuk ke laman ini.
