// ─── database.web.ts — implementasi localStorage untuk browser ───────────────
// Data disimpan di localStorage dengan prefix "se2026_"
// Skema sama dengan native: SLS → RT → Bangunan → KK → Foto

// ─── Tipe ─────────────────────────────────────────────────────────────────────
export type SLS = {
  id: number; nama: string; kode: string;
  kecamatan: string | null; kabupaten: string | null;
  catatan: string | null; created_at: string;
};
export type RT = {
  id: number; sls_id: number; nama_rt: string; nama_rw: string | null;
  ketua_rt: string | null; catatan: string | null; created_at: string;
  jumlah_bangunan?: number; jumlah_kk?: number;
};
export type Bangunan = {
  id: number; rt_id: number; nomor_urut: string; jenis: string;
  alamat: string | null; lat: number | null; lng: number | null;
  catatan: string | null; synced: number; created_at: string;
  jumlah_kk?: number; nama_rt?: string; nama_sls?: string;
};
export type KK = {
  id: number; bangunan_id: number; nomor_urut: string; nama_kk: string;
  nama_kepala: string | null; jumlah_anggota: number;
  catatan: string | null; synced: number; created_at: string;
};
export type Foto = {
  id: number; bangunan_id: number; kk_id: number | null;
  uri: string; cloud_url: string | null; keterangan: string | null;
  synced: number; created_at: string;
};

// ─── Helpers localStorage ─────────────────────────────────────────────────────
function lsGet<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem("se2026_" + key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function lsSet<T>(key: string, data: T[]): void {
  try { localStorage.setItem("se2026_" + key, JSON.stringify(data)); } catch (_) {}
}

function lsGetCounter(key: string): number {
  try { return parseInt(localStorage.getItem("se2026_cnt_" + key) ?? "0", 10); } catch { return 0; }
}

function lsNextId(key: string): number {
  const next = lsGetCounter(key) + 1;
  try { localStorage.setItem("se2026_cnt_" + key, String(next)); } catch (_) {}
  return next;
}

function now(): string {
  return new Date().toLocaleString("sv-SE").replace("T", " "); // "2026-06-29 14:00:00"
}

// ─── Init + Seed ──────────────────────────────────────────────────────────────
export async function initDB(): Promise<void> {
  const existing = lsGet<SLS>("sls");
  if (existing.length === 0) {
    // Seed default SLS + RT
    const slsId = lsNextId("sls");
    const slsList: SLS[] = [{
      id: slsId, nama: "Desa Sumberharjo", kode: "SLS-001",
      kecamatan: "Sumberharjo", kabupaten: "Bojonegoro",
      catatan: null, created_at: now(),
    }];
    lsSet("sls", slsList);

    const rt1 = lsNextId("rt");
    const rt2 = lsNextId("rt");
    const rt3 = lsNextId("rt");
    const rtList: RT[] = [
      { id: rt1, sls_id: slsId, nama_rt: "RT 01", nama_rw: "RW 01", ketua_rt: null, catatan: null, created_at: now() },
      { id: rt2, sls_id: slsId, nama_rt: "RT 02", nama_rw: "RW 01", ketua_rt: null, catatan: null, created_at: now() },
      { id: rt3, sls_id: slsId, nama_rt: "RT 03", nama_rw: "RW 02", ketua_rt: null, catatan: null, created_at: now() },
    ];
    lsSet("rt", rtList);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLS CRUD
// ═══════════════════════════════════════════════════════════════════════════════
export async function getSLSList(): Promise<SLS[]> {
  return lsGet<SLS>("sls").sort((a, b) => a.kode.localeCompare(b.kode));
}

export async function getSLSById(id: number): Promise<SLS | null> {
  return lsGet<SLS>("sls").find((s) => s.id === id) ?? null;
}

export async function insertSLS(data: {
  nama: string; kode: string; kecamatan?: string; kabupaten?: string; catatan?: string;
}): Promise<number> {
  const list = lsGet<SLS>("sls");
  const id   = lsNextId("sls");
  list.push({ id, nama: data.nama, kode: data.kode, kecamatan: data.kecamatan ?? null, kabupaten: data.kabupaten ?? null, catatan: data.catatan ?? null, created_at: now() });
  lsSet("sls", list);
  return id;
}

export async function updateSLS(id: number, data: Partial<Pick<SLS, "nama" | "kode" | "kecamatan" | "kabupaten" | "catatan">>): Promise<void> {
  const list = lsGet<SLS>("sls").map((s) => s.id === id ? { ...s, ...data } : s);
  lsSet("sls", list);
}

export async function deleteSLS(id: number): Promise<void> {
  lsSet("sls", lsGet<SLS>("sls").filter((s) => s.id !== id));
  // cascade: hapus RT dalam SLS ini
  const rtDel = lsGet<RT>("rt").filter((r) => r.sls_id === id).map((r) => r.id);
  lsSet("rt", lsGet<RT>("rt").filter((r) => r.sls_id !== id));
  for (const rtId of rtDel) {
    const bDel = lsGet<Bangunan>("bangunan").filter((b) => b.rt_id === rtId).map((b) => b.id);
    lsSet("bangunan", lsGet<Bangunan>("bangunan").filter((b) => b.rt_id !== rtId));
    for (const bid of bDel) {
      lsSet("kk", lsGet<KK>("kk").filter((k) => k.bangunan_id !== bid));
      lsSet("foto", lsGet<Foto>("foto").filter((f) => f.bangunan_id !== bid));
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RT CRUD
// ═══════════════════════════════════════════════════════════════════════════════
export async function getRTBySLS(slsId: number): Promise<RT[]> {
  const all = lsGet<RT>("rt").filter((r) => r.sls_id === slsId);
  const bangunan = lsGet<Bangunan>("bangunan");
  const kk       = lsGet<KK>("kk");
  return all
    .map((r) => {
      const bIds = bangunan.filter((b) => b.rt_id === r.id).map((b) => b.id);
      return {
        ...r,
        jumlah_bangunan: bIds.length,
        jumlah_kk: kk.filter((k) => bIds.includes(k.bangunan_id)).length,
      };
    })
    .sort((a, b) => a.nama_rt.localeCompare(b.nama_rt));
}

export async function getRTById(id: number): Promise<RT | null> {
  const r = lsGet<RT>("rt").find((r) => r.id === id);
  if (!r) return null;
  const bangunan = lsGet<Bangunan>("bangunan").filter((b) => b.rt_id === id);
  const bIds     = bangunan.map((b) => b.id);
  const kk       = lsGet<KK>("kk").filter((k) => bIds.includes(k.bangunan_id));
  return { ...r, jumlah_bangunan: bangunan.length, jumlah_kk: kk.length };
}

export async function insertRT(data: {
  sls_id: number; nama_rt: string; nama_rw?: string; ketua_rt?: string; catatan?: string;
}): Promise<number> {
  const list = lsGet<RT>("rt");
  const id   = lsNextId("rt");
  list.push({ id, sls_id: data.sls_id, nama_rt: data.nama_rt, nama_rw: data.nama_rw ?? null, ketua_rt: data.ketua_rt ?? null, catatan: data.catatan ?? null, created_at: now() });
  lsSet("rt", list);
  return id;
}

export async function updateRT(id: number, data: Partial<Pick<RT, "nama_rt" | "nama_rw" | "ketua_rt" | "catatan">>): Promise<void> {
  lsSet("rt", lsGet<RT>("rt").map((r) => r.id === id ? { ...r, ...data } : r));
}

export async function deleteRT(id: number): Promise<void> {
  lsSet("rt", lsGet<RT>("rt").filter((r) => r.id !== id));
  const bDel = lsGet<Bangunan>("bangunan").filter((b) => b.rt_id === id).map((b) => b.id);
  lsSet("bangunan", lsGet<Bangunan>("bangunan").filter((b) => b.rt_id !== id));
  for (const bid of bDel) {
    lsSet("kk", lsGet<KK>("kk").filter((k) => k.bangunan_id !== bid));
    lsSet("foto", lsGet<Foto>("foto").filter((f) => f.bangunan_id !== bid));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BANGUNAN CRUD
// ═══════════════════════════════════════════════════════════════════════════════
function enrichBangunan(b: Bangunan): Bangunan {
  const kk  = lsGet<KK>("kk").filter((k) => k.bangunan_id === b.id);
  const rt  = lsGet<RT>("rt").find((r) => r.id === b.rt_id);
  const sls = rt ? lsGet<SLS>("sls").find((s) => s.id === rt.sls_id) : undefined;
  return { ...b, jumlah_kk: kk.length, nama_rt: rt?.nama_rt, nama_sls: sls?.nama };
}

export async function getBangunanByRT(rtId: number): Promise<Bangunan[]> {
  return lsGet<Bangunan>("bangunan")
    .filter((b) => b.rt_id === rtId)
    .sort((a, b) => parseInt(a.nomor_urut) - parseInt(b.nomor_urut) || a.nomor_urut.localeCompare(b.nomor_urut))
    .map(enrichBangunan);
}

export async function getBangunanList(): Promise<Bangunan[]> {
  const rt = lsGet<RT>("rt");
  return lsGet<Bangunan>("bangunan")
    .sort((a, b) => {
      const ra = rt.find((r) => r.id === a.rt_id)?.nama_rt ?? "";
      const rb = rt.find((r) => r.id === b.rt_id)?.nama_rt ?? "";
      return ra.localeCompare(rb) || parseInt(a.nomor_urut) - parseInt(b.nomor_urut);
    })
    .map(enrichBangunan);
}

export async function getBangunanById(id: number): Promise<Bangunan | null> {
  const b = lsGet<Bangunan>("bangunan").find((b) => b.id === id);
  return b ? enrichBangunan(b) : null;
}

export async function nextNomorBangunan(rtId: number): Promise<string> {
  const list = lsGet<Bangunan>("bangunan").filter((b) => b.rt_id === rtId);
  const max  = list.reduce((acc, b) => Math.max(acc, parseInt(b.nomor_urut) || 0), 0);
  return String(max + 1).padStart(3, "0");
}

export async function insertBangunan(data: {
  rt_id: number; nomor_urut?: string; jenis: string;
  alamat?: string; lat?: number; lng?: number; catatan?: string;
}): Promise<number> {
  const list  = lsGet<Bangunan>("bangunan");
  const id    = lsNextId("bangunan");
  const nomor = data.nomor_urut?.trim() || await nextNomorBangunan(data.rt_id);
  list.push({
    id, rt_id: data.rt_id, nomor_urut: nomor, jenis: data.jenis,
    alamat: data.alamat ?? null, lat: data.lat ?? null, lng: data.lng ?? null,
    catatan: data.catatan ?? null, synced: 0, created_at: now(),
  });
  lsSet("bangunan", list);
  return id;
}

export async function updateBangunan(id: number, data: Partial<Pick<Bangunan, "nomor_urut" | "jenis" | "alamat" | "lat" | "lng" | "catatan">>): Promise<void> {
  lsSet("bangunan", lsGet<Bangunan>("bangunan").map((b) => b.id === id ? { ...b, ...data, synced: 0 } : b));
}

export async function deleteBangunan(id: number): Promise<void> {
  lsSet("bangunan", lsGet<Bangunan>("bangunan").filter((b) => b.id !== id));
  lsSet("kk", lsGet<KK>("kk").filter((k) => k.bangunan_id !== id));
  lsSet("foto", lsGet<Foto>("foto").filter((f) => f.bangunan_id !== id));
}

// ═══════════════════════════════════════════════════════════════════════════════
// KK CRUD
// ═══════════════════════════════════════════════════════════════════════════════
export async function getKKByBangunan(bangunanId: number): Promise<KK[]> {
  return lsGet<KK>("kk")
    .filter((k) => k.bangunan_id === bangunanId)
    .sort((a, b) => parseInt(a.nomor_urut) - parseInt(b.nomor_urut) || a.nomor_urut.localeCompare(b.nomor_urut));
}

export async function nextNomorKK(bangunanId: number): Promise<string> {
  const list = lsGet<KK>("kk").filter((k) => k.bangunan_id === bangunanId);
  const max  = list.reduce((acc, k) => Math.max(acc, parseInt(k.nomor_urut) || 0), 0);
  return String(max + 1).padStart(3, "0");
}

export async function insertKK(data: {
  bangunan_id: number; nomor_urut?: string; nama_kk: string;
  nama_kepala?: string; jumlah_anggota?: number; catatan?: string;
}): Promise<number> {
  const list  = lsGet<KK>("kk");
  const id    = lsNextId("kk");
  const nomor = data.nomor_urut?.trim() || await nextNomorKK(data.bangunan_id);
  list.push({
    id, bangunan_id: data.bangunan_id, nomor_urut: nomor,
    nama_kk: data.nama_kk, nama_kepala: data.nama_kepala ?? null,
    jumlah_anggota: data.jumlah_anggota ?? 1,
    catatan: data.catatan ?? null, synced: 0, created_at: now(),
  });
  lsSet("kk", list);
  return id;
}

export async function deleteKK(id: number): Promise<void> {
  lsSet("kk", lsGet<KK>("kk").filter((k) => k.id !== id));
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOTO CRUD
// ═══════════════════════════════════════════════════════════════════════════════
export async function getFotoByBangunan(bangunanId: number): Promise<Foto[]> {
  return lsGet<Foto>("foto")
    .filter((f) => f.bangunan_id === bangunanId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function insertFoto(data: {
  bangunan_id: number; kk_id?: number; uri: string; keterangan?: string;
}): Promise<number> {
  const list = lsGet<Foto>("foto");
  const id   = lsNextId("foto");
  list.push({
    id, bangunan_id: data.bangunan_id, kk_id: data.kk_id ?? null,
    uri: data.uri, cloud_url: null, keterangan: data.keterangan ?? null,
    synced: 0, created_at: now(),
  });
  lsSet("foto", list);
  return id;
}

export async function deleteFoto(id: number): Promise<void> {
  lsSet("foto", lsGet<Foto>("foto").filter((f) => f.id !== id));
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATISTIK
// ═══════════════════════════════════════════════════════════════════════════════
export async function getStats(): Promise<{
  totalSLS: number; totalRT: number; totalBangunan: number;
  totalKK: number; totalFoto: number; bangunanBerGPS: number;
}> {
  const bangunan = lsGet<Bangunan>("bangunan");
  return {
    totalSLS:       lsGet<SLS>("sls").length,
    totalRT:        lsGet<RT>("rt").length,
    totalBangunan:  bangunan.length,
    totalKK:        lsGet<KK>("kk").length,
    totalFoto:      lsGet<Foto>("foto").length,
    bangunanBerGPS: bangunan.filter((b) => b.lat != null).length,
  };
}
