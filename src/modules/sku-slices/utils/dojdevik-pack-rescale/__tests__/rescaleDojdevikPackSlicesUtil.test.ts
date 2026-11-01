import { beforeEach, describe, expect, it, vi } from "vitest";

const { skuFind, monthFind, monthUpdateOne } = vi.hoisted(() => ({
  skuFind: vi.fn(),
  monthFind: vi.fn(),
  monthUpdateOne: vi.fn(),
}));

vi.mock("../../../../skus/models/Sku.js", () => ({
  Sku: {
    find: (...args: unknown[]) => skuFind(...args),
  },
}));

vi.mock("../../../models/SkuSliceMonth.js", () => ({
  SkuSliceMonth: {
    find: (...args: unknown[]) => monthFind(...args),
    updateOne: (...args: unknown[]) => monthUpdateOne(...args),
  },
}));

vi.mock("../../../../browser/utils/browserRequest.js", () => ({
  getBrowserAxios: vi.fn(),
}));

import { rescaleDojdevikPackSlicesUtil } from "../rescaleDojdevikPackSlicesUtil.js";

function attrRow(name: string, value: string): string {
  return (
    `<td data-qaid="attribute_name">${name}</td>` + `<td data-qaid="attribute_value">${value}</td>`
  );
}

const FOUNTAIN_HTML =
  attrRow("Кількість свічок в наборі", "6 шт.") + attrRow("Кількість у коробці", "100");

const PACK_100_HTML = attrRow("Кількість в пачці.", "100");

function mockSkuQuery(rows: Array<{ productId: string; url: string }>) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    lean: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: undefined as unknown,
  };
  Object.assign(chain, {
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(rows).then(resolve, reject),
  });
  skuFind.mockReturnValue(chain);
  return chain;
}

describe("rescaleDojdevikPackSlicesUtil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dry-run reports would-rescale for pack mismatch without writing", async () => {
    mockSkuQuery([{ productId: "dojdevik-1", url: "https://dojdevik.com.ua/p1.html" }]);
    monthFind.mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        {
          _id: "m1",
          days: { "2026-10-01": { stock: 6300, price: 0.58 } },
        },
      ]),
    });

    const result = await rescaleDojdevikPackSlicesUtil({
      apply: false,
      jitterMinMs: 0,
      jitterMaxMs: 0,
      fetchHtml: async () => FOUNTAIN_HTML,
      sleep: async () => undefined,
      resolveJitterMs: () => 0,
    });

    expect(result.mismatched).toBe(1);
    expect(result.rescaled).toBe(0);
    expect(result.jitterMinMs).toBe(0);
    expect(result.jitterMaxMs).toBe(0);
    expect(result.items[0]).toMatchObject({
      productId: "dojdevik-1",
      packOld: 100,
      packNew: 6,
      status: "would-rescale",
      daysChanged: 1,
    });
    expect(monthUpdateOne).not.toHaveBeenCalled();
  });

  it("apply writes rescaled days", async () => {
    mockSkuQuery([{ productId: "dojdevik-1", url: "https://dojdevik.com.ua/p1.html" }]);
    monthFind.mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        {
          _id: "m1",
          days: { "2026-10-01": { stock: 6300, price: 0.58 } },
        },
      ]),
    });
    monthUpdateOne.mockResolvedValue({ acknowledged: true });

    const result = await rescaleDojdevikPackSlicesUtil({
      apply: true,
      jitterMinMs: 0,
      jitterMaxMs: 0,
      fetchHtml: async () => FOUNTAIN_HTML,
      sleep: async () => undefined,
      resolveJitterMs: () => 0,
    });

    expect(result.rescaled).toBe(1);
    expect(result.items[0]?.status).toBe("rescaled");
    expect(monthUpdateOne).toHaveBeenCalledWith(
      { _id: "m1" },
      { $set: { days: { "2026-10-01": { stock: 378, price: 9.67 } } } },
    );
  });

  it("sleeps random jitter between SKUs", async () => {
    mockSkuQuery([
      { productId: "dojdevik-1", url: "https://dojdevik.com.ua/p1.html" },
      { productId: "dojdevik-2", url: "https://dojdevik.com.ua/p2.html" },
    ]);
    const sleep = vi.fn(async () => undefined);
    const resolveJitterMs = vi.fn(() => 777);

    await rescaleDojdevikPackSlicesUtil({
      apply: false,
      jitterMinMs: 500,
      jitterMaxMs: 1500,
      fetchHtml: async () => PACK_100_HTML,
      sleep,
      resolveJitterMs,
    });

    expect(resolveJitterMs).toHaveBeenCalledWith(500, 1500);
    expect(sleep).toHaveBeenCalledOnce();
    expect(sleep).toHaveBeenCalledWith(777);
  });

  it("reports progress on first, every Nth, and last SKU", async () => {
    mockSkuQuery(
      Array.from({ length: 12 }, (_, i) => ({
        productId: `dojdevik-${i + 1}`,
        url: `https://dojdevik.com.ua/p${i + 1}.html`,
      })),
    );
    const onProgress = vi.fn();

    await rescaleDojdevikPackSlicesUtil({
      apply: false,
      jitterMinMs: 0,
      jitterMaxMs: 0,
      progressEvery: 10,
      onProgress,
      fetchHtml: async () => PACK_100_HTML,
      sleep: async () => undefined,
      resolveJitterMs: () => 0,
    });

    const indexes = onProgress.mock.calls.map((c) => c[0].index);
    expect(indexes).toEqual([1, 10, 12]);
  });

  it("skips when packs match", async () => {
    mockSkuQuery([{ productId: "dojdevik-2", url: "https://dojdevik.com.ua/p2.html" }]);

    const result = await rescaleDojdevikPackSlicesUtil({
      apply: true,
      jitterMinMs: 0,
      jitterMaxMs: 0,
      fetchHtml: async () => PACK_100_HTML,
      sleep: async () => undefined,
      resolveJitterMs: () => 0,
    });

    expect(result.mismatched).toBe(0);
    expect(result.items[0]?.status).toBe("skipped-same-pack");
    expect(monthFind).not.toHaveBeenCalled();
  });

  it("records fetch-error", async () => {
    mockSkuQuery([{ productId: "dojdevik-3", url: "https://dojdevik.com.ua/p3.html" }]);

    const result = await rescaleDojdevikPackSlicesUtil({
      apply: false,
      jitterMinMs: 0,
      jitterMaxMs: 0,
      fetchHtml: async () => {
        throw new Error("boom");
      },
      sleep: async () => undefined,
      resolveJitterMs: () => 0,
    });

    expect(result.fetchErrors).toBe(1);
    expect(result.items[0]?.status).toBe("fetch-error");
  });
});
