// Types, Constants, and Configurations for Neon Cosmic Disco Bowling

export const GAME_MODES = {
  SOLO: 'SOLO',
  VS_BOT: 'VS_BOT',
  PASS_AND_PLAY: 'PASS_AND_PLAY',
  ONLINE_MULTIPLAYER: 'ONLINE_MULTIPLAYER'
};

export const GAME_STATES = {
  LOBBY: 'LOBBY',
  ROOM_WAITING: 'ROOM_WAITING',
  READY_TO_BOWL: 'READY_TO_BOWL',
  CHARACTER_THROWING: 'CHARACTER_THROWING',
  BALL_ROLLING: 'BALL_ROLLING',
  PIN_IMPACT: 'PIN_IMPACT',
  SWEEPING: 'SWEEPING',
  FRAME_RESULT: 'FRAME_RESULT',
  GAME_OVER: 'GAME_OVER'
};

export const CAMERA_MODES = {
  APPROACH: 'APPROACH',
  FOLLOW: 'FOLLOW',
  PIN_VIEW: 'PIN_VIEW',
  SIDE: 'SIDE'
};

export const BALL_SKINS = [
  { id: 'galaxy', name: '🌌 Cosmic Galaxy', color: '#8b5cf6', emissive: '#4c1d95', specular: '#c084fc', pattern: 'nebula' },
  { id: 'disco_gold', name: '✨ Disco Gold', color: '#fbbf24', emissive: '#78350f', specular: '#fef08a', pattern: 'gold' },
  { id: 'cyber_cyan', name: '⚡ Cyber Neon', color: '#06b6d4', emissive: '#164e63', specular: '#67e8f9', pattern: 'cyber' },
  { id: 'magma_fire', name: '🔥 Magma Inferno', color: '#ef4444', emissive: '#7f1d1d', specular: '#fca5a5', pattern: 'fire' },
  { id: 'acid_green', name: '🧪 Acid Toxic', color: '#10b981', emissive: '#064e3b', specular: '#6ee7b7', pattern: 'toxic' },
  { id: 'bubblegum', name: '💖 Disco Barbie', color: '#ec4899', emissive: '#831843', specular: '#f472b6', pattern: 'pink' },
  { id: 'midnight_obsidian', name: '🖤 Dark Obsidian', color: '#1e293b', emissive: '#0f172a', specular: '#94a3b8', pattern: 'cyber' },
  { id: 'plasma_sun', name: '☀️ Plasma Star', color: '#f97316', emissive: '#9a3412', specular: '#fdba74', pattern: 'fire' },
  { id: 'emerald_matrix', name: '🟩 Matrix Glitch', color: '#059669', emissive: '#064e3b', specular: '#34d399', pattern: 'toxic' },
  { id: 'royal_purple', name: '👑 Royal Amethyst', color: '#7c3aed', emissive: '#4c1d95', specular: '#c4b5fd', pattern: 'gold' }
];

export const CHARACTER_STYLES = {
  OUTFITS: [
    { id: 'navy_jersey', name: 'Navy Pro Jersey', topColor: '#1e3a8a', pantsColor: '#f1f5f9' },
    { id: 'disco_pink', name: 'Disco Magenta', topColor: '#db2777', pantsColor: '#1e1b4b' },
    { id: 'cyber_cyan', name: 'Cyber Neon', topColor: '#0891b2', pantsColor: '#0f172a' },
    { id: 'retro_gold', name: 'Gold Champion', topColor: '#d97706', pantsColor: '#262626' },
    { id: 'toxic_green', name: 'Toxic Street', topColor: '#059669', pantsColor: '#111827' },
    { id: 'fire_red', name: 'Inferno Flame', topColor: '#dc2626', pantsColor: '#18181b' }
  ],
  HAIR_STYLES: [
    { id: 'cap_back', name: 'Topi Terbalik', type: 'cap', color: '#1e293b' },
    { id: 'cap_neon', name: 'Topi Neon', type: 'cap', color: '#06b6d4' },
    { id: 'afro_disco', name: 'Afro Disco', type: 'afro', color: '#1c1917' },
    { id: 'spiky_hair', name: 'Rambut Spiky', type: 'spiky', color: '#78350f' },
    { id: 'headband', name: 'Headband Retro', type: 'headband', color: '#ec4899' }
  ],
  SKIN_TONES: [
    { id: 'fair', name: 'Fair Light', color: '#fed7aa' },
    { id: 'tan', name: 'Warm Tan', color: '#f59e0b' },
    { id: 'dark', name: 'Deep Bronze', color: '#854d0e' },
    { id: 'cyber_blue', name: 'Cyber Glow', color: '#a5f3fc' }
  ]
};

export const CUPU_TAUNT_MESSAGES = [
  { text: "AWOKWOK BEBAN TONGKRONGAN! 🤡", sub: "Pionya di tengah, bolanya ke selokan!" },
  { text: "PINSETTER SAMPE NANGIS LIATNYA! 😭", sub: "Ga kena satupun wkwkwk" },
  { text: "SI PALING GOLONGAN GUTTER! 💩", sub: "Latihan dulu sama bot cupu ya bang!" },
  { text: "KOCAK DAH, MENDING JADI PENONTON! 🐔", sub: "Ayam tetangga aja bisa ngelempar lebih lurus!" },
  { text: "SEDEKAH BOLA KE GUTTER! 💸", sub: "Anggap aja buang sial ya bro!" },
  { text: "JARINGAN APA TANGAN YANG BERGETAR? 🤣", sub: "Alasan: 'Mouse/trackpad gue licin woy'" },
  { text: "TOLONG PINDAH KE LAJUR SEBELAH! 🚧", sub: "Bahkan udara pun gak bergetar kena bolamu!" },
  { text: "CUPU ALERT DETECTED! 🚨", sub: "Status keahlian: Sangat Mengkhawatirkan" }
];

export const STRIKE_MESSAGES = [
  { text: "🔥 S T R I K E ! ! 🔥", sub: "MANTAP BANGET BRO! RATA SEMUA 10 PIN!" },
  { text: "👑 DEWA BOWLING DISCO! 👑", sub: "Auto tepuk tangan seisi bowling club!" },
  { text: "⚡ UNSTOPPABLE ROLL! ⚡", sub: "Hancur lebur pin tak tersisa!" },
  { text: "💥 PERFECT HIT! 💥", sub: "Pocket strike bukan kaleng-kaleng!" }
];

export const SPARE_MESSAGES = [
  { text: "✨ S P A R E ! ! ✨", sub: "Penyelamatan berkelas!" },
  { text: "🎯 CLUTCH FINISH! 🎯", sub: "Sisa pin disapu bersih!" },
  { text: "👌 NICE RECOVERY! 👌", sub: "Masih aman bro!" }
];

export const TAUNT_EMOJIS = [
  { emoji: "🤡", label: "Badut", sound: "clown" },
  { emoji: "🐔", label: "Ayam Cupu", sound: "chicken" },
  { emoji: "💩", label: "Ampas", sound: "fart" },
  { emoji: "👶", label: "Bayi", sound: "baby" },
  { emoji: "💀", label: "Mati Gaya", sound: "bruh" },
  { emoji: "🤣", label: "Ketawa Jahat", sound: "laugh" },
  { emoji: "👎", label: "Dislike", sound: "boo" },
  { emoji: "👑", label: "Sultan", sound: "cheer" },
  { emoji: "🔥", label: "Menyala", sound: "fire" },
  { emoji: "🎯", label: "Jitu", sound: "bullseye" }
];

export const QUICK_CHAT_PRESETS = [
  "Awokwok cupu bet dah!",
  "Minggir, calon juara mau lempar 😎",
  "Itu hoki doang bang!",
  "Mouse gue delay woy 😭",
  "Pinnya disemen itu pasti!",
  "Nice throw bro! 🔥",
  "Ayo gas rematch!",
  "Gutter lagi nih bentar lagi wkwk"
];

export const PIN_SPACING = 0.31;
export const PIN_POSITIONS = [
  // Row 1 (Pin 1 - Headpin)
  { id: 1, x: 0, z: 0 },
  // Row 2 (Pins 2, 3)
  { id: 2, x: -PIN_SPACING * 0.5, z: PIN_SPACING * 0.866 },
  { id: 3, x: PIN_SPACING * 0.5, z: PIN_SPACING * 0.866 },
  // Row 3 (Pins 4, 5, 6)
  { id: 4, x: -PIN_SPACING, z: PIN_SPACING * 1.732 },
  { id: 5, x: 0, z: PIN_SPACING * 1.732 },
  { id: 6, x: PIN_SPACING, z: PIN_SPACING * 1.732 },
  // Row 4 (Pins 7, 8, 9, 10)
  { id: 7, x: -PIN_SPACING * 1.5, z: PIN_SPACING * 2.598 },
  { id: 8, x: -PIN_SPACING * 0.5, z: PIN_SPACING * 2.598 },
  { id: 9, x: PIN_SPACING * 0.5, z: PIN_SPACING * 2.598 },
  { id: 10, x: PIN_SPACING * 1.5, z: PIN_SPACING * 2.598 }
];

export const LANE_CONFIG = {
  WIDTH: 1.07,
  LENGTH: 19.15,
  APPROACH_LENGTH: 4.8,
  GUTTER_WIDTH: 0.23,
  PIN_DECK_Z: 18.28,
  BALL_RADIUS: 0.108,
  BALL_MASS: 6.5,
  PIN_HEIGHT: 0.38,
  PIN_RADIUS: 0.06,
  PIN_MASS: 1.55,
  MAX_PLAYERS: 10
};
