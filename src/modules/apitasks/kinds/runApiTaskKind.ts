import type { ApiTaskKind } from "../constants/apiTaskConstants.js";
import {
  failApiTaskRun,
  type ApiTaskKindRunner,
  type ApiTaskRunOptions,
  type ApiTaskRunResult,
} from "./apiTaskRunTypes.js";
import {
  runSkugrsFillSkus,
  runSkuSlicesSkugrRunToday,
  runSliceCompensationRun,
} from "./runners/runTier1ApiTaskKinds.js";
import {
  runArtsBtradeStockUpdateAll,
  runDelsArtikulsUpdateAll,
  runGraboSkusSync,
} from "./runners/runTier2ApiTaskKinds.js";
import {
  runDeleteArtsWithoutLatestMarker,
  runDeleteKonkInvalidSkus,
  runDeleteSkusNotInAnySkugr,
  runFixIncorrectSkuData,
  runPopulateMissingPosData,
  runRecalculatePalletsSectors,
  runRecalculateZonesSectors,
} from "./runners/runTier3ApiTaskKinds.js";

const RUNNERS: Record<ApiTaskKind, ApiTaskKindRunner> = {
  "sku-slices.skugr-run-today": runSkuSlicesSkugrRunToday,
  "slice-compensation.run": runSliceCompensationRun,
  "skugrs.fill-skus": runSkugrsFillSkus,
  "grabo-skus.sync": runGraboSkusSync,
  "arts.btrade-stock-update-all": runArtsBtradeStockUpdateAll,
  "dels.artikuls-update-all": runDelsArtikulsUpdateAll,
  "pallet-groups.recalculate-pallets-sectors": runRecalculatePalletsSectors,
  "blocks.recalculate-zones-sectors": runRecalculateZonesSectors,
  "poses.populate-missing-data": runPopulateMissingPosData,
  "skus.fix-incorrect-sku-data": runFixIncorrectSkuData,
  "skus.delete-konk-invalid": runDeleteKonkInvalidSkus,
  "skus.delete-not-in-any-skugr": runDeleteSkusNotInAnySkugr,
  "arts.delete-without-latest-marker": runDeleteArtsWithoutLatestMarker,
};

export async function runApiTaskKind(
  kind: ApiTaskKind,
  params: unknown,
  options?: ApiTaskRunOptions,
): Promise<ApiTaskRunResult> {
  const runner = RUNNERS[kind];
  if (!runner) {
    return failApiTaskRun(`Unknown api task kind: ${kind}`);
  }
  return runner(params, options);
}
