import { Pallet } from "../../pallets/models/Pallet.js";
import { mapPalletToShortDto } from "../../pallets/utils/mapPalletToShortDto.js";
const PALLET_PROJECTION = "_id title sector poses isDef";
const normalizeObjectIdToString = (id) => typeof id === "string" ? id : id.toString();
export const getPalletsShortForGroup = async (group) => {
    if (!group.pallets.length) {
        return [];
    }
    const palletIds = group.pallets.map((id) => normalizeObjectIdToString(id));
    const pallets = await Pallet.find({
        _id: { $in: palletIds },
    })
        .select(PALLET_PROJECTION)
        .exec();
    const byId = new Map();
    pallets.forEach((pallet) => {
        const dto = mapPalletToShortDto(pallet);
        byId.set(dto.id, dto);
    });
    return palletIds
        .map((id) => byId.get(id))
        .filter((dto) => Boolean(dto));
};
export const getPalletsShortForGroups = async (groups) => {
    if (!groups.length) {
        return {};
    }
    const allPalletIds = groups.flatMap((group) => group.pallets.map((id) => normalizeObjectIdToString(id)));
    if (!allPalletIds.length) {
        return groups.reduce((acc, group) => {
            acc[group._id.toString()] = [];
            return acc;
        }, {});
    }
    const uniquePalletIds = Array.from(new Set(allPalletIds));
    const pallets = await Pallet.find({
        _id: { $in: uniquePalletIds },
    })
        .select(PALLET_PROJECTION)
        .exec();
    const byId = new Map();
    pallets.forEach((pallet) => {
        const dto = mapPalletToShortDto(pallet);
        byId.set(dto.id, dto);
    });
    const result = {};
    groups.forEach((group) => {
        const groupId = group._id.toString();
        const palletIds = group.pallets.map((id) => normalizeObjectIdToString(id));
        result[groupId] = palletIds
            .map((id) => byId.get(id))
            .filter((dto) => Boolean(dto));
    });
    return result;
};
