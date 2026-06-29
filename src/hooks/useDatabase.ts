// ─── useDatabase — init DB sekali saat app mount ─────────────────────────────
// Web: langsung ready (initDB adalah no-op di web)
import { useEffect, useState } from "react";
import { initDB } from "../lib/database";

export function useDatabase() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDB()
      .then(() => setReady(true))
      .catch((e) => {
        console.warn("DB init error:", e);
        setError(String(e));
        setReady(true); // tetap lanjut meski error, layar estimasi tetap jalan
      });
  }, []);

  return { ready, error };
}
