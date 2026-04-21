const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const W = 1280;
const H = 720;

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// ── Background ───────────────────────────────────────────────
ctx.fillStyle = '#1A1715';
ctx.fillRect(0, 0, W, H);

// ── Subtle warm glow, right side ────────────────────────────
const glow = ctx.createRadialGradient(W * 0.82, H * 0.5, 0, W * 0.82, H * 0.5, W * 0.55);
glow.addColorStop(0, 'rgba(199,91,42,0.2)');
glow.addColorStop(1, 'rgba(199,91,42,0)');
ctx.fillStyle = glow;
ctx.fillRect(0, 0, W, H);

// ── Left orange bar ──────────────────────────────────────────
ctx.fillStyle = '#C75B2A';
ctx.fillRect(0, 0, 6, H);

// ── "ZIONSHIFT" — small, top left ───────────────────────────
ctx.fillStyle = '#C75B2A';
ctx.font = 'bold 15px sans-serif';
ctx.letterSpacing = '0.3em';
ctx.fillText('ZIONSHIFT', 52, 72);

// ── Name — the hero element ──────────────────────────────────
ctx.fillStyle = '#F5F0EA';
ctx.font = 'bold 108px sans-serif';
ctx.letterSpacing = '-0.01em';
ctx.fillText('Ryan Flores', 48, 370);

// ── Orange underline ─────────────────────────────────────────
ctx.fillStyle = '#C75B2A';
ctx.fillRect(50, 392, 500, 4);

// ── Subtitle ─────────────────────────────────────────────────
ctx.fillStyle = 'rgba(245,240,234,0.4)';
ctx.font = '500 24px sans-serif';
ctx.letterSpacing = '0';
ctx.fillText('Founder & CEO, ZionShift', 52, 442);

// ── Save to Desktop ──────────────────────────────────────────
const desktopPath = path.join(
  process.env.USERPROFILE || process.env.HOME,
  'Desktop',
  'zionshift-thumbnail.png'
);
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(desktopPath, buffer);
console.log(`Saved to Desktop: zionshift-thumbnail.png`);
console.log(`Size: ${(buffer.length / 1024).toFixed(1)} KB`);
