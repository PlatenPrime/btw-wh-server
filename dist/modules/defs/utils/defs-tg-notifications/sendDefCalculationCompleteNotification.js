import { sendMessageToDefsChat } from "../../../../utils/telegram/sendMessageToDefsChat.js";
// Функция для разбивки массива на чанки
const chunkArray = (array, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
};
// Функция для создания сообщения с дефицитами
const createDeficitMessage = (deficits, startIndex, totalDeficits) => {
    const endIndex = startIndex + deficits.length - 1;
    const rangeText = `${startIndex + 1}-${endIndex + 1} з ${totalDeficits}`;
    const deficitList = deficits
        .map(([artikul, data]) => {
        const difQuant = data.difQuant || 0;
        const quant = data.quant || 0;
        const defLimit = data.defLimit || 0;
        const status = difQuant <= 0 ? "🔴" : "🟡";
        return `${status} ${artikul} 
        └ Запаси: ${quant}  
        └ Ліміт дефіциту: ${defLimit}
        └ Вітрина: ${difQuant}
        `;
    })
        .join("\n");
    return `📋 Список дефіцитів (${rangeText}):
${deficitList}`;
};
export const sendDefCalculationCompleteNotification = async (result) => {
    try {
        const totalDeficits = Object.keys(result).length;
        // Отправляем заголовочное сообщение
        const headerMessage = `✅ Розрахунок дефіцитів завершено \n` +
            `📊 Результати: \n` +
            `• Знайдено дефіцитів: ${totalDeficits}\n`;
        await sendMessageToDefsChat(headerMessage);
        if (totalDeficits === 0) {
            await sendMessageToDefsChat(`🎉 Відмінно! 
        Дефіцитів не знайдено
        Всі артикули в нормі`);
        }
        else {
            // Разбиваем дефициты на кластеры по 10
            const deficitEntries = Object.entries(result);
            const chunks = chunkArray(deficitEntries, 10);
            // Отправляем каждый кластер отдельным сообщением
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const startIndex = i * 10;
                const message = createDeficitMessage(chunk, startIndex, totalDeficits);
                await sendMessageToDefsChat(message);
                // Небольшая задержка между сообщениями (500мс)
                if (i < chunks.length - 1) {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }
            }
        }
    }
    catch (error) {
        console.error("Failed to send completion notification to Defs Chat:", error);
        // Не викидаємо помилку, щоб не переривати основний процес
    }
};
