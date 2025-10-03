export type Hash = string;

function getCanvasCtx(size = 8) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  return ctx;
}

function imageToAHash(img: HTMLImageElement, size = 8): Hash {
  const ctx = getCanvasCtx(size);
  // draw scaled image
  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  const grays: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    // luminance
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    grays.push(y);
  }
  const avg = grays.reduce((a, b) => a + b, 0) / grays.length;
  // bit string
  let bits = "";
  for (const y of grays) bits += y >= avg ? "1" : "0";
  return bits;
}

export async function computeAHashFromFile(
  file: File,
  size = 8,
): Promise<Hash> {
  const url = await new Promise<string>((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(file);
  });
  const img = await loadImage(url);
  return imageToAHash(img, size);
}

export async function computeAHashFromUrl(
  url: string,
  size = 8,
): Promise<Hash> {
  const img = await loadImage(url, true);
  return imageToAHash(img, size);
}

function loadImage(src: string, anon = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (anon) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

export function hamming(a: Hash, b: Hash): number {
  const len = Math.min(a.length, b.length);
  let d = 0;
  for (let i = 0; i < len; i++) if (a[i] !== b[i]) d++;
  return d + Math.abs(a.length - b.length);
}
