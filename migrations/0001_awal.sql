-- ARISMA Foundation: skema awal
-- Data peribadi sensitif (no. IC/pendaftaran, alamat, telefon) disimpan bersulit (AES-256-GCM).

CREATE TABLE IF NOT EXISTS derma (
  id           TEXT PRIMARY KEY,
  dicipta      TEXT NOT NULL,
  projek       TEXT NOT NULL,
  item         TEXT,
  papar_nama   INTEGER NOT NULL DEFAULT 0,
  jenis        TEXT NOT NULL CHECK (jenis IN ('individu','syarikat')),
  nama         TEXT NOT NULL,
  emel         TEXT NOT NULL,
  no_id_enc    TEXT NOT NULL,
  alamat_enc   TEXT NOT NULL,
  telefon_enc  TEXT NOT NULL,
  amaun_sen    INTEGER NOT NULL CHECK (amaun_sen > 0),
  billcode     TEXT UNIQUE,
  status       TEXT NOT NULL DEFAULT 'menunggu'
               CHECK (status IN ('menunggu','berjaya','semak','luput','batal')),
  refno        TEXT,
  saluran      TEXT,
  dibayar      TEXT,
  tahun_resit  INTEGER,
  siri_resit   INTEGER,
  emel_resit   TEXT,
  catatan      TEXT,
  UNIQUE (tahun_resit, siri_resit)
);
CREATE INDEX IF NOT EXISTS derma_status  ON derma (status, dicipta);
CREATE INDEX IF NOT EXISTS derma_projek  ON derma (projek, status, item);
CREATE INDEX IF NOT EXISTS derma_dibayar ON derma (dibayar);

-- Kutipan di luar talian (pindahan bank, DuitNow QR, cek, penaja korporat) supaya penjejak di laman tepat.
-- Masukkan melalui konsol D1. Resit untuk kutipan ini dikeluarkan secara manual.
CREATE TABLE IF NOT EXISTS kutipan_luar (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  projek     TEXT NOT NULL,
  item       TEXT,
  amaun_sen  INTEGER NOT NULL CHECK (amaun_sen > 0),
  tarikh     TEXT NOT NULL,
  catatan    TEXT
);

CREATE TABLE IF NOT EXISTS taja (
  id        TEXT PRIMARY KEY,
  dicipta   TEXT NOT NULL,
  syarikat  TEXT NOT NULL,
  pegawai   TEXT NOT NULL,
  jawatan   TEXT,
  emel      TEXT NOT NULL,
  telefon   TEXT NOT NULL,
  minat     TEXT NOT NULL,
  mesej     TEXT
);
