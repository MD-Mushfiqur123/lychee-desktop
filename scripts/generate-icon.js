// Generate a 256x256 PNG app icon for Lychee Desktop
// Pure Node.js — zero dependencies, minimal valid PNG

const fs = require('fs');

const WIDTH = 256;
const HEIGHT = 256;

// --- Pixel buffer (RGBA) ---
const pixels = Buffer.alloc(WIDTH * HEIGHT * 4);

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
  const i = (y * WIDTH + x) * 4;
  pixels[i] = r;
  pixels[i + 1] = g;
  pixels[i + 2] = b;
  pixels[i + 3] = a;
}

// Dark background #0d1117
for (let i = 0; i < WIDTH * HEIGHT; i++) {
  const off = i * 4;
  pixels[off] = 13;
  pixels[off + 1] = 17;
  pixels[off + 2] = 23;
  pixels[off + 3] = 255;
}

// Draw L shape — amber/gold #f59e0b with shadow #d97706
const stemL = 85, stemR = 115, stemT = 55, stemB = 185;
const baseL = 85, baseR = 175, baseT = 175, baseB = 198;
const shadowOff = 5;

// Shadow
for (let y = stemT + shadowOff; y < stemB + shadowOff; y++) {
  for (let x = stemL + shadowOff; x < stemR + shadowOff; x++) {
    if (x >= WIDTH || y >= HEIGHT) continue;
    // Don't shadow-base overlap area (already will be covered by main base shadow)
    if (y >= baseT + shadowOff && x >= baseL + shadowOff) break;
    setPixel(x, y, 217, 119, 6);
  }
}
for (let y = baseT + shadowOff; y < baseB + shadowOff; y++) {
  for (let x = baseL + shadowOff; x < baseR + shadowOff; x++) {
    setPixel(x, y, 217, 119, 6);
  }
}

// Main L
for (let y = stemT; y < stemB; y++) {
  for (let x = stemL; x < stemR; x++) {
    if (y >= baseT && x >= baseL) break; // don't double-draw overlap
    setPixel(x, y, 245, 158, 11);
  }
}
for (let y = baseT; y < baseB; y++) {
  for (let x = baseL; x < baseR; x++) {
    setPixel(x, y, 245, 158, 11);
  }
}

// --- PNG Encoder ---

function crc32(buf) {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeB = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeB, data]);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(crcData));
  return Buffer.concat([len, typeB, data, crcVal]);
}

// Zlib compressor (stored / uncompressed blocks)
function zlibStored(data) {
  const cmf = 0x78;
  const flg = 0x01;
  const blocks = [];
  const maxBlock = 65535;
  for (let offset = 0; offset < data.length; offset += maxBlock) {
    const block = data.slice(offset, offset + maxBlock);
    const isFinal = (offset + maxBlock >= data.length) ? 1 : 0;
    blocks.push(isFinal);
    blocks.push(0, 0); // BTYPE=00
    const len16 = block.length & 0xFFFF;
    const nlen16 = (~block.length) & 0xFFFF;
    blocks.push(len16 & 0xFF, (len16 >> 8) & 0xFF);
    blocks.push(nlen16 & 0xFF, (nlen16 >> 8) & 0xFF);
    for (let j = 0; j < block.length; j++) blocks.push(block[j]);
  }

  // Adler-32
  let a = 1, b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  const adler = ((b << 16) | a) >>> 0;
  const adlerBuf = Buffer.alloc(4);
  adlerBuf.writeUInt32BE(adler);

  return Buffer.concat([
    Buffer.from([cmf, flg]),
    Buffer.from(blocks),
    adlerBuf
  ]);
}

// Raw image data (filter byte 0 per row)
const raw = [];
for (let y = 0; y < HEIGHT; y++) {
  raw.push(0); // filter: none
  for (let x = 0; x < WIDTH; x++) {
    const i = (y * WIDTH + x) * 4;
    raw.push(pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]);
  }
}

// IHDR
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(WIDTH, 0);
ihdr.writeUInt32BE(HEIGHT, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 6;  // color type RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const idatData = zlibStored(Buffer.from(raw));
const pngBuffer = Buffer.concat([
  signature,
  chunk('IHDR', ihdr),
  chunk('IDAT', idatData),
  chunk('IEND', Buffer.alloc(0))
]);

const outPath = require('path').join(__dirname, '..', 'build', 'appicon.png');
fs.writeFileSync(outPath, pngBuffer);
console.log(`Icon written: ${outPath} (${pngBuffer.length} bytes, ${WIDTH}x${HEIGHT})`);
