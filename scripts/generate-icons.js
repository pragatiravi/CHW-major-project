/* global Buffer */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPng(width, height, isMaskable = false) {
  // Simple uncompressed or deflate PNG generator
  // RGBA buffer
  const stride = width * 4 + 1; // 1 filter byte per scanline
  const rawData = Buffer.alloc(stride * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = isMaskable ? width * 0.45 : width * 0.42;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * stride;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background color: #0284c7 (teal/blue primary)
      // Maskable uses full square with rounded corners or full fill
      let r = 2, g = 132, b = 199, a = 255;

      if (!isMaskable && dist > radius) {
        // Transparent outside circular badge for standard icon
        a = 0;
      } else {
        // Draw medical cross in center
        const armW = width * 0.14;
        const armL = width * 0.42;
        const inVertArm = Math.abs(dx) <= armW / 2 && Math.abs(dy) <= armL / 2;
        const inHorizArm = Math.abs(dy) <= armW / 2 && Math.abs(dx) <= armL / 2;

        if (inVertArm || inHorizArm) {
          // White cross
          r = 255;
          g = 255;
          b = 255;
          a = 255;
        } else {
          // Subtle pulse/heartbeat or accent
          if (dist > radius * 0.88 && dist <= radius) {
            // White border ring
            r = 255; g = 255; b = 255; a = 255;
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // Compress IDAT
  const compressedData = zlib.deflateSync(rawData);

  // Helper to calculate CRC32
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
    }
    crcTable[n] = c;
  }
  function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ (-1)) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const chunk = Buffer.alloc(12 + len);
    chunk.writeUInt32BE(len, 0);
    chunk.write(type, 4, 4, 'ascii');
    data.copy(chunk, 8);
    const typeAndData = chunk.subarray(4, 8 + len);
    chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
    return chunk;
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type 6: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.resolve('public', 'icons');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'icon-192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(outDir, 'icon-maskable.png'), createPng(512, 512, true));

console.log('Generated icon-192.png, icon-512.png, and icon-maskable.png');
