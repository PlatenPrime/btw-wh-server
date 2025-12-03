import { IPos, Pos } from "../../../../poses/models/Pos.js";

/**
 * Получает позиции по артикулу и складу
 * @param artikul - Артикул для поиска
 * @param sklad - Склад для фильтрации (по умолчанию "pogrebi")
 * @returns Массив позиций с указанным артикулом и складом
 */
export const getPosesByArtikulAndSkladUtil = async (
  artikul: string,
  sklad: string = "pogrebi"
): Promise<IPos[]> => {
  const poses = await Pos.find({ artikul, sklad }).exec();
  return poses;
};

