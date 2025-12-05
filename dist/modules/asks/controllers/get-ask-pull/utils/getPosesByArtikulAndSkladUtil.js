import { Pos } from "../../../../poses/models/Pos.js";
/**
 * Получает позиции по артикулу и складу с количеством больше 0
 * @param artikul - Артикул для поиска
 * @param sklad - Склад для фильтрации (по умолчанию "pogrebi")
 * @returns Массив позиций с указанным артикулом и складом, у которых quant > 0
 */
export const getPosesByArtikulAndSkladUtil = async (artikul, sklad = "pogrebi") => {
    const poses = await Pos.find({ artikul, sklad, quant: { $gt: 0 } }).exec();
    return poses;
};
