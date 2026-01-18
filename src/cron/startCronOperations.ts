import { startDeficitCalculationCron } from "../modules/defs/cron/startDeficitCalculationCron.js";
import { startCollectionsBackupCron } from "./startCollectionsBackupCron.js";

export const startCronOperations = () => {
  startDeficitCalculationCron();
  startCollectionsBackupCron();
};  