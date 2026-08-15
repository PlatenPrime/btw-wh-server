import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../modules/analog-slices/cron/startAnalogSlicesCron.js", () => ({
  startAnalogSlicesCron: vi.fn(),
}));
vi.mock("../../modules/btrade-slices/cron/startBtradeSlicesCron.js", () => ({
  startBtradeSlicesCron: vi.fn(),
}));
vi.mock("../../modules/sku-slices/cron/startSkuSlicesCron.js", () => ({
  startSkuSlicesCron: vi.fn(),
}));
vi.mock("../../modules/skugrs/cron/startFillSkugrSkusCron.js", () => ({
  startFillSkugrSkusCron: vi.fn(),
}));
vi.mock("../../modules/skus/cron/startSkuInvalidFlagCron.js", () => ({
  startSkuInvalidFlagCron: vi.fn(),
}));
vi.mock(
  "../../modules/slice-compensation/cron/startCompensatingSlicesCron.js",
  () => ({
    startCompensatingSlicesCron: vi.fn(),
  })
);
vi.mock("../startFillPosNameukrFromArtsCron.js", () => ({
  startFillPosNameukrFromArtsCron: vi.fn(),
}));
vi.mock("../../modules/grabo-skus/cron/startGraboSkuSyncCron.js", () => ({
  startGraboSkuSyncCron: vi.fn(),
}));
vi.mock("../../modules/defs/cron/startDeficitReportCron.js", () => ({
  startDeficitReportCron: vi.fn(),
}));

import { startAnalogSlicesCron } from "../../modules/analog-slices/cron/startAnalogSlicesCron.js";
import { startBtradeSlicesCron } from "../../modules/btrade-slices/cron/startBtradeSlicesCron.js";
import { startSkuSlicesCron } from "../../modules/sku-slices/cron/startSkuSlicesCron.js";
import { startFillSkugrSkusCron } from "../../modules/skugrs/cron/startFillSkugrSkusCron.js";
import { startSkuInvalidFlagCron } from "../../modules/skus/cron/startSkuInvalidFlagCron.js";
import { startCompensatingSlicesCron } from "../../modules/slice-compensation/cron/startCompensatingSlicesCron.js";
import { startFillPosNameukrFromArtsCron } from "../startFillPosNameukrFromArtsCron.js";
import { startGraboSkuSyncCron } from "../../modules/grabo-skus/cron/startGraboSkuSyncCron.js";
import { startDeficitReportCron } from "../../modules/defs/cron/startDeficitReportCron.js";
import { startCronOperations } from "../startCronOperations.js";

describe("startCronOperations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts all cron jobs", () => {
    startCronOperations();

    expect(startFillPosNameukrFromArtsCron).toHaveBeenCalledOnce();
    expect(startAnalogSlicesCron).toHaveBeenCalledOnce();
    expect(startBtradeSlicesCron).toHaveBeenCalledOnce();
    expect(startSkuSlicesCron).toHaveBeenCalledOnce();
    expect(startCompensatingSlicesCron).toHaveBeenCalledOnce();
    expect(startFillSkugrSkusCron).toHaveBeenCalledOnce();
    expect(startSkuInvalidFlagCron).toHaveBeenCalledOnce();
    expect(startGraboSkuSyncCron).toHaveBeenCalledOnce();
    expect(startDeficitReportCron).toHaveBeenCalledOnce();
  });
});
