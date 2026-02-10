import { Art } from "../../modules/arts/models/Art.js";
import { Pos } from "../../modules/poses/models/Pos.js";
const POS_EMPTY_NAMEUKR_FILTER = {
    $or: [
        { nameukr: { $in: [null, ""] } },
        { nameukr: { $exists: false } },
    ],
};
const BULK_WRITE_CHUNK_SIZE = 500;
/**
 * Заполняет поле nameukr у позиций (Pos), у которых оно отсутствует или пустое,
 * подтягивая значение из справочника артикулов (Art) по полю artikul.
 * Минимизирует запросы: 1 distinct (Pos), 1 find (Art), 1+ bulkWrite (Pos).
 *
 * @returns Статистика: количество обновлённых документов и артикулов без подходящего Art
 */
export const fillPosNameukrFromArtsUtil = async () => {
    const distinctArtikuls = await Pos.distinct("artikul", POS_EMPTY_NAMEUKR_FILTER);
    if (distinctArtikuls.length === 0) {
        return { updatedCount: 0, skippedArtikulsCount: 0 };
    }
    const arts = await Art.find({
        artikul: { $in: distinctArtikuls },
        nameukr: { $exists: true, $nin: [null, ""] },
    })
        .select("artikul nameukr")
        .lean()
        .exec();
    const artikulToNameukr = new Map();
    for (const art of arts) {
        if (art.nameukr?.trim()) {
            artikulToNameukr.set(art.artikul, art.nameukr.trim());
        }
    }
    if (artikulToNameukr.size === 0) {
        return {
            updatedCount: 0,
            skippedArtikulsCount: distinctArtikuls.length,
        };
    }
    const operations = [];
    for (const [artikul, nameukr] of artikulToNameukr) {
        operations.push({
            updateMany: {
                filter: {
                    artikul,
                    ...POS_EMPTY_NAMEUKR_FILTER,
                },
                update: { $set: { nameukr } },
            },
        });
    }
    let totalModified = 0;
    for (let i = 0; i < operations.length; i += BULK_WRITE_CHUNK_SIZE) {
        const chunk = operations.slice(i, i + BULK_WRITE_CHUNK_SIZE);
        const result = await Pos.bulkWrite(chunk);
        totalModified += result.modifiedCount;
    }
    const skippedArtikulsCount = distinctArtikuls.length - artikulToNameukr.size;
    return {
        updatedCount: totalModified,
        skippedArtikulsCount,
    };
};
