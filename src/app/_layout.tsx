import { Stack } from "expo-router";

// Layout minimal — satu Stack tanpa header.
// Semua navigasi dikelola oleh HomeScreen (index.tsx) secara manual
// menggunakan state internal, bukan expo-router.
export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "none" }} />
  );
}
