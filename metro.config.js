// ─── metro.config.js ─────────────────────────────────────────────────────────
// Konfigurasi Metro Bundler untuk Expo + React Native Web
//
// Platform-split resolution:
//   database.web.ts  → dipakai saat build web (localStorage)
//   database.native.ts → dipakai saat build Android/iOS (expo-sqlite)
//
// Metro otomatis memprioritaskan .web.ts sebelum .ts saat target platform "web"
// karena "web" ada di depan array sourceExts.

const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Pastikan ekstensi web diprioritaskan saat build web
// Metro memilih file pertama yang cocok dari kiri ke kanan
const { resolver } = config;

resolver.sourceExts = [
  // Platform-spesifik web dulu (agar database.web.ts dipilih sebelum database.ts)
  "web.tsx",
  "web.ts",
  "web.jsx",
  "web.js",
  // Lalu default
  "tsx",
  "ts",
  "jsx",
  "js",
  "json",
  "cjs",
  "mjs",
];

// Aktifkan inlineRequires untuk lazy loading (mempercepat cold start web)
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
