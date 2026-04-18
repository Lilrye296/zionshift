const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const W = 1280;
const H = 720;

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// ── Background ──────────────────────────────────────────────
ctx.fillStyle = '#F5F0EA';
ctx.fillRect(0, 0, W, H);

// ── Left accent bar ──────────────────────────────────────────
ctx.fillStyle = '#C75B2A';
ctx.fillRect(0, 0, 6, H);

// ── Subtle right-side geometric block ───────────────────────
ctx.fillStyle = '#EDE8E1';
ctx.beginPath();
ctx.moveTo(W * 0.58, 0);
ctx.lineTo(W, 0);
ctx.lineTo(W, H);
ctx.lineTo(W * 0.62, H);
ctx.closePath();
ctx.fill();

// ── Diagonal accent line ─────────────────────────────────────
ctx.strokeStyle = 'rgba(199,91,42,0.12)';
ctx.lineWidth = 120;
ctx.beginPath();
ctx.moveTo(W * 0.55, -50);
ctx.lineTo(W * 0.78, H + 50);
ctx.stroke();

// ── Top-left: eyebrow label ───────────────────────────────────
ctx.fillStyle = '#C75B2A';
ctx.font = 'bold 22px sans-serif';
ctx.letterSpacing = '0.15em';
ctx.fillText('MEET THE FOUNDER', 80, 100);

// ── Divider under eyebrow ─────────────────────────────────────
ctx.fillStyle = 'rgba(199,91,42,0.3)';
ctx.fillRect(80, 116, 220, 2);

// ── Main heading ─────────────────────────────────────────────
ctx.fillStyle = '#1A1715';
ctx.font = 'bold 72px sans-serif';
ctx.fillText('Ryan Flores', 80, 230);

// ── Sub heading ──────────────────────────────────────────────
ctx.fillStyle = '#8B7D6B';
ctx.font = '32px sans-serif';
ctx.fillText('Founder & CEO, ZionShift', 80, 285);

// ── Divider ───────────────────────────────────────────────────
ctx.fillStyle = 'rgba(196,184,168,0.5)';
ctx.fillRect(80, 330, 400, 1);

// ── Quote / tagline ───────────────────────────────────────────
ctx.fillStyle = '#1A1715';
ctx.font = '28px sans-serif';
const line1 = 'How we book qualified B2B meetings';
const line2 = 'for service businesses — on autopilot.';
ctx.fillText(line1, 80, 390);
ctx.fillText(line2, 80, 430);

// ── Bottom badge pill ─────────────────────────────────────────
const badgeX = 80;
const badgeY = 530;
const badgeW = 320;
const badgeH = 52;
const r = 26;

ctx.fillStyle = '#1A1715';
ctx.beginPath();
ctx.moveTo(badgeX + r, badgeY);
ctx.lineTo(badgeX + badgeW - r, badgeY);
ctx.quadraticCurveTo(badgeX + badgeW, badgeY, badgeX + badgeW, badgeY + r);
ctx.lineTo(badgeX + badgeW, badgeY + badgeH - r);
ctx.quadraticCurveTo(badgeX + badgeW, badgeY + badgeH, badgeX + badgeW - r, badgeY + badgeH);
ctx.lineTo(badgeX + r, badgeY + badgeH);
ctx.quadraticCurveTo(badgeX, badgeY + badgeH, badgeX, badgeY + badgeH - r);
ctx.lineTo(badgeX, badgeY + r);
ctx.quadraticCurveTo(badgeX, badgeY, badgeX + r, badgeY);
ctx.closePath();
ctx.fill();

ctx.fillStyle = '#ffffff';
ctx.font = 'bold 18px sans-serif';
ctx.fillText('AI-Powered Outbound System', 110, 562);

// ── Right side: ZionShift wordmark ───────────────────────────
ctx.fillStyle = '#1A1715';
ctx.font = 'bold 52px sans-serif';
ctx.fillText('ZIONSHIFT', W * 0.62, H / 2 - 20);

ctx.fillStyle = '#C75B2A';
ctx.fillRect(W * 0.62, H / 2 + 4, 260, 3);

ctx.fillStyle = '#8B7D6B';
ctx.font = '22px sans-serif';
ctx.fillText('zionshift.com', W * 0.62, H / 2 + 45);

// ── Save ──────────────────────────────────────────────────────
const outputPath = path.join(__dirname, '..', 'public', 'video-thumbnail.png');
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outputPath, buffer);
console.log('Thumbnail saved to public/video-thumbnail.png');
console.log(`Size: ${(buffer.length / 1024).toFixed(1)} KB`);
