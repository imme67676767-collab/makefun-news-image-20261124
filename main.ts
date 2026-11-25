// News image for 24 November 2026 — draws the whole picture in code.
// Node 22, standard library only. No network, no fonts, no external files.
// Output: $MAKEFUN_OUTPUT_DIR/entry.png (default /output/entry.png).
// Deterministic: same input, same bytes, every run.
// Rev. 2 (2026-11-25): casualty figures and one name corrected per
// Reuters / AP / ICBL sources; layout, font and colours untouched.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------------------
// 5x7 bitmap font, hand written. One row per byte, 5 bits per row (MSB left).
// Only capitals, digits and common punctuation: all text is uppercased.
// ---------------------------------------------------------------------------
const FONT: Record<string, number[]> = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  '0': [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  '1': [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  '2': [0x0e, 0x11, 0x01, 0x02, 0x04, 0x08, 0x1f],
  '3': [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  '4': [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  '5': [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  '6': [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  '7': [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  '8': [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  '9': [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  ' ': [0, 0, 0, 0, 0, 0, 0],
  '.': [0, 0, 0, 0, 0, 0x0c, 0x0c],
  ',': [0, 0, 0, 0, 0x0c, 0x04, 0x08],
  "'": [0x04, 0x04, 0x08, 0, 0, 0, 0],
  '-': [0, 0, 0, 0x1f, 0, 0, 0],
  ':': [0, 0x0c, 0x0c, 0, 0x0c, 0x0c, 0],
  ';': [0, 0x0c, 0x0c, 0, 0x0c, 0x04, 0x08],
  '!': [0x04, 0x04, 0x04, 0x04, 0x04, 0, 0x04],
  '?': [0x0e, 0x11, 0x01, 0x02, 0x04, 0, 0x04],
  '(': [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ')': [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  '/': [0x01, 0x01, 0x02, 0x04, 0x08, 0x10, 0x10],
  '%': [0x19, 0x19, 0x02, 0x04, 0x08, 0x13, 0x13],
  '&': [0x0c, 0x12, 0x14, 0x08, 0x15, 0x12, 0x0d],
  '+': [0, 0x04, 0x04, 0x1f, 0x04, 0x04, 0],
  '=': [0, 0, 0x1f, 0, 0x1f, 0, 0],
};

// ---------------------------------------------------------------------------
// Canvas: plain RGB buffer, 1024 x 1024.
// ---------------------------------------------------------------------------
type RGB = [number, number, number];

const PAPER: RGB = [246, 241, 231];
const NAVY: RGB = [20, 33, 61];
const GOLD: RGB = [201, 162, 39];
const WHITE: RGB = [255, 255, 255];
const INK: RGB = [26, 26, 26];
const BODY: RGB = [58, 54, 46];
const MUTED: RGB = [110, 104, 90];
const CARD_LINE: RGB = [227, 220, 203];

const buf = Buffer.alloc(W * H * 3);

function fill(x: number, y: number, w: number, h: number, c: RGB): void {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(W, x + w);
  const y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const i = (yy * W + xx) * 3;
      buf[i] = c[0];
      buf[i + 1] = c[1];
      buf[i + 2] = c[2];
    }
  }
}

function textWidth(text: string, scale: number): number {
  if (text.length === 0) return 0;
  return text.length * 6 * scale - scale;
}

function drawText(text: string, x: number, y: number, scale: number, c: RGB): void {
  const upper = text.toUpperCase();
  for (let ci = 0; ci < upper.length; ci++) {
    const glyph = FONT[upper[ci]] ?? FONT[' '];
    const gx = x + ci * 6 * scale;
    for (let row = 0; row < 7; row++) {
      const bits = glyph[row];
      for (let col = 0; col < 5; col++) {
        if ((bits >> (4 - col)) & 1) {
          fill(gx + col * scale, y + row * scale, scale, scale, c);
        }
      }
    }
  }
}

function drawCentered(text: string, cx: number, y: number, scale: number, c: RGB): void {
  drawText(text, cx - Math.floor(textWidth(text, scale) / 2), y, scale, c);
}

// Greedy word wrap: returns lines that fit maxWidth at the given scale.
// Avoids a lone short word on the last line: pulls one word down from above.
function wrap(text: string, scale: number, maxWidth: number): string[] {
  const words = text.toUpperCase().split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const trial = line === '' ? word : line + ' ' + word;
    if (textWidth(trial, scale) <= maxWidth || line === '') {
      line = trial;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line !== '') lines.push(line);
  if (lines.length >= 2) {
    const last = lines[lines.length - 1];
    if (!last.includes(' ') && last.length <= 6) {
      const prev = lines[lines.length - 2];
      const cut = prev.lastIndexOf(' ');
      if (cut > 0) {
        const moved = prev.slice(cut + 1) + ' ' + last;
        if (textWidth(moved, scale) <= maxWidth) {
          lines[lines.length - 2] = prev.slice(0, cut);
          lines[lines.length - 1] = moved;
        }
      }
    }
  }
  return lines;
}

// ---------------------------------------------------------------------------
// PNG encoder: 8-bit RGB, one zlib stream, fixed compression level.
// ---------------------------------------------------------------------------
const CRC_TABLE: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}

function crc32(data: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}

function encodePNG(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    buf.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Content: five verified stories from Tuesday 24 November 2026.
// ---------------------------------------------------------------------------
type Story = { tag: string; accent: RGB; headline: string; body: string };

const STORIES: Story[] = [
  {
    tag: 'GAZA - MIDDLE EAST',
    accent: [180, 35, 24],
    headline: "ISRAELI STRIKE KILLS HAMAS INTERNAL SECURITY CHIEF",
    body: 'Naeem Abu Nahel killed in Gaza City airstrikes, despite 2025 ceasefire, strikes continue.',
  },
  {
    tag: 'UKRAINE - EUROPE',
    accent: [23, 92, 211],
    headline: 'RUSSIAN STRIKE HITS ZAPORIZHZHIA FLATS',
    body: 'Overnight attack on an apartment block kills 2 and injures 48, including 4 children.',
  },
  {
    tag: 'RIYADH - GULF',
    accent: [181, 71, 8],
    headline: "HOUTHI STRIKE HITS RIYADH'S TALLEST TOWER",
    body: 'PIF Tower struck for the second time in a week - at least 11 injured.',
  },
  {
    tag: 'HANOI - ASIA',
    accent: [6, 118, 71],
    headline: 'GAS BLAST KILLS 6 AT HANOI EATERY',
    body: 'Suspected gas blast at a hot-pot restaurant kills 6 and injures more than a dozen.',
  },
  {
    tag: 'WORLD - GLOBAL',
    accent: [105, 65, 198],
    headline: 'LANDMINE CASUALTIES HIT FIVE-YEAR HIGH',
    body: '7,000 casualties in 2025, the most in five years; Myanmar highest; Syria also surges.',
  },
];

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------
fill(0, 0, W, H, PAPER);

// Header band.
fill(0, 0, W, 190, NAVY);
drawCentered('TUESDAY', W / 2, 24, 3, GOLD);
drawCentered('24 NOVEMBER 2026', W / 2, 56, 8, WHITE);
fill(212, 134, 600, 4, GOLD);
drawCentered('THE WORLD IN ONE DAY', W / 2, 150, 3, WHITE);

// Story cards.
const CARD_X = 28;
const CARD_W = W - 2 * CARD_X;
const ROW_H = 150;
const ROW_GAP = 8;
let rowY = 204;
for (const story of STORIES) {
  fill(CARD_X, rowY, CARD_W, ROW_H, WHITE);
  fill(CARD_X, rowY, CARD_W, 1, CARD_LINE);
  fill(CARD_X, rowY + ROW_H - 1, CARD_W, 1, CARD_LINE);
  fill(CARD_X, rowY, 14, ROW_H, story.accent);
  const tx = CARD_X + 34;
  const maxText = CARD_X + CARD_W - 24 - tx;
  drawText(story.tag, tx, rowY + 13, 2, story.accent);
  let y = rowY + 37;
  const headLines = wrap(story.headline, 4, maxText);
  for (const line of headLines.slice(0, 2)) {
    drawText(line, tx, y, 4, INK);
    y += 32;
  }
  const bodyLines = wrap(story.body, 3, maxText);
  for (const line of bodyLines.slice(0, 2)) {
    drawText(line, tx, y + 2, 3, BODY);
    y += 24;
  }
  rowY += ROW_H + ROW_GAP;
}

// Footer.
drawCentered('SOURCES: AP, REUTERS, AFP, SCMP', W / 2, 996, 2, MUTED);

// ---------------------------------------------------------------------------
// Write it out.
// ---------------------------------------------------------------------------
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), encodePNG());
