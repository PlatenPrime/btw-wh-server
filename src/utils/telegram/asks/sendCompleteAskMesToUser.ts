import { IAsk } from "../../../modules/asks/models/Ask.js";
import { sendMessageToTGUser } from "../sendMessageToTGUser.js";

export const sendCompleteAskMesToUser = async (ask: IAsk, solverName: string) => {




    if (ask.askerData?.telegram) {
        try {
            const message = `✅ Ваш запит виконано!

        📦 ${ask.artikul}
        📝 ${ask.nameukr || "—"}
        🔢 ${ask.quant ?? "—"}
        👤 Виконавець: ${solverName}`;

        await sendMessageToTGUser(message, ask.askerData.telegram);
        } catch (telegramError) {
            console.error(
                "Failed to send Telegram notification:",
                telegramError
            );
        }
        
    }
}