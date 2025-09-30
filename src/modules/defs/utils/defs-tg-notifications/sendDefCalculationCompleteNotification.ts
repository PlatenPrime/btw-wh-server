import { sendMessageToDefsChat } from "../../../../utils/telegram/sendMessageToDefsChat.js";
import { IDeficitCalculationResult } from "../../models/Defcalc.js";

export const sendDefCalculationCompleteNotification = async (
  result: IDeficitCalculationResult
): Promise<void> => {
  try {
    const totalDeficits = Object.keys(result).length;

    let message =
      `✅ Розрахунок дефіцитів завершено \n` +
      `📊 Результати: \n` +
      `• Знайдено дефіцитів: ${totalDeficits}\n`;
   

    if (totalDeficits === 0) {
      message += `🎉 Відмінно! 
        Дефіцитів не знайдено
        Всі артикули в нормі`;
    } else {
      // Формуємо список дефіцитних артикулів з difQuant
      const deficitList = Object.entries(result)
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

      message += `📋Список дефіцитів:
      ${deficitList}`;
    }

    await sendMessageToDefsChat(message);
  } catch (error) {
    console.error(
      "Failed to send completion notification to Defs Chat:",
      error
    );
    // Не викидаємо помилку, щоб не переривати основний процес
  }
};
