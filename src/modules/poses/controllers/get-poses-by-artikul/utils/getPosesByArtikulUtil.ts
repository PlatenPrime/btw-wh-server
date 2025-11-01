import { IPos, Pos } from "../../../models/Pos.js";

/**
 * Получает все позиции по артикулу
 */
export const getPosesByArtikulUtil = async (
  artikul: string
): Promise<IPos[]> => {
  const poses = await Pos.find({ artikul }).exec();
  return poses;
};

