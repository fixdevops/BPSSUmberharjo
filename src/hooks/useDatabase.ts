// ─── useDatabase — init DB sekali saat app mount ─────────────────────────────
// Web: langsung ready (initDB adalah no-op di web)
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { initDB } from "../lib/database";

export function useDatabase() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDB()
      .then(async () => {
        // Web: coba init Drive Storage (load data dari Drive jika sudah login)
        if (Platform.OS === "web") {
          try {
            const { initDriveStorage } = await import("../lib/driveStorage");
            await initDriveStorage();
          } catch (_) {
            // Drive init gagal tidak blokir app
          }
        }
        setReady(true);
      })
      .catch((e) => {
        console.warn("DB init error:", e);
        setError(String(e));
        setReady(true);
      });
  }, []);

  return { ready, error };
}
