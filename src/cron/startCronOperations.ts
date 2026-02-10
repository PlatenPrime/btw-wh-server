import { startDeficitCalculationCron } from "../modules/defs/cron/startDeficitCalculationCron.js";
import { startCollectionsBackupCron } from "./startCollectionsBackupCron.js";
import { startFillPosNameukrFromArtsCron } from "./startFillPosNameukrFromArtsCron.js";

export const startCronOperations = () => {
  startDeficitCalculationCron();
  startCollectionsBackupCron();
  startFillPosNameukrFromArtsCron();
};  