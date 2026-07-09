// ─── metro.config.js ─────────────────────────────────────────────────────────
// Konfigurasi Metro Bundler untuk Expo + React Native Web
//
// Platform-split resolution:
//   database.web.ts   → dipakai saat build web (localStorage)
//   database.native.ts → dipakai saat build Android/iOS (expo-sqlite)

const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const { resolver } = config;

// ── 1. Prioritaskan ekstensi .web.* saat build web ───────────────────────────
// Metro memilih file pertama yang cocok dari kiri ke kanan.
// Ini memastikan database.web.ts dipilih sebelum database.ts/.native.ts
resolver.sourceExts = [
  "web.tsx", "web.ts", "web.jsx", "web.js",
  "tsx", "ts", "jsx", "js",
  "json", "cjs", "mjs",
];

// ── 2. Paksa resolusi browser-first untuk semua paket ────────────────────────
// Ini mencegah @upstash/redis dan paket Node-only masuk bundle web
resolver.resolverMainFields = ["browser", "module", "main"];

// ── 3. Performance: inlineRequires untuk lazy loading ────────────────────────
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
