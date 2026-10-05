import fs from 'fs';
import zlib from 'zlib';

/**
 * Dependency-free ZIP writer (store/deflate) using Node's built-in zlib.
 * Avoids the `archiver` package, whose nested `readdir-glob` dependency
 * fails to resolve under the bundler. Produces standard ZIP archives
 * readable by any unzip tool and by our own reader in engine.ts.
 */

// ── CRC32 ───────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export type ZipInput =
  | { name: string; absPath: string }
  | { name: string; data: Buffer };

/**
 * Write a ZIP archive to `outPath`. Each entry is read fully then
 * deflated in memory (fine for DB dumps and typical upload files).
 */
export async function writeZip(outPath: string, entries: ZipInput[]): Promise<void> {
  const out = fs.createWriteStream(outPath);
  const done = new Promise<void>((resolve, reject) => {
    out.on('close', () => resolve());
    out.on('error', reject);
  });

  let offset = 0;
  const central: Buffer[] = [];
  let count = 0;

  const write = (buf: Buffer): Promise<void> =>
    new Promise((resolve, reject) => {
      out.write(buf, err => err ? reject(err) : resolve());
    });

  for (const entry of entries) {
    const data: Buffer = 'data' in entry ? entry.data : fs.readFileSync(entry.absPath);
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const crc = crc32(data);
    const uncompSize = data.length;

    // Deflate; fall back to store if it doesn't help.
    let method = 8;
    let body: Buffer = Buffer.from(zlib.deflateRawSync(data, { level: 9 }));
    if (body.length >= uncompSize) { method = 0; body = data; }
    const compSize = body.length;

    // Local file header
    const lfh = Buffer.alloc(30);
    lfh.writeUInt32LE(0x04034b50, 0);   // signature
    lfh.writeUInt16LE(20, 4);           // version needed
    lfh.writeUInt16LE(0x0800, 6);       // flags (bit 11 = UTF-8 names)
    lfh.writeUInt16LE(method, 8);       // compression method
    lfh.writeUInt16LE(0, 10);           // mod time
    lfh.writeUInt16LE(0, 12);           // mod date
    lfh.writeUInt32LE(crc, 14);         // crc32
    lfh.writeUInt32LE(compSize, 18);    // compressed size
    lfh.writeUInt32LE(uncompSize, 22);  // uncompressed size
    lfh.writeUInt16LE(nameBuf.length, 26);
    lfh.writeUInt16LE(0, 28);           // extra len

    await write(lfh);
    await write(nameBuf);
    await write(body);

    // Central directory header
    const cdh = Buffer.alloc(46);
    cdh.writeUInt32LE(0x02014b50, 0);   // signature
    cdh.writeUInt16LE(20, 4);           // version made by
    cdh.writeUInt16LE(20, 6);           // version needed
    cdh.writeUInt16LE(0x0800, 8);       // flags
    cdh.writeUInt16LE(method, 10);
    cdh.writeUInt16LE(0, 12);           // mod time
    cdh.writeUInt16LE(0, 14);           // mod date
    cdh.writeUInt32LE(crc, 16);
    cdh.writeUInt32LE(compSize, 20);
    cdh.writeUInt32LE(uncompSize, 24);
    cdh.writeUInt16LE(nameBuf.length, 28);
    cdh.writeUInt16LE(0, 30);           // extra len
    cdh.writeUInt16LE(0, 32);           // comment len
    cdh.writeUInt16LE(0, 34);           // disk number start
    cdh.writeUInt16LE(0, 36);           // internal attrs
    cdh.writeUInt32LE(0, 38);           // external attrs
    cdh.writeUInt32LE(offset, 42);      // local header offset
    central.push(Buffer.concat([cdh, nameBuf]));

    offset += lfh.length + nameBuf.length + body.length;
    count++;
  }

  const cdBuf = Buffer.concat(central);
  await write(cdBuf);

  // End of central directory record
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);            // disk number
  eocd.writeUInt16LE(0, 6);            // disk with CD
  eocd.writeUInt16LE(count, 8);        // entries this disk
  eocd.writeUInt16LE(count, 10);       // total entries
  eocd.writeUInt32LE(cdBuf.length, 12); // CD size
  eocd.writeUInt32LE(offset, 16);      // CD offset
  eocd.writeUInt16LE(0, 20);           // comment len
  await write(eocd);

  out.end();
  return done;
}
