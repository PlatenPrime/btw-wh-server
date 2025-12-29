import { sendMessageToDefsChat } from "../../../../../../utils/telegram/sendMessageToDefsChat.js";
import {
  IDeficitCalculationResult,
  IDeficitItem,
} from "../../../../models/Def.js";

// Функция для разбивки массива на чанки
const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// Функция для разделения дефицитов на критичные и лимитированные
const separateDeficitsByStatus = (
  deficits: IDeficitCalculationResult
): {
  critical: [string, IDeficitItem][];
  limited: [string, IDeficitItem][];
} => {
  const critical: [string, IDeficitItem][] = [];
  const limited: [string, IDeficitItem][] = [];

  Object.entries(deficits).forEach(([artikul, data]) => {
    if (data.status === "critical") {
      critical.push([artikul, data]);
    } else if (data.status === "limited") {
      limited.push([artikul, data]);
    }
  });

  return { critical, limited };
};

// Функция для создания сообщения с дефицитами (упрощенный формат)
const createDeficitMessage = (
  deficits: [string, IDeficitItem][],
  startIndex: number,
  totalDeficits: number,
  category: "critical" | "limited"
): string => {
  const endIndex = startIndex + deficits.length - 1;
  const rangeText = `${startIndex + 1}-${endIndex + 1} з ${totalDeficits}`;
  const categoryIcon = category === "critical" ? "🔴" : "🟡";
  const categoryName =
    category === "critical" ? "Критичні дефіцити" : "Дефіцити в ліміті";

  const deficitList = deficits
    .map(([artikul, data]) => {
      const difQuant = data.difQuant || 0;
      return `${artikul}: ${difQuant}`;
    })
    .join("\n");

  return `${categoryIcon} ${categoryName} (${rangeText}):
${deficitList}`;
};

export const sendDefCalculationCompleteNotification = async (
  result: IDeficitCalculationResult
): Promise<void> => {
  try {
    const totalDeficits = Object.keys(result).length;

    // Разделяем дефициты на критичные и лимитированные
    const { critical, limited } = separateDeficitsByStatus(result);

    if (totalDeficits === 0) {
      await sendMessageToDefsChat(`🎉 Відмінно! 
Дефіцитів не знайдено
Всі артикули в нормі`);
    } else {
      // Отправляем лимитированные дефициты (если есть)
      if (limited.length > 0) {
        const limitedChunks = chunkArray(limited, 20);

        for (let i = 0; i < limitedChunks.length; i++) {
          const chunk = limitedChunks[i];
          const startIndex = i * 20;
          const message = createDeficitMessage(
            chunk,
            startIndex,
            limited.length,
            "limited"
          );

          await sendMessageToDefsChat(message);

          // Небольшая задержка между сообщениями (500мс)
          if (i < limitedChunks.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      }
      // Отправляем критичные дефициты (если есть)
      if (critical.length > 0) {
        const criticalChunks = chunkArray(critical, 20);

        for (let i = 0; i < criticalChunks.length; i++) {
          const chunk = criticalChunks[i];
          const startIndex = i * 20;
          const message = createDeficitMessage(
            chunk,
            startIndex,
            critical.length,
            "critical"
          );

          await sendMessageToDefsChat(message);

          // Небольшая задержка между сообщениями (500мс)
          if (i < criticalChunks.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      }

      // Отправляем summary-сообщение
      const summaryMessage =
        `✅ Розрахунок дефіцитів завершено\n` +
        `• Всього дефіцитів: ${totalDeficits}\n` +
        `• Критичних: ${critical.length}\n` +
        `• В ліміті: ${limited.length}`;

      await sendMessageToDefsChat(summaryMessage);
    }
  } catch (error) {
    console.error(
      "Failed to send completion notification to Defs Chat:",
      error
    );
    // Не викидаємо помилку, щоб не переривати основний процес
  }
};
