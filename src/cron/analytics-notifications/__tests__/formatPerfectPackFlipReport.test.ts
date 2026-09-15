import { describe, expect, it } from "vitest";
import { formatPerfectPackFlipReport } from "../formatPerfectPackFlipReport.js";
import type { PackFlipFinding } from "../../../modules/sku-slices/utils/reviewPerfectPackFlipsUtil.js";

function finding(
  overrides: Partial<PackFlipFinding> & Pick<PackFlipFinding, "productId" | "kind">
): PackFlipFinding {
  return {
    title: "",
    url: "",
    date: "2026-09-14",
    neighborDate: "2026-09-13",
    factor: 100,
    from: { stock: 10000, price: 1 },
    ...overrides,
  };
}

describe("formatPerfectPackFlipReport", () => {
  it("formats zero counts for applied empty review", () => {
    const msg = formatPerfectPackFlipReport({
      konkName: "perfect",
      apply: true,
      dates: ["2026-09-13", "2026-09-14", "2026-09-15"],
      patched: [],
      priceOnly: [],
      ambiguous: [],
    });
    expect(msg).toContain("📊 Perfect pack-flip — applied");
    expect(msg).toContain(
      "perfect 2026-09-13…2026-09-15: patched 0, price-only 0, ambiguous 0"
    );
    expect(msg).not.toContain("patched:");
  });

  it("renders no-dates when the range is empty", () => {
    const msg = formatPerfectPackFlipReport({
      konkName: "perfect",
      apply: true,
      dates: [],
      patched: [],
      priceOnly: [],
      ambiguous: [],
    });
    expect(msg).toContain("perfect no-dates: patched 0");
  });

  it("lists patched and price-only samples and truncates", () => {
    const patched = Array.from({ length: 16 }, (_, i) =>
      finding({
        productId: `perfect-${i + 1}`,
        kind: "inverse",
        title: i === 0 ? "Balloon" : "",
        patched: { stock: 100, price: 100 },
      })
    );
    const msg = formatPerfectPackFlipReport({
      konkName: "perfect",
      apply: false,
      dates: ["2026-09-11", "2026-09-15"],
      patched,
      priceOnly: [
        finding({
          productId: "perfect-po",
          kind: "price-only",
          date: "2026-09-15",
          factor: 2,
        }),
      ],
      ambiguous: [
        finding({
          productId: "perfect-amb",
          kind: "ambiguous",
          date: "2026-09-14",
          factor: 4,
        }),
      ],
    });
    expect(msg).toContain("dry-run");
    expect(msg).toContain("patched 16, price-only 1, ambiguous 1");
    expect(msg).toContain("2026-09-14 perfect-1 ×100 Balloon");
    expect(msg).toContain("… +1");
    expect(msg).toContain("price-only:");
    expect(msg).toContain("2026-09-15 perfect-po ×2");
    expect(msg).toContain("ambiguous:");
    expect(msg).toContain("2026-09-14 perfect-amb ×4");
  });
});
