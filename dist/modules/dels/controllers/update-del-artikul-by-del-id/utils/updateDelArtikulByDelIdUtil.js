import { getSharikData } from "../../../../comps/utils/getSharikData.js";
import { Del } from "../../../models/Del.js";
/**
 * Обновляет значение указанного артикула в поставке данными с sharik.ua (getSharikData).
 * Если артикула нет в поставке — добавляет его. Если товар не найден на sharik — возвращает null.
 */
export const updateDelArtikulByDelIdUtil = async (input) => {
    const del = await Del.findById(input.delId);
    if (!del)
        return null;
    const sharikData = await getSharikData(input.artikul);
    if (!sharikData)
        return null;
    del.set(`artikuls.${input.artikul}`, {
        quantity: sharikData.quantity,
        nameukr: sharikData.nameukr ?? "",
    });
    await del.save();
    return del;
};
