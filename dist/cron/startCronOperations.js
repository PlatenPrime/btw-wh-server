import { startAnalogSlicesCron } from "../modules/analog-slices/cron/startAnalogSlicesCron.js";
import { startBtradeSlicesCron } from "../modules/btrade-slices/cron/startBtradeSlicesCron.js";
import { startDeficitCalculationCron } from "../modules/defs/cron/startDeficitCalculationCron.js";
import { startCollectionsBackupCron } from "./startCollectionsBackupCron.js";
import { startFillPosNameukrFromArtsCron } from "./startFillPosNameukrFromArtsCron.js";
export const startCronOperations = () => {
    startDeficitCalculationCron();
    startCollectionsBackupCron();
    startFillPosNameukrFromArtsCron();
    startAnalogSlicesCron();
    startBtradeSlicesCron();
};
