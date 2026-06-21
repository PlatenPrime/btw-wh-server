import { Request, Response } from "express";
import { checkAndCompleteAsksUtil } from "./utils/checkAndCompleteAsksUtil.js";
import { getAsksPullsUtil } from "./utils/getAsksPullsUtil.js";
import { logModuleError, logModuleInfo } from "../../../../logging/logModuleError.js";

export const getAsksPullsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { response, processingAsks } = await getAsksPullsUtil();

    // Отправляем ответ клиенту
    res.status(200).json({
      message: "Asks pulls retrieved successfully",
      data: response,
    });

    // После отправки ответа обрабатываем готовые asks в фоне
    // Используем setImmediate для неблокирующей асинхронной обработки
    setImmediate(async () => {
      try {
        const completedAskIds = await checkAndCompleteAsksUtil(processingAsks);
        if (completedAskIds.length > 0) {
          logModuleInfo("asks", "asks auto-completed in background", {
            count: completedAskIds.length,
            askIds: completedAskIds,
          });
        }
      } catch (error) {
        // Логируем ошибку, но не прерываем выполнение
        logModuleError("asks", error, "Error completing asks in background:");
      }
    });
  } catch (error) {
    logModuleError("asks", error, "Error fetching asks pulls:");
    res.status(500).json({
      message: "Server error while fetching asks pulls",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
