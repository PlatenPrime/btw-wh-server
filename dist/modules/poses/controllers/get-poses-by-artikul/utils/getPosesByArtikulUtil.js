import { Pos } from "../../../models/Pos.js";
/**
 * Получает все позиции по артикулу
 */
export const getPosesByArtikulUtil = async (artikul) => {
    const poses = await Pos.find({ artikul }).exec();
    return poses;
};
