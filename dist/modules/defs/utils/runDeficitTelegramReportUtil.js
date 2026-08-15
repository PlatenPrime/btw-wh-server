import { clearSharikProductRestsCache } from "../../browser/sharik/utils/product-rests/index.js";
import { calculateLivePogrebiDefsUtil } from "../controllers/get-latest-defs/utils/calculateLivePogrebiDefsUtil.js";
import { formatDeficitTelegramErrorMessage, formatDeficitTelegramMessages, } from "./formatDeficitTelegramMessages.js";
import { sendDeficitTelegramReport } from "./sendDeficitTelegramReport.js";
/**
 * Свежий live-расчёт дефицитов и рассылка в чат дефицитов. В Mongo не пишет.
 */
export async function runDeficitTelegramReportUtil() {
    clearSharikProductRestsCache();
    try {
        const liveDefs = await calculateLivePogrebiDefsUtil();
        await sendDeficitTelegramReport(formatDeficitTelegramMessages(liveDefs.result));
        return liveDefs;
    }
    catch (error) {
        await sendDeficitTelegramReport([
            formatDeficitTelegramErrorMessage(error),
        ]);
        throw error;
    }
}
