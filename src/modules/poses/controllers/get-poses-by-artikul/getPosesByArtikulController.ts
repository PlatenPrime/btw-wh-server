import { Request, Response } from "express";
import { GetPosesByArtikulResponse } from "../../types/getPosesByArtikulResponse.js";
import { calculateWarehouseDataUtil } from "./utils/calculateWarehouseDataUtil.js";
import { getPosesByArtikulUtil } from "./utils/getPosesByArtikulUtil.js";
import { groupPosesByWarehouseUtil } from "./utils/groupPosesByWarehouseUtil.js";
import { sortPosesByPalletTitle } from "../../utils/sortPosesByPalletTitle.js";

export const getPosesByArtikulController = async (
  req: Request,
  res: Response
) => {
  try {
    const { artikul } = req.params;

    // 1. Валидация
    if (!artikul) {
      res.status(400).json({
        success: false,
        message: "Artikul parameter is required",
      });
      return;
    }

    // 2. Получаем позиции
    const poses = await getPosesByArtikulUtil(artikul);

    if (poses.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          total: 0,
          pogrebi: { poses: [], quant: 0, boxes: 0 },
          merezhi: { poses: [], quant: 0, boxes: 0 },
          totalQuant: 0,
          totalBoxes: 0,
        },
      });
      return;
    }

    // 3. Группируем по складам
    const { pogrebi: pogrebiPoses, merezhi: merezhiPoses } =
      groupPosesByWarehouseUtil(poses);

    // 4. Сортируем по palletTitle
    sortPosesByPalletTitle(pogrebiPoses);
    sortPosesByPalletTitle(merezhiPoses);

    // 5. Рассчитываем данные по складам
    const pogrebi = calculateWarehouseDataUtil(pogrebiPoses);
    const merezhi = calculateWarehouseDataUtil(merezhiPoses);

    // 6. Рассчитываем общие суммы
    const totalQuant = poses.reduce(
      (sum: number, pos) => sum + pos.quant,
      0
    );
    const totalBoxes = poses.reduce(
      (sum: number, pos) => sum + pos.boxes,
      0
    );

    const response: GetPosesByArtikulResponse = {
      total: poses.length,
      pogrebi,
      merezhi,
      totalQuant,
      totalBoxes,
    };

    // 7. HTTP ответ
    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    // 8. Обработка ошибок
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

