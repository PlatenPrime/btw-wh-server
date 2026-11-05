import sharp from "sharp";

/** Keep in sync with SKU_EXCEL_PHOTO_MAX_PX in skuExcelPhoto.ts */
export const SKU_PREVIEW_MAX_EDGE_PX = 150;
export const SKU_PREVIEW_JPEG_QUALITY = 75;
export const SKU_PREVIEW_CONCURRENCY = 8;
export const SKU_PREVIEW_FETCH_TIMEOUT_MS = 10_000;
export const SKU_PREVIEW_MAX_BYTES = 5 * 1024 * 1024;
export const SKU_PREVIEW_MAX_INPUT_PIXELS = 20_000_000;
export const SKU_PREVIEW_USER_AGENT = "btw-wh-server/excel-job";

export type SkuPreviewJpeg = {
  buffer: Buffer;
  width: number;
  height: number;
};

export type SkuPreviewFetcher = (url: string, timeoutMs: number) => Promise<Buffer | null>;

export function isHttpImageUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function readCappedBody(
  body: ReadableStream<Uint8Array>,
  maxBytes: number,
): Promise<Buffer | null> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || value.byteLength === 0) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }
  if (total === 0) return null;
  return Buffer.concat(chunks);
}

export async function fetchSkuImageBytes(
  url: string,
  timeoutMs = SKU_PREVIEW_FETCH_TIMEOUT_MS,
  maxBytes = SKU_PREVIEW_MAX_BYTES,
): Promise<Buffer | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent": SKU_PREVIEW_USER_AGENT,
      },
    });
    if (!response.ok) return null;
    const rawLength = response.headers.get("content-length");
    if (rawLength !== null) {
      const declared = Number(rawLength);
      if (!Number.isFinite(declared) || declared <= 0 || declared > maxBytes) return null;
    }
    if (!response.body) return null;
    return await readCappedBody(response.body, maxBytes);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function resizeImageToPreviewJpeg(input: Buffer): Promise<SkuPreviewJpeg | null> {
  if (input.length === 0) return null;
  try {
    const { data, info } = await sharp(input, {
      failOn: "none",
      limitInputPixels: SKU_PREVIEW_MAX_INPUT_PIXELS,
      animated: false,
    })
      .rotate()
      .resize({
        width: SKU_PREVIEW_MAX_EDGE_PX,
        height: SKU_PREVIEW_MAX_EDGE_PX,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: SKU_PREVIEW_JPEG_QUALITY })
      .toBuffer({ resolveWithObject: true });
    if (!info.width || !info.height || data.length === 0) return null;
    return { buffer: data, width: info.width, height: info.height };
  } catch {
    return null;
  }
}

export async function loadSkuPreviewJpegs(
  rows: readonly { skuId: string; imageUrl: string }[],
  options: {
    concurrency?: number;
    timeoutMs?: number;
    fetchImage?: SkuPreviewFetcher;
    onBatch?: (done: number, total: number) => void;
  } = {},
): Promise<Map<string, SkuPreviewJpeg>> {
  const concurrency = Math.max(1, options.concurrency ?? SKU_PREVIEW_CONCURRENCY);
  const timeoutMs = options.timeoutMs ?? SKU_PREVIEW_FETCH_TIMEOUT_MS;
  const fetchImage = options.fetchImage ?? fetchSkuImageBytes;
  const targets = rows.filter((row) => isHttpImageUrl(row.imageUrl));
  const previews = new Map<string, SkuPreviewJpeg>();
  if (targets.length === 0) {
    options.onBatch?.(0, 1);
    return previews;
  }

  let done = 0;
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < targets.length) {
      const row = targets[cursor];
      cursor += 1;
      if (!row) continue;
      try {
        const bytes = await fetchImage(row.imageUrl.trim(), timeoutMs);
        if (bytes && bytes.length > 0) {
          const preview = await resizeImageToPreviewJpeg(bytes);
          if (preview) previews.set(row.skuId, preview);
        }
      } catch {
        // битый ответ или ресайз не должны ронять job
      }
      done += 1;
      if (done % concurrency === 0 || done === targets.length) {
        options.onBatch?.(done, targets.length);
      }
    }
  }

  const workerCount = Math.min(concurrency, targets.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return previews;
}
