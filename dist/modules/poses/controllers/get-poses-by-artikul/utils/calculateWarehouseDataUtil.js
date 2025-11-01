/**
 * Рассчитывает суммарные данные по складу (quant, boxes) из массива позиций
 */
export const calculateWarehouseDataUtil = (poses) => {
    const quant = poses.reduce((sum, pos) => sum + pos.quant, 0);
    const boxes = poses.reduce((sum, pos) => sum + pos.boxes, 0);
    return {
        poses,
        quant,
        boxes,
    };
};
