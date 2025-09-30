import { startDeficitCalculationCron } from "../modules/defs/cron/startDeficitCalculationCron.js";
export const startCronOperations = () => {
    startDeficitCalculationCron();
};
