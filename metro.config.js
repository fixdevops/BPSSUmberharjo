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

// ── Prioritaskan ekstensi .web.* saat build web ───────────────────────────────
// PENTING: prepend saja, jangan timpa seluruh array!
// getDefaultConfig sudah include: tsx, ts, jsx, js, json, cjs, scss, sass, css
// Kita hanya perlu memastikan .web.* ada di DEPAN agar database.web.ts
// diprioritaskan sebelum database.ts / database.native.ts
const webExts = ["web.tsx", "web.ts", "web.jsx", "web.js"];
const existingExts = resolver.sourceExts ?? [];

// Gabung: web-spesifik dulu, lalu semua default (hindari duplikat)
resolver.sourceExts = [
  ...webExts,
  ...existingExts.filter((ext) => !webExts.includes(ext)),
];

// ── Paksa resolusi browser-first untuk semua paket ────────────────────────────
// Mencegah paket Node-only masuk bundle web
resolver.resolverMainFields = ["browser", "module", "main"];

// ── Performance: inlineRequires untuk lazy loading ────────────────────────────
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
