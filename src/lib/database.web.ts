// ─── database.web.ts — stub web (no-op) ──────────────────────────────────────
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

export async function initDB(): Promise<void> {}
export async function getSLSList(): Promise<SLS[]>                                     { return []; }
export async function getSLSById(_id: number): Promise<SLS | null>                    { return null; }
export async function insertSLS(_d: any): Promise<number>                              { return 0; }
export async function updateSLS(_id: number, _d: any): Promise<void>                  {}
export async function deleteSLS(_id: number): Promise<void>                            {}
export async function getRTBySLS(_slsId: number): Promise<RT[]>                       { return []; }
export async function getRTById(_id: number): Promise<RT | null>                      { return null; }
export async function insertRT(_d: any): Promise<number>                               { return 0; }
export async function updateRT(_id: number, _d: any): Promise<void>                   {}
export async function deleteRT(_id: number): Promise<void>                             {}
export async function getBangunanByRT(_rtId: number): Promise<Bangunan[]>             { return []; }
export async function getBangunanList(): Promise<Bangunan[]>                           { return []; }
export async function getBangunanById(_id: number): Promise<Bangunan | null>          { return null; }
export async function nextNomorBangunan(_rtId: number): Promise<string>               { return "001"; }
export async function insertBangunan(_d: any): Promise<number>                        { return 0; }
export async function updateBangunan(_id: number, _d: any): Promise<void>             {}
export async function deleteBangunan(_id: number): Promise<void>                       {}
export async function getKKByBangunan(_bangunanId: number): Promise<KK[]>            { return []; }
export async function nextNomorKK(_bangunanId: number): Promise<string>              { return "001"; }
export async function insertKK(_d: any): Promise<number>                              { return 0; }
export async function deleteKK(_id: number): Promise<void>                            {}
export async function getFotoByBangunan(_bangunanId: number): Promise<Foto[]>        { return []; }
export async function insertFoto(_d: any): Promise<number>                            { return 0; }
export async function deleteFoto(_id: number): Promise<void>                          {}
export async function getStats(): Promise<{
  totalSLS: number; totalRT: number; totalBangunan: number;
  totalKK: number; totalFoto: number; bangunanBerGPS: number;
}> { return { totalSLS: 0, totalRT: 0, totalBangunan: 0, totalKK: 0, totalFoto: 0, bangunanBerGPS: 0 }; }
