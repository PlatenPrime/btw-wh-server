import { sendMessageToDefsChat } from "../../../../utils/telegram/sendMessageToDefsChat.js";
export const sendDefCalculationCompleteNotification = async (result) => {
    try {
        const totalDeficits = Object.keys(result).length;
        let message = `✅ <b>Розрахунок дефіцитів завершено</b>\n\n` +
            `📊 <b>Результати:</b>\n` +
            `• Знайдено дефіцитів: <b>${totalDeficits}</b>\n` +
            `• Документ збережено в БД\n`;
        if (totalDeficits === 0) {
            message += `\n🎉 <b>Відмінно! 
        Дефіцитів не знайдено</b>\n
        Всі артикули в нормі`;
        }
        else {
            // Формуємо список дефіцитних артикулів з difQuant
            const deficitList = Object.entries(result)
                .map(([artikul, data]) => {
                const difQuant = data.difQuant || 0;
                const quant = data.quant || 0;
                const defLimit = data.defLimit || 0;
                const status = difQuant <= 0 ? "🔴" : "🟡";
                return `${status} <b>${artikul}</b>: ${difQuant} \n  
            └ Поточний залишок: ${quant}, \n  
            └ Ліміт дефіциту: ${defLimit}`;
            })
                .join("\n");
            message += `\n📋 <b>Список дефіцитів:</b>\n${deficitList}`;
        }
        await sendMessageToDefsChat(message);
    }
    catch (error) {
        console.error("Failed to send completion notification to Defs Chat:", error);
        // Не викидаємо помилку, щоб не переривати основний процес
    }
};
