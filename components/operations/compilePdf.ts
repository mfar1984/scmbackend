// Minimal dependency-free PDF compiler.
// Takes a list of image data-URLs (JPEG/PNG) and produces a single PDF
// data-URL with one image per A4 page. Used to "compile & scan" tender
// document images into one submission PDF, entirely in the browser.
//
// Note: only images are embedded. Existing PDF attachments are kept as
// separate documents (a browser-only merge of real PDFs needs a heavy lib).

const A4 = { w: 595.28, h: 841.89 }; // points

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// Convert any image data-URL to a JPEG data-URL (so PDF can embed DCTDecode).
async function toJpeg(dataUrl: string, quality = 0.85): Promise<{ b64: string; w: number; h: number }> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  const jpeg = canvas.toDataURL('image/jpeg', quality);
  const b64 = jpeg.split(',')[1];
  return { b64, w: canvas.width, h: canvas.height };
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Build a PDF from JPEG images (one per A4 page, centered & fit).
export async function compileImagesToPdf(imageDataUrls: string[]): Promise<string> {
  const jpegs = [];
  for (const url of imageDataUrls) jpegs.push(await toJpeg(url));

  // PDF object assembly
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (data: Uint8Array | string) => {
    const bytes = typeof data === 'string' ? enc.encode(data) : data;
    chunks.push(bytes); length += bytes.length;
  };
  const objStart = () => { offsets.push(length); };

  push('%PDF-1.4\n');

  const numImages = jpegs.length;
  // object numbering:
  // 1 = catalog, 2 = pages, then per image: page, content, image  (3 objs each)
  const pageIds: number[] = [];
  let objNo = 3;
  for (let i = 0; i < numImages; i++) { pageIds.push(objNo); objNo += 3; }

  // 1: Catalog
  objStart(); push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
  // 2: Pages
  objStart(); push(`2 0 obj\n<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${numImages} >>\nendobj\n`);

  for (let i = 0; i < numImages; i++) {
    const j = jpegs[i];
    const pageObj = pageIds[i];
    const contentObj = pageObj + 1;
    const imgObj = pageObj + 2;

    // fit image into A4 keeping aspect ratio
    const scale = Math.min(A4.w / j.w, A4.h / j.h);
    const dw = j.w * scale, dh = j.h * scale;
    const dx = (A4.w - dw) / 2, dy = (A4.h - dh) / 2;
    const content = `q\n${dw.toFixed(2)} 0 0 ${dh.toFixed(2)} ${dx.toFixed(2)} ${dy.toFixed(2)} cm\n/Im0 Do\nQ\n`;

    // page
    objStart(); push(`${pageObj} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4.w} ${A4.h}] /Resources << /XObject << /Im0 ${imgObj} 0 R >> >> /Contents ${contentObj} 0 R >>\nendobj\n`);
    // content stream
    objStart(); push(`${contentObj} 0 obj\n<< /Length ${enc.encode(content).length} >>\nstream\n${content}endstream\nendobj\n`);
    // image xobject
    const imgBytes = base64ToBytes(j.b64);
    objStart();
    push(`${imgObj} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${j.w} /Height ${j.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`);
    push(imgBytes);
    push('\nendstream\nendobj\n');
  }

  // xref
  const xrefStart = length;
  const totalObjs = offsets.length; // objects 1..totalObjs
  push(`xref\n0 ${totalObjs + 1}\n`);
  push('0000000000 65535 f \n');
  for (const off of offsets) push(`${String(off).padStart(10, '0')} 00000 n \n`);
  push(`trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  // concat chunks
  const out = new Uint8Array(length);
  let pos = 0;
  for (const c of chunks) { out.set(c, pos); pos += c.length; }
  // to base64
  let bin = '';
  for (let i = 0; i < out.length; i++) bin += String.fromCharCode(out[i]);
  return 'data:application/pdf;base64,' + btoa(bin);
}
