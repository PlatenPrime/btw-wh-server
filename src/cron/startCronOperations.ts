import { startAnalogSlicesCron } from "../modules/analog-slices/cron/startAnalogSlicesCron.js";
import { startBtradeSlicesCron } from "../modules/btrade-slices/cron/startBtradeSlicesCron.js";
import { startSkuSlicesCron } from "../modules/sku-slices/cron/startSkuSlicesCron.js";
import { startCompensatingSlicesCron } from "../modules/slice-compensation/cron/startCompensatingSlicesCron.js";
import { startDeficitCalculationCron } from "../modules/defs/cron/startDeficitCalculationCron.js";
import { startFillSkugrSkusCron } from "../modules/skugrs/cron/startFillSkugrSkusCron.js";
import { startSkuInvalidFlagCron } from "../modules/skus/cron/startSkuInvalidFlagCron.js";
import { startCollectionsBackupCron } from "./startCollectionsBackupCron.js";
import { startFillPosNameukrFromArtsCron } from "./startFillPosNameukrFromArtsCron.js";

export const startCronOperations = () => {
  startDeficitCalculationCron();
  startCollectionsBackupCron();
  startFillPosNameukrFromArtsCron();
  startAnalogSlicesCron();
  startBtradeSlicesCron();
  startSkuSlicesCron();
  startCompensatingSlicesCron();
  startFillSkugrSkusCron();
  startSkuInvalidFlagCron();
};  