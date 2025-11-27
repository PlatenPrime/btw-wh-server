import { Seg } from "../../segs/models/Seg.js";
import { Zone } from "../../zones/models/Zone.js";
import { Block } from "../models/Block.js";
// Константа для разделения секторов между блоками
const SECTOR_MULTIPLIER = 1000;
/**
 * Рассчитывает и обновляет сектора всех зон на основе позиций блоков и сегментов внутри них
 * Формула: sector = blockOrder * SECTOR_MULTIPLIER + segOrder
 * Блоки и сегменты начинаются с order = 1
 * Все зоны в сегменте получают одинаковый сектор
 * Зоны без сегмента получают sector = 0
 */
export const calculateZonesSectorsUtil = async () => {
    // 1. Получить все блоки, отсортированные по order
    const blocks = await Block.find({}).sort({ order: 1 }).exec();
    // 2. Получить все зоны
    const allZones = await Zone.find({}).exec();
    // 3. Подготовить операции для bulkWrite зон и сегментов
    const zoneOperations = [];
    const segOperations = [];
    // 4. Получить все сегменты всех блоков одним запросом
    const blockIds = blocks.map((block) => block._id);
    const allSegs = await Seg.find({ block: { $in: blockIds } })
        .sort({ block: 1, order: 1 })
        .exec();
    // 5. Сгруппировать сегменты по блокам
    const segsByBlock = new Map();
    for (const seg of allSegs) {
        const blockId = seg.block.toString();
        if (!segsByBlock.has(blockId)) {
            segsByBlock.set(blockId, []);
        }
        segsByBlock.get(blockId).push(seg);
    }
    // 6. Рассчитать сектора для сегментов в блоках
    // Собираем Set всех зон, которые уже обработаны через сегменты
    const zonesInSegs = new Set();
    for (const block of blocks) {
        const segs = segsByBlock.get(block._id.toString()) || [];
        for (const seg of segs) {
            // Рассчитать сектор для сегмента
            // Формула: sector = blockOrder * 1000 + segOrder
            const sector = block.order * SECTOR_MULTIPLIER + seg.order;
            // Обновить сектор в сегменте
            segOperations.push({
                updateOne: {
                    filter: { _id: seg._id },
                    update: { $set: { sector } },
                },
            });
            // Обновить сектор для всех зон этого сегмента
            seg.zones.forEach((zoneId) => {
                zonesInSegs.add(zoneId.toString());
                zoneOperations.push({
                    updateOne: {
                        filter: { _id: zoneId },
                        update: { $set: { sector } },
                    },
                });
            });
        }
    }
    // 7. Установить sector = 0 для всех зон без сегмента
    // Исключаем зоны, которые уже обработаны через сегменты
    const zonesWithoutSeg = allZones.filter((zone) => (!zone.seg || !zone.seg.id) && !zonesInSegs.has(zone._id.toString()));
    zonesWithoutSeg.forEach((zone) => {
        zoneOperations.push({
            updateOne: {
                filter: { _id: zone._id },
                update: { $set: { sector: 0 } },
            },
        });
    });
    // 8. Выполнить bulkWrite для обновления секторов сегментов
    if (segOperations.length > 0) {
        await Seg.bulkWrite(segOperations);
    }
    // 9. Выполнить bulkWrite для обновления секторов зон
    if (zoneOperations.length > 0) {
        await Zone.bulkWrite(zoneOperations);
    }
    return {
        updatedZones: zoneOperations.length,
        updatedSegs: segOperations.length,
        blocksProcessed: blocks.length,
    };
};
