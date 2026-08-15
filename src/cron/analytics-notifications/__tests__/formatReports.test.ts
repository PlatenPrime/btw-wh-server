import { describe, expect, it } from "vitest";
import {
  formatAnalogKonkSliceReport,
  formatAnalogSlicesExcludedReport,
  formatAnalogSlicesReport,
} from "../formatAnalogSlicesReport.js";
import {
  formatCronErrorReport,
  formatFillPosNameukrErrorReport,
  formatFillPosNameukrReport,
} from "../formatCronReports.js";
import { formatBtradeSliceReport } from "../formatBtradeSliceReport.js";
import { formatCompensatingSlicesReport } from "../formatCompensatingSlicesReport.js";
import { formatFillSkugrSkusReport } from "../formatFillSkugrSkusReport.js";
import { formatGraboSkuSyncReport } from "../formatGraboSkuSyncReport.js";
import {
  formatKonkSliceLine,
  formatKonkSliceReportLines,
} from "../formatKonkSliceStats.js";
import { formatSkuInvalidFlagReport } from "../formatSkuInvalidFlagReport.js";
import {
  formatSkuKonkSliceReport,
  formatSkuSlicesExcludedReport,
  formatSkuSlicesReport,
} from "../formatSkuSlicesReport.js";

describe("formatKonkSliceStats", () => {
  it("formats single competitor line", () => {
    expect(
      formatKonkSliceLine({
        konkName: "air",
        count: 12,
        errors: 1,
        invalid: 2,
        total: 15,
      })
    ).toBe("air: ✅12 / ❌1 / ⚠️2");
  });

  it("formats multiple competitors", () => {
    expect(
      formatKonkSliceReportLines([
        { konkName: "air", count: 1, errors: 0, invalid: 0, total: 1 },
        { konkName: "balun", count: 3, errors: 1, invalid: 2, total: 6 },
      ])
    ).toEqual(["air: ✅1 / ❌0 / ⚠️0", "balun: ✅3 / ❌1 / ⚠️2"]);
  });
});

describe("formatAnalogSlicesReport", () => {
  it("includes header and competitor lines", () => {
    const msg = formatAnalogSlicesReport([
      { konkName: "air", count: 5, errors: 0, invalid: 1, total: 6 },
    ]);

    expect(msg).toContain("Analog slices");
    expect(msg).toContain("air: ✅5 / ❌0 / ⚠️1");
  });

  it("includes excluded list when provided", () => {
    const msg = formatAnalogSlicesReport([], ["yumi"]);
    expect(msg).toContain("Пропущено: yumi");
  });
});

describe("formatAnalogKonkSliceReport", () => {
  it("formats single konk message", () => {
    expect(
      formatAnalogKonkSliceReport({
        konkName: "balun",
        count: 5,
        errors: 0,
        invalid: 1,
        total: 6,
      })
    ).toBe("📊 Analog slices — balun\nbalun: ✅5 / ❌0 / ⚠️1");
  });
});

describe("formatAnalogSlicesExcludedReport", () => {
  it("lists excluded", () => {
    expect(formatAnalogSlicesExcludedReport(["balun"])).toBe(
      "📊 Analog slices — пропущено: balun"
    );
  });
});

describe("formatSkuSlicesReport", () => {
  it("includes header and competitor lines", () => {
    const msg = formatSkuSlicesReport([
      { konkName: "sharik", count: 10, errors: 2, invalid: 1, total: 13 },
    ]);

    expect(msg).toContain("SKU slices");
    expect(msg).toContain("sharik: ✅10 / ❌2 / ⚠️1");
  });
});

describe("formatSkuKonkSliceReport", () => {
  it("formats single konk message", () => {
    expect(
      formatSkuKonkSliceReport({
        konkName: "air",
        count: 12,
        errors: 1,
        invalid: 2,
        total: 15,
      })
    ).toBe("📊 SKU slices — air\nair: ✅12 / ❌1 / ⚠️2");
  });
});

describe("formatSkuSlicesExcludedReport", () => {
  it("lists excluded", () => {
    expect(formatSkuSlicesExcludedReport(["yumi", "air"])).toBe(
      "📊 SKU slices — пропущено: yumi, air"
    );
  });
});

describe("formatBtradeSliceReport", () => {
  it("includes sharik stats", () => {
    const msg = formatBtradeSliceReport({
      count: 100,
      totalArtikuls: 110,
      missing: 10,
      fromProductRests: 90,
    });

    expect(msg).toContain("Btrade slice");
    expect(msg).toContain("✅100 / ⚠️10 з 110");
    expect(msg).toContain("product_rests: 90");
    expect(msg).not.toContain("search:");
  });
});

describe("formatCompensatingSlicesReport", () => {
  it("includes analog and sku stats", () => {
    const msg = formatCompensatingSlicesReport({
      sliceDateLabel: "2025-06-06",
      analog: { refetched: 5, updated: 3 },
      sku: { refetched: 8, updated: 4 },
    });

    expect(msg).toContain("Compensating slices");
    expect(msg).toContain("Analog: refetched=5, updated=3");
    expect(msg).toContain("SKU: refetched=8, updated=4");
  });
});

describe("formatFillSkugrSkusReport", () => {
  it("includes group counts", () => {
    const msg = formatFillSkugrSkusReport({
      successCount: 8,
      errorCount: 2,
      total: 10,
    });

    expect(msg).toContain("Skugr refill");
    expect(msg).toContain("✅8 / ❌2 / всього 10");
  });
});

describe("formatSkuInvalidFlagReport", () => {
  it("includes updated and konk counts", () => {
    const msg = formatSkuInvalidFlagReport({ updated: 15, konkCount: 4 });
    expect(msg).toContain("Sku invalid flag sync");
    expect(msg).toContain("Оновлено SKU: 15, конкурентів: 4");
  });
});

describe("formatGraboSkuSyncReport", () => {
  it("includes catalog stats", () => {
    const msg = formatGraboSkuSyncReport({
      categoryCount: 12,
      listed: 400,
      created: 10,
      updated: 390,
      skippedNoProductId: 1,
      errors: 2,
      markedOffSite: 5,
      catalogComplete: true,
    });
    expect(msg).toContain("Grabo SKU sync");
    expect(msg).toContain("listed: 400");
    expect(msg).toContain("Створено: 10, оновлено: 390");
    expect(msg).toContain("Off-site: 5");
    expect(msg).toContain("catalogComplete: yes");
  });

  it("marks catalogComplete no", () => {
    const msg = formatGraboSkuSyncReport({
      categoryCount: 12,
      listed: 10,
      created: 0,
      updated: 10,
      skippedNoProductId: 0,
      errors: 0,
      markedOffSite: 0,
      catalogComplete: false,
    });
    expect(msg).toContain("catalogComplete: no");
  });
});

describe("formatFillPosNameukrReport", () => {
  it("includes success stats", () => {
    const msg = formatFillPosNameukrReport({
      updatedCount: 50,
      skippedArtikulsCount: 3,
    });

    expect(msg).toContain("Fill Pos nameukr");
    expect(msg).toContain("Оновлено позицій: 50");
    expect(msg).toContain("Пропущено артикулів без nameukr: 3");
  });

  it("formats error report", () => {
    expect(formatFillPosNameukrErrorReport(new Error("DB fail"))).toContain(
      "DB fail"
    );
  });
});

describe("formatCronErrorReport", () => {
  it("formats cron error with name", () => {
    expect(formatCronErrorReport("Analog slices", "timeout")).toContain(
      "Analog slices — помилка"
    );
  });
});
