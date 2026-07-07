// ─── bot.js — Discord Bot Penerbit Kunci Akses BPS SE2026 ────────────────────
// Jalankan di mesin lokal / VPS (bukan Vercel):
//   node bot.js
//
// Dependensi:
//   npm install discord.js node-fetch
//
// Env vars (.env):
//   DISCORD_TOKEN   — token bot Discord
//   CLIENT_ID       — Application ID dari Discord Developer Portal
//   API_BASE_URL    — URL deployment Vercel, contoh: https://bps-se2026.vercel.app
//   ADMIN_SECRET    — secret yang sama dengan di Vercel env vars

import {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
} from "discord.js";
import "dotenv/config";

const TOKEN        = process.env.DISCORD_TOKEN  || "";
const CLIENT_ID    = process.env.CLIENT_ID      || "";
const API_BASE_URL = process.env.API_BASE_URL   || "https://bps-se2026.vercel.app";
const ADMIN_SECRET = process.env.ADMIN_SECRET   || "";

if (!TOKEN || !CLIENT_ID) {
  console.error("[bot] ERROR: DISCORD_TOKEN dan CLIENT_ID wajib diisi di .env");
  process.exit(1);
}

// ── Registrasi Slash Commands ─────────────────────────────────────────────────
async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName("mintakunciweb")
      .setDescription("Minta kunci akses untuk aplikasi BPS SE2026 (dikirim ke DM Anda)")
      .toJSON(),
    new SlashCommandBuilder()
      .setName("listkunci")
      .setDescription("Lihat ringkasan kunci (hanya Admin)")
      .toJSON(),
  ];

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  try {
    console.log("[bot] Mendaftarkan slash commands…");
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("[bot] ✅ Slash commands berhasil didaftarkan.");
  } catch (err) {
    console.error("[bot] Gagal mendaftarkan commands:", err.message);
  }
}

// ── Helper: request ke Vercel API ─────────────────────────────────────────────
async function mintKey(createdBy) {
  const res = await fetch(`${API_BASE_URL}/api/mint-key`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ADMIN_SECRET}`,
    },
    body: JSON.stringify({ createdBy }),
  });

  const data = await res.json();
  if (!res.ok || data.status !== "success") {
    throw new Error(data.message || "Gagal membuat kunci dari server.");
  }
  return data.key;
}

// ── Inisialisasi Client ───────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
});

client.once("ready", () => {
  console.log(`[bot] ✅ Login sebagai ${client.user.tag}`);
  registerCommands();
});

// ── Handler interaksi ─────────────────────────────────────────────────────────
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // ── /mintakunciweb ─────────────────────────────────────────────────────────
  if (interaction.commandName === "mintakunciweb") {
    await interaction.deferReply({ ephemeral: true });

    let newKey;
    try {
      newKey = await mintKey(interaction.user.tag);
    } catch (err) {
      console.error("[bot] Gagal mint kunci:", err.message);
      return interaction.editReply("❌ Gagal membuat kunci. Coba lagi nanti.");
    }

    // Kirim ke DM
    try {
      await interaction.user.send(
        `🔑 **Kunci Akses BPS SE2026 Anda:**\n\`\`\`\n${newKey}\n\`\`\`\n` +
        `⚠️ Kunci ini hanya bisa digunakan **satu kali**. Jangan bagikan ke orang lain.\n` +
        `📱 Tempel kunci ini di aplikasi BPS SE2026 Sumberharjo pada halaman verifikasi.`
      );
      await interaction.editReply(
        "✅ Kunci sudah dikirim ke DM Anda! Periksa pesan langsung dari bot ini."
      );
      console.log(`[bot] ✅ Kunci diterbitkan untuk ${interaction.user.tag}`);
    } catch (_err) {
      // DM gagal (mungkin diblokir pengguna), kirim ephemeral di channel
      await interaction.editReply(
        `✅ Kunci Anda (jaga kerahasiaannya!):\n||\`${newKey}\`||`
      );
    }
  }

  // ── /listkunci (Admin only) ────────────────────────────────────────────────
  if (interaction.commandName === "listkunci") {
    const isAdmin = interaction.member?.permissions?.has?.("Administrator") ?? false;
    if (!isAdmin) {
      return interaction.reply({
        content: "❌ Hanya Admin yang bisa melihat daftar kunci.",
        ephemeral: true,
      });
    }

    await interaction.reply({
      content:
        "📊 Daftar kunci tersimpan di Vercel KV. Gunakan Vercel Dashboard untuk melihat detail.\n" +
        `🔗 ${API_BASE_URL}`,
      ephemeral: true,
    });
  }
});

client.login(TOKEN);
