import { Zone } from "../../zones/models/Zone.js";
import { Block } from "../models/Block.js";
import { Seg } from "../../segs/models/Seg.js";

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
  const zoneOperations: Array<{
    updateOne: {
      filter: { _id: any };
      update: { $set: { sector: number } };
    };
  }> = [];

  const segOperations: Array<{
    updateOne: {
      filter: { _id: any };
      update: { $set: { sector: number } };
    };
  }> = [];

  // 4. Рассчитать сектора для сегментов в блоках
  for (const block of blocks) {
    // Получить все сегменты этого блока, отсортированные по order
    const segs = await Seg.find({ block: block._id })
      .sort({ order: 1 })
      .exec();

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
        zoneOperations.push({
          updateOne: {
            filter: { _id: zoneId },
            update: { $set: { sector } },
          },
        });
      });
    }
  }

  // 5. Установить sector = 0 для всех зон без сегмента
  const zonesWithoutSeg = allZones.filter(
    (zone) => !zone.seg || !zone.seg.id
  );

  zonesWithoutSeg.forEach((zone) => {
    zoneOperations.push({
      updateOne: {
        filter: { _id: zone._id },
        update: { $set: { sector: 0 } },
      },
    });
  });

  // 6. Выполнить bulkWrite для обновления секторов сегментов
  if (segOperations.length > 0) {
    await Seg.bulkWrite(segOperations);
  }

  // 7. Выполнить bulkWrite для обновления секторов зон
  if (zoneOperations.length > 0) {
    await Zone.bulkWrite(zoneOperations);
  }

  return {
    updatedZones: zoneOperations.length,
    updatedSegs: segOperations.length,
    blocksProcessed: blocks.length,
  };
};

