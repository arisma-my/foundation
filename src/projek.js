// Senarai projek ARISMA Foundation. Satu-satunya tempat untuk tambah / ubah projek.
// Projek baharu: tambah satu entri di sini (id huruf kecil), kemudian tambah kad di laman utama.
// Amaun dalam RM. sasaran: 0 = tiada sasaran (projek berterusan).
// item: pecahan kos yang boleh ditaja satu per satu (gaya "pilih apa yang anda taja").

export const PROJEK = {
  degup2027: {
    ms: "Kembara DEGUP ARISMA 2027",
    en: "Kembara DEGUP ARISMA 2027",
    bil: "Kembara DEGUP 2027",
    sasaran: 330000,
    min: 10,
    pratetap: [50, 100, 250, 500],
    item: {
      filem: {
        ms: "Produksi filem DEGUP", en: "DEGUP film production",
        ket_ms: "Pra-produksi, penggambaran dan pasca-produksi filem pendek 30 minit.",
        ket_en: "Pre-production, filming and post-production of the 30-minute short film.",
        sasaran: 110000, unit: 500, keutamaan: "tinggi"
      },
      dewan: {
        ms: "Dewan dan pawagam komuniti", en: "Halls and community cinemas",
        ket_ms: "Tempat tayangan di 10 lokasi, kira-kira 300 kerusi setiap satu.",
        ket_en: "Screening venues in 10 locations, around 300 seats each.",
        sasaran: 40000, unit: 4000, keutamaan: "tinggi"
      },
      logistik: {
        ms: "Logistik jelajah", en: "Tour logistics",
        ket_ms: "Pergerakan pasukan dan peralatan ke 10 lokasi.",
        ket_en: "Moving the team and equipment to 10 locations.",
        sasaran: 35000, unit: 3500, keutamaan: "sederhana"
      },
      jamuan: {
        ms: "Jamuan penonton", en: "Audience refreshments",
        ket_ms: "Jamuan ringan untuk 3,000 penonton. Satu unit menjamu 10 orang.",
        ket_en: "Light refreshments for 3,000 people. One unit serves 10.",
        sasaran: 30000, unit: 100, keutamaan: "sederhana"
      },
      pemasaran: {
        ms: "Hebahan dan publisiti", en: "Outreach and publicity",
        ket_ms: "Supaya keluarga, sekolah dan komuniti tahu dan hadir.",
        ket_en: "So families, schools and communities know and attend.",
        sasaran: 20000, unit: 200, keutamaan: "sederhana"
      },
      susulan: {
        ms: "Program kesedaran susulan", en: "Follow-up awareness programmes",
        ket_ms: "Forum, bahan pendidikan dan sokongan keluarga selepas jelajah tamat.",
        ket_en: "Forums, learning materials and family support after the tour.",
        sasaran: 95000, unit: 100, keutamaan: "rendah"
      }
    }
  },
  infaq: {
    ms: "Infaq Jumaat",
    en: "Infaq Jumaat",
    bil: "Infaq Jumaat ARISMA",
    sasaran: 0,
    min: 5,
    pratetap: [5, 10, 20, 50]
  },
  umum: {
    ms: "Dana am ARISMA Foundation",
    en: "ARISMA Foundation general fund",
    bil: "Dana am ARISMA Foundation",
    sasaran: 0,
    min: 10,
    pratetap: [50, 100, 250, 500]
  }
};

export function namaPeruntukan(projek, item, bahasa = "ms") {
  const p = PROJEK[projek];
  if (!p) return projek;
  const i = item && p.item && p.item[item];
  return i ? `${p[bahasa]}: ${i[bahasa]}` : p[bahasa];
}

// Versi awam untuk pelayar (tiada rahsia di sini, tetapi kekalkan bentuk yang stabil)
export function projekAwam() {
  const o = {};
  for (const [id, p] of Object.entries(PROJEK)) {
    o[id] = { ms: p.ms, en: p.en, sasaran: p.sasaran, min: p.min, pratetap: p.pratetap };
    if (p.item) {
      o[id].item = {};
      for (const [k, i] of Object.entries(p.item)) {
        o[id].item[k] = { ms: i.ms, en: i.en, ket_ms: i.ket_ms, ket_en: i.ket_en, sasaran: i.sasaran, unit: i.unit, keutamaan: i.keutamaan };
      }
    }
  }
  return o;
}
