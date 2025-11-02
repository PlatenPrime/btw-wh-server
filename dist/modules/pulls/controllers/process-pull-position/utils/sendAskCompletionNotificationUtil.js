import { getCompleteAskMesUtil } from "../../../../asks/controllers/complete-ask-by-id/utils/getCompleteAskMesUtil.js";
import { sendCompleteAskMesUtil } from "../../../../asks/controllers/complete-ask-by-id/utils/sendCompleteAskMesUtil.js";
/**
 * Sends completion notification to asker via Telegram
 *
 * @param ask - Completed ask
 * @param solverName - Name of the solver
 */
export const sendAskCompletionNotificationUtil = async (ask, solverName) => {
    if (!ask.askerData?.telegram) {
        return;
    }
    try {
        const message = getCompleteAskMesUtil({
            ask,
            solverName,
        });
        await sendCompleteAskMesUtil({
            message,
            telegramChatId: ask.askerData.telegram,
        });
    }
    catch (error) {
        console.error("Failed to send completion notification:", error);
        // Don't throw - notification failure shouldn't break the process
    }
};
