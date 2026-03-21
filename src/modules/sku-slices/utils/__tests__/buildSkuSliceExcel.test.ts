import { describe, expect, it } from "vitest";
import {
  buildSkuSliceExcelForSkus,
  formatDateHeader,
  safeFilePart,
} from "../buildSkuSliceExcel.js";

describe("buildSkuSliceExcelForSkus", () => {
  it("produces xlsx buffer and filename for one sku", async () => {
    const from = new Date("2026-01-10T00:00:00.000Z");
    const to = new Date("2026-01-11T00:00:00.000Z");
    const { buffer, fileName } = await buildSkuSliceExcelForSkus(
      [
        {
          title: "N",
          url: "https://x.com",
          productId: "air-1",
          konkName: "air",
          prodName: "p",
        },
      ],
      from,
      to,
      (_kn, pid, d) => {
        if (pid !== "air-1") return undefined;
        const t = d.getTime();
        if (t === from.getTime()) return { stock: 1, price: 2 };
        if (t === to.getTime()) return { stock: 2, price: 3 };
        return undefined;
      }
    );

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(100);
    expect(fileName).toContain("sku_slice_air-1");
    expect(fileName.endsWith(".xlsx")).toBe(true);
  });
});

describe("buildSkuSliceExcel helpers", () => {
  it("formatDateHeader is UTC YYYY-MM-DD", () => {
    expect(
      formatDateHeader(new Date("2026-03-05T00:00:00.000Z"))
    ).toBe("2026-03-05");
  });

  it("safeFilePart strips unsafe chars", () => {
    expect(safeFilePart("a/b:c")).toBe("a_b_c");
  });
});
