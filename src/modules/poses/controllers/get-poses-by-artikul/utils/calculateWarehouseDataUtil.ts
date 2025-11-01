import { IPos } from "../../../models/Pos.js";
import { WarehouseData } from "../../../types/getPosesByArtikulResponse.js";

/**
 * Рассчитывает суммарные данные по складу (quant, boxes) из массива позиций
 */
export const calculateWarehouseDataUtil = (
  poses: IPos[]
): WarehouseData => {
  const quant = poses.reduce(
    (sum: number, pos: IPos) => sum + pos.quant,
    0
  );
  const boxes = poses.reduce(
    (sum: number, pos: IPos) => sum + pos.boxes,
    0
  );
  return {
    poses,
    quant,
    boxes,
  };
};

