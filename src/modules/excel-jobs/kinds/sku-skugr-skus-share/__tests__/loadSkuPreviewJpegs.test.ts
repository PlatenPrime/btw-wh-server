import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SKU_PREVIEW_USER_AGENT,
  fetchSkuImageBytes,
  isHttpImageUrl,
  loadSkuPreviewJpegs,
  readCappedBody,
  resizeImageToPreviewJpeg,
} from "../loadSkuPreviewJpegs.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isHttpImageUrl", () => {
  it("accepts http and https only", () => {
    expect(isHttpImageUrl(" https://cdn.example/a.jpg ")).toBe(true);
    expect(isHttpImageUrl("http://cdn.example/a.jpg")).toBe(true);
    expect(isHttpImageUrl("")).toBe(false);
    expect(isHttpImageUrl("ftp://cdn.example/a.jpg")).toBe(false);
    expect(isHttpImageUrl("not a url")).toBe(false);
  });
});

describe("readCappedBody", () => {
  it("concatenates chunks under the cap", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.enqueue(new Uint8Array());
        controller.enqueue(new Uint8Array([3]));
        controller.close();
      },
    });
    const buffer = await readCappedBody(body, 4);
    expect(buffer?.equals(Buffer.from([1, 2, 3]))).toBe(true);
  });

  it("returns null for an empty body, an oversized body, and a read error", async () => {
    const empty = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.close();
      },
    });
    const oversized = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]));
        controller.enqueue(new Uint8Array([4, 5]));
        controller.close();
      },
    });
    const broken = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error("boom"));
      },
    });
    expect(await readCappedBody(empty, 4)).toBeNull();
    expect(await readCappedBody(oversized, 4)).toBeNull();
    expect(await readCappedBody(broken, 4)).toBeNull();
  });
});

describe("fetchSkuImageBytes", () => {
  it("returns the body and sends a user-agent", async () => {
    vi.stubGlobal("fetch", async (_url: string, init?: RequestInit) => {
      expect(new Headers(init?.headers).get("user-agent")).toBe(SKU_PREVIEW_USER_AGENT);
      expect(init?.method).toBe("GET");
      return new Response(new Uint8Array([9, 8, 7]), { status: 200 });
    });
    const bytes = await fetchSkuImageBytes("https://cdn.example/a.jpg", 1000, 100);
    expect(bytes?.equals(Buffer.from([9, 8, 7]))).toBe(true);
  });

  it("returns null for a non-ok response, an empty length, and a declared oversize", async () => {
    vi.stubGlobal("fetch", async () => new Response("nope", { status: 404 }));
    expect(await fetchSkuImageBytes("https://cdn.example/a.jpg", 1000, 100)).toBeNull();

    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(new Uint8Array([1]), { status: 200, headers: { "content-length": "0" } }),
    );
    expect(await fetchSkuImageBytes("https://cdn.example/a.jpg", 1000, 100)).toBeNull();

    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(new Uint8Array([1, 2, 3, 4, 5]), {
          status: 200,
          headers: { "content-length": "5" },
        }),
    );
    expect(await fetchSkuImageBytes("https://cdn.example/a.jpg", 1000, 4)).toBeNull();
  });

  it("reads a chunked body when content-length is absent", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.enqueue(new Uint8Array([3]));
        controller.close();
      },
    });
    vi.stubGlobal("fetch", async () => new Response(stream, { status: 200 }));
    const bytes = await fetchSkuImageBytes("https://cdn.example/a.jpg", 1000, 10);
    expect(bytes?.equals(Buffer.from([1, 2, 3]))).toBe(true);
  });

  it("returns null when the streamed body exceeds maxBytes", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]));
        controller.enqueue(new Uint8Array([4, 5]));
        controller.close();
      },
    });
    vi.stubGlobal("fetch", async () => new Response(stream, { status: 200 }));
    expect(await fetchSkuImageBytes("https://cdn.example/a.jpg", 1000, 4)).toBeNull();
  });

  it("returns null when fetch throws or times out", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new Error("network");
    });
    expect(await fetchSkuImageBytes("https://cdn.example/a.jpg", 1000, 100)).toBeNull();

    vi.stubGlobal(
      "fetch",
      (_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
    );
    expect(await fetchSkuImageBytes("https://cdn.example/slow.jpg", 30, 100)).toBeNull();
  });

  it("returns null when the response has no body", async () => {
    vi.stubGlobal(
      "fetch",
      async () =>
        ({
          ok: true,
          headers: new Headers(),
          body: null,
        }) as Response,
    );
    expect(await fetchSkuImageBytes("https://cdn.example/a.jpg", 1000, 100)).toBeNull();
  });
});

describe("resizeImageToPreviewJpeg", () => {
  it("fits inside 150 and does not upscale", async () => {
    const wide = await sharp({
      create: { width: 300, height: 100, channels: 3, background: { r: 10, g: 20, b: 30 } },
    })
      .png()
      .toBuffer();
    const tall = await sharp({
      create: { width: 100, height: 300, channels: 3, background: { r: 1, g: 2, b: 3 } },
    })
      .png()
      .toBuffer();
    const small = await sharp({
      create: { width: 50, height: 40, channels: 3, background: { r: 4, g: 5, b: 6 } },
    })
      .png()
      .toBuffer();

    const widePreview = await resizeImageToPreviewJpeg(wide);
    const tallPreview = await resizeImageToPreviewJpeg(tall);
    const smallPreview = await resizeImageToPreviewJpeg(small);

    expect(widePreview).toMatchObject({ width: 150, height: 50 });
    expect(tallPreview).toMatchObject({ width: 50, height: 150 });
    expect(smallPreview).toMatchObject({ width: 50, height: 40 });
    expect(widePreview?.buffer.subarray(0, 2).toString("hex")).toBe("ffd8");
    expect(widePreview?.buffer.equals(wide)).toBe(false);
  });

  it("returns null for an empty or non-image buffer", async () => {
    expect(await resizeImageToPreviewJpeg(Buffer.alloc(0))).toBeNull();
    expect(await resizeImageToPreviewJpeg(Buffer.from("not-an-image"))).toBeNull();
  });
});

describe("loadSkuPreviewJpegs", () => {
  it("reports 0/1 and does not fetch when nothing is downloadable", async () => {
    const fetchImage = vi.fn(async () => Buffer.from("x"));
    const batches: Array<[number, number]> = [];
    const previews = await loadSkuPreviewJpegs(
      [
        { skuId: "a", imageUrl: "" },
        { skuId: "b", imageUrl: "ftp://cdn.example/a.jpg" },
        { skuId: "c", imageUrl: "   " },
      ],
      {
        fetchImage,
        onBatch: (done, total) => batches.push([done, total]),
      },
    );
    expect(previews.size).toBe(0);
    expect(fetchImage).not.toHaveBeenCalled();
    expect(batches).toEqual([[0, 1]]);
  });

  it("stores a resized jpeg and ignores a failed fetch", async () => {
    const png = await sharp({
      create: { width: 400, height: 100, channels: 3, background: { r: 9, g: 8, b: 7 } },
    })
      .png()
      .toBuffer();
    const previews = await loadSkuPreviewJpegs(
      [
        { skuId: "ok", imageUrl: "https://cdn.example/ok.png" },
        { skuId: "bad", imageUrl: "https://cdn.example/bad.png" },
      ],
      {
        fetchImage: async (url) => {
          if (url.endsWith("bad.png")) throw new Error("timeout");
          return png;
        },
      },
    );
    expect(previews.has("bad")).toBe(false);
    expect(previews.get("ok")).toMatchObject({ width: 150, height: 38 });
    expect(previews.get("ok")?.buffer.equals(png)).toBe(false);
  });

  it("keeps at most the configured number of fetches in flight and reports batches", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const batches: Array<[number, number]> = [];
    const rows = Array.from({ length: 9 }, (_, index) => ({
      skuId: String(index),
      imageUrl: `https://cdn.example/${index}.jpg`,
    }));

    const previews = await loadSkuPreviewJpegs(rows, {
      concurrency: 8,
      fetchImage: async () => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((resolve) => setTimeout(resolve, 15));
        inFlight -= 1;
        return Buffer.from("not-an-image");
      },
      onBatch: (done, total) => batches.push([done, total]),
    });

    expect(previews.size).toBe(0);
    expect(maxInFlight).toBeLessThanOrEqual(8);
    expect(maxInFlight).toBeGreaterThan(1);
    expect(batches).toEqual([
      [8, 9],
      [9, 9],
    ]);
  });
});
