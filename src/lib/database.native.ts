// ─── database.native.ts — SQLite SE2026 ──────────────────────────────────────
// Hierarki: SLS → RT → Bangunan → KK → Foto
// Nomor urut Bangunan & KK bisa diisi manual atau auto-increment per parent.

import * as SQLite from "expo-sqlite";

// ─── Tipe ─────────────────────────────────────────────────────────────────────
export type SLS = {
  id:         number;
  nama:       string;       // nama SLS/wilayah kerja, misal "Desa Sumberharjo"
  kode:       string;       // kode unik SLS
  kecamatan:  string | null;
  kabupaten:  string | null;
  catatan:    string | null;
  created_at: string;
};

export type RT = {
  id:         number;
  sls_id:     number;
  nama_rt:    string;       // "RT 01", "RT 02", dst
  nama_rw:    string | null;
  ketua_rt:   string | null;
  catatan:    string | null;
  created_at: string;
  // virtual
  jumlah_bangunan?: number;
  jumlah_kk?:       number;
};

export type Bangunan = {
  id:          number;
  rt_id:       number;
  nomor_urut:  string;      // nomor urut bangunan (input manual atau auto)
  jenis:       string;
  alamat:      string | null;
  lat:         number | null;
  lng:         number | null;
  catatan:     string | null;
  synced:      number;
  created_at:  string;
  // virtual
  jumlah_kk?:  number;
  nama_rt?:    string;
  nama_sls?:   string;
};

export type KK = {
  id:             number;
  bangunan_id:    number;
  nomor_urut:     string;   // nomor urut KK (input manual atau auto)
  nama_kk:        string;
  nama_kepala:    string | null;
  jumlah_anggota: number;
  catatan:        string | null;
  synced:         number;
  created_at:     string;
};

export type Foto = {
  id:          number;
  bangunan_id: number;
  kk_id:       number | null;
  uri:         string;
  cloud_url:   string | null;
  keterangan:  string | null;
  synced:      number;
  created_at:  string;
};

// ─── Singleton ────────────────────────────────────────────────────────────────
let _db: SQLite.SQLiteDatabase | null = null;
async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync("se2026.db");
  return _db;
}

// ─── Init + Migrasi ───────────────────────────────────────────────────────────
export async function initDB(): Promise<void> {
  const db = await getDB();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- SLS (Satuan Lingkungan Setempat / Wilayah Kerja)
    CREATE TABLE IF NOT EXISTS sls (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nama        TEXT    NOT NULL,
      kode        TEXT    NOT NULL UNIQUE,
      kecamatan   TEXT,
      kabupaten   TEXT,
      catatan     TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- RT dalam SLS
    CREATE TABLE IF NOT EXISTS rt (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      sls_id      INTEGER NOT NULL REFERENCES sls(id) ON DELETE CASCADE,
      nama_rt     TEXT    NOT NULL,
      nama_rw     TEXT,
      ketua_rt    TEXT,
      catatan     TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- Bangunan dalam RT (nomor urut bisa manual)
    CREATE TABLE IF NOT EXISTS bangunan (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      rt_id       INTEGER NOT NULL REFERENCES rt(id) ON DELETE CASCADE,
      nomor_urut  TEXT    NOT NULL,
      jenis       TEXT    NOT NULL DEFAULT 'Rumah',
      alamat      TEXT,
      lat         REAL,
      lng         REAL,
      catatan     TEXT,
      synced      INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- KK dalam Bangunan (nomor urut bisa manual)
    CREATE TABLE IF NOT EXISTS kk (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      bangunan_id     INTEGER NOT NULL REFERENCES bangunan(id) ON DELETE CASCADE,
      nomor_urut      TEXT    NOT NULL,
      nama_kk         TEXT    NOT NULL,
      nama_kepala     TEXT,
      jumlah_anggota  INTEGER DEFAULT 1,
      catatan         TEXT,
      synced          INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- Foto
    CREATE TABLE IF NOT EXISTS foto (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      bangunan_id INTEGER NOT NULL REFERENCES bangunan(id) ON DELETE CASCADE,
      kk_id       INTEGER REFERENCES kk(id) ON DELETE SET NULL,
      uri         TEXT    NOT NULL,
      cloud_url   TEXT,
      keterangan  TEXT,
      synced      INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_rt_sls        ON rt(sls_id);
    CREATE INDEX IF NOT EXISTS idx_bangunan_rt   ON bangunan(rt_id);
    CREATE INDEX IF NOT EXISTS idx_kk_bangunan   ON kk(bangunan_id);
    CREATE INDEX IF NOT EXISTS idx_foto_bangunan ON foto(bangunan_id);
  `);

  // Migrasi: jika tabel bangunan lama (tanpa rt_id) masih ada, tambah kolom
  try {
    await db.execAsync(`ALTER TABLE bangunan ADD COLUMN rt_id INTEGER`);
  } catch (_) { /* kolom sudah ada atau tabel baru */ }

  // Seed: buat SLS & RT default jika belum ada
  const existing = await db.getFirstAsync<{ id: number }>(`SELECT id FROM sls LIMIT 1`);
  if (!existing) {
    await db.execAsync(`
      INSERT INTO sls (nama, kode, kecamatan, kabupaten)
      VALUES ('Desa Sumberharjo', 'SLS-001', 'Sumberharjo', 'Bojonegoro');

      INSERT INTO rt (sls_id, nama_rt, nama_rw)
      SELECT id, 'RT 01', 'RW 01' FROM sls WHERE kode = 'SLS-001';

      INSERT INTO rt (sls_id, nama_rt, nama_rw)
      SELECT id, 'RT 02', 'RW 01' FROM sls WHERE kode = 'SLS-001';

      INSERT INTO rt (sls_id, nama_rt, nama_rw)
      SELECT id, 'RT 03', 'RW 02' FROM sls WHERE kode = 'SLS-001';
    `);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLS CRUD
// ═══════════════════════════════════════════════════════════════════════════════
export async function getSLSList(): Promise<SLS[]> {
  const db = await getDB();
  return db.getAllAsync<SLS>(`SELECT * FROM sls ORDER BY kode ASC`);
}

export async function getSLSById(id: number): Promise<SLS | null> {
  const db = await getDB();
  return db.getFirstAsync<SLS>(`SELECT * FROM sls WHERE id = ?`, [id]);
}

export async function insertSLS(data: {
  nama:       string;
  kode:       string;
  kecamatan?: string;
  kabupaten?: string;
  catatan?:   string;
}): Promise<number> {
  const db     = await getDB();
  const result = await db.runAsync(
    `INSERT INTO sls (nama, kode, kecamatan, kabupaten, catatan) VALUES (?,?,?,?,?)`,
    [data.nama, data.kode, data.kecamatan ?? null, data.kabupaten ?? null, data.catatan ?? null]
  );
  return result.lastInsertRowId;
}

export async function updateSLS(id: number, data: Partial<Pick<SLS, "nama" | "kode" | "kecamatan" | "kabupaten" | "catatan">>): Promise<void> {
  const db     = await getDB();
  const fields = Object.keys(data).map((k) => `${k} = ?`).join(", ");
  await db.runAsync(`UPDATE sls SET ${fields} WHERE id = ?`, [...Object.values(data), id]);
}

export async function deleteSLS(id: number): Promise<void> {
  const db = await getDB();
  await db.runAsync(`DELETE FROM sls WHERE id = ?`, [id]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// RT CRUD
// ═══════════════════════════════════════════════════════════════════════════════
export async function getRTBySLS(slsId: number): Promise<RT[]> {
  const db = await getDB();
  return db.getAllAsync<RT>(`
    SELECT r.*,
      COUNT(DISTINCT b.id) AS jumlah_bangunan,
      COUNT(k.id)          AS jumlah_kk
    FROM rt r
    LEFT JOIN bangunan b ON b.rt_id = r.id
    LEFT JOIN kk k       ON k.bangunan_id = b.id
    WHERE r.sls_id = ?
    GROUP BY r.id
    ORDER BY r.nama_rt ASC
  `, [slsId]);
}

export async function getRTById(id: number): Promise<RT | null> {
  const db = await getDB();
  return db.getFirstAsync<RT>(`
    SELECT r.*,
      COUNT(DISTINCT b.id) AS jumlah_bangunan,
      COUNT(k.id)          AS jumlah_kk
    FROM rt r
    LEFT JOIN bangunan b ON b.rt_id = r.id
    LEFT JOIN kk k       ON k.bangunan_id = b.id
    WHERE r.id = ?
    GROUP BY r.id
  `, [id]);
}

export async function insertRT(data: {
  sls_id:    number;
  nama_rt:   string;
  nama_rw?:  string;
  ketua_rt?: string;
  catatan?:  string;
}): Promise<number> {
  const db     = await getDB();
  const result = await db.runAsync(
    `INSERT INTO rt (sls_id, nama_rt, nama_rw, ketua_rt, catatan) VALUES (?,?,?,?,?)`,
    [data.sls_id, data.nama_rt, data.nama_rw ?? null, data.ketua_rt ?? null, data.catatan ?? null]
  );
  return result.lastInsertRowId;
}

export async function updateRT(id: number, data: Partial<Pick<RT, "nama_rt" | "nama_rw" | "ketua_rt" | "catatan">>): Promise<void> {
  const db     = await getDB();
  const fields = Object.keys(data).map((k) => `${k} = ?`).join(", ");
  await db.runAsync(`UPDATE rt SET ${fields} WHERE id = ?`, [...Object.values(data), id]);
}

export async function deleteRT(id: number): Promise<void> {
  const db = await getDB();
  await db.runAsync(`DELETE FROM rt WHERE id = ?`, [id]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// BANGUNAN CRUD
// ═══════════════════════════════════════════════════════════════════════════════
export async function getBangunanByRT(rtId: number): Promise<Bangunan[]> {
  const db = await getDB();
  return db.getAllAsync<Bangunan>(`
    SELECT b.*, COUNT(k.id) AS jumlah_kk,
           r.nama_rt, s.nama AS nama_sls
    FROM bangunan b
    LEFT JOIN kk k  ON k.bangunan_id = b.id
    LEFT JOIN rt r  ON r.id = b.rt_id
    LEFT JOIN sls s ON s.id = r.sls_id
    WHERE b.rt_id = ?
    GROUP BY b.id
    ORDER BY CAST(b.nomor_urut AS INTEGER) ASC, b.nomor_urut ASC
  `, [rtId]);
}

export async function getBangunanList(): Promise<Bangunan[]> {
  const db = await getDB();
  return db.getAllAsync<Bangunan>(`
    SELECT b.*, COUNT(k.id) AS jumlah_kk,
           r.nama_rt, s.nama AS nama_sls
    FROM bangunan b
    LEFT JOIN kk k  ON k.bangunan_id = b.id
    LEFT JOIN rt r  ON r.id = b.rt_id
    LEFT JOIN sls s ON s.id = r.sls_id
    GROUP BY b.id
    ORDER BY r.nama_rt ASC, CAST(b.nomor_urut AS INTEGER) ASC
  `);
}

export async function getBangunanById(id: number): Promise<Bangunan | null> {
  const db = await getDB();
  return db.getFirstAsync<Bangunan>(`
    SELECT b.*, COUNT(k.id) AS jumlah_kk,
           r.nama_rt, s.nama AS nama_sls
    FROM bangunan b
    LEFT JOIN kk k  ON k.bangunan_id = b.id
    LEFT JOIN rt r  ON r.id = b.rt_id
    LEFT JOIN sls s ON s.id = r.sls_id
    WHERE b.id = ? GROUP BY b.id
  `, [id]);
}

// Saran nomor urut berikutnya dalam RT tertentu
export async function nextNomorBangunan(rtId: number): Promise<string> {
  const db  = await getDB();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT MAX(CAST(nomor_urut AS INTEGER)) AS n FROM bangunan WHERE rt_id = ?`,
    [rtId]
  );
  return String((row?.n ?? 0) + 1).padStart(3, "0");
}

export async function insertBangunan(data: {
  rt_id:       number;
  nomor_urut?: string;    // jika kosong → auto
  jenis:       string;
  alamat?:     string;
  lat?:        number;
  lng?:        number;
  catatan?:    string;
}): Promise<number> {
  const db     = await getDB();
  const nomor  = data.nomor_urut?.trim() || await nextNomorBangunan(data.rt_id);
  const result = await db.runAsync(
    `INSERT INTO bangunan (rt_id, nomor_urut, jenis, alamat, lat, lng, catatan)
     VALUES (?,?,?,?,?,?,?)`,
    [data.rt_id, nomor, data.jenis, data.alamat ?? null, data.lat ?? null, data.lng ?? null, data.catatan ?? null]
  );
  return result.lastInsertRowId;
}

export async function updateBangunan(
  id: number,
  data: Partial<Pick<Bangunan, "nomor_urut" | "jenis" | "alamat" | "lat" | "lng" | "catatan">>
): Promise<void> {
  const db     = await getDB();
  const fields = Object.keys(data).map((k) => `${k} = ?`).join(", ");
  await db.runAsync(`UPDATE bangunan SET ${fields}, synced = 0 WHERE id = ?`, [...Object.values(data), id]);
}

export async function deleteBangunan(id: number): Promise<void> {
  const db = await getDB();
  await db.runAsync(`DELETE FROM bangunan WHERE id = ?`, [id]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// KK CRUD
// ═══════════════════════════════════════════════════════════════════════════════
export async function getKKByBangunan(bangunanId: number): Promise<KK[]> {
  const db = await getDB();
  return db.getAllAsync<KK>(
    `SELECT * FROM kk WHERE bangunan_id = ?
     ORDER BY CAST(nomor_urut AS INTEGER) ASC, nomor_urut ASC`,
    [bangunanId]
  );
}

export async function nextNomorKK(bangunanId: number): Promise<string> {
  const db  = await getDB();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT MAX(CAST(nomor_urut AS INTEGER)) AS n FROM kk WHERE bangunan_id = ?`,
    [bangunanId]
  );
  return String((row?.n ?? 0) + 1).padStart(3, "0");
}

export async function insertKK(data: {
  bangunan_id:     number;
  nomor_urut?:     string;  // jika kosong → auto
  nama_kk:         string;
  nama_kepala?:    string;
  jumlah_anggota?: number;
  catatan?:        string;
}): Promise<number> {
  const db    = await getDB();
  const nomor = data.nomor_urut?.trim() || await nextNomorKK(data.bangunan_id);
  const result = await db.runAsync(
    `INSERT INTO kk (bangunan_id, nomor_urut, nama_kk, nama_kepala, jumlah_anggota, catatan)
     VALUES (?,?,?,?,?,?)`,
    [data.bangunan_id, nomor, data.nama_kk, data.nama_kepala ?? null, data.jumlah_anggota ?? 1, data.catatan ?? null]
  );
  return result.lastInsertRowId;
}

export async function deleteKK(id: number): Promise<void> {
  const db = await getDB();
  await db.runAsync(`DELETE FROM kk WHERE id = ?`, [id]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOTO CRUD
// ═══════════════════════════════════════════════════════════════════════════════
export async function getFotoByBangunan(bangunanId: number): Promise<Foto[]> {
  const db = await getDB();
  return db.getAllAsync<Foto>(
    `SELECT * FROM foto WHERE bangunan_id = ? ORDER BY created_at DESC`,
    [bangunanId]
  );
}

export async function insertFoto(data: {
  bangunan_id:  number;
  kk_id?:       number;
  uri:          string;
  keterangan?:  string;
}): Promise<number> {
  const db     = await getDB();
  const result = await db.runAsync(
    `INSERT INTO foto (bangunan_id, kk_id, uri, keterangan) VALUES (?,?,?,?)`,
    [data.bangunan_id, data.kk_id ?? null, data.uri, data.keterangan ?? null]
  );
  return result.lastInsertRowId;
}

export async function deleteFoto(id: number): Promise<void> {
  const db = await getDB();
  await db.runAsync(`DELETE FROM foto WHERE id = ?`, [id]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATISTIK
// ═══════════════════════════════════════════════════════════════════════════════
export async function getStats(): Promise<{
  totalSLS:       number;
  totalRT:        number;
  totalBangunan:  number;
  totalKK:        number;
  totalFoto:      number;
  bangunanBerGPS: number;
}> {
  const db = await getDB();
  const r  = await db.getFirstAsync<{
    totalSLS: number; totalRT: number; totalBangunan: number;
    totalKK: number;  totalFoto: number; bangunanBerGPS: number;
  }>(`
    SELECT
      (SELECT COUNT(*) FROM sls)                             AS totalSLS,
      (SELECT COUNT(*) FROM rt)                             AS totalRT,
      (SELECT COUNT(*) FROM bangunan)                        AS totalBangunan,
      (SELECT COUNT(*) FROM kk)                             AS totalKK,
      (SELECT COUNT(*) FROM foto)                           AS totalFoto,
      (SELECT COUNT(*) FROM bangunan WHERE lat IS NOT NULL) AS bangunanBerGPS
  `);
  return r ?? { totalSLS: 0, totalRT: 0, totalBangunan: 0, totalKK: 0, totalFoto: 0, bangunanBerGPS: 0 };
}
