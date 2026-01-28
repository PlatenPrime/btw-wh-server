import type { Types } from "mongoose";
import { Pallet } from "../../pallets/models/Pallet.js";
import type { PalletShortDto } from "../../pallets/types/PalletShortDto.js";
import { mapPalletToShortDto } from "../../pallets/utils/mapPalletToShortDto.js";
import type { IPalletGroup } from "../models/PalletGroup.js";

const PALLET_PROJECTION = "_id title sector poses isDef";

const normalizeObjectIdToString = (id: Types.ObjectId | string): string =>
  typeof id === "string" ? id : id.toString();

export const getPalletsShortForGroup = async (
  group: Pick<IPalletGroup, "_id" | "pallets">,
): Promise<PalletShortDto[]> => {
  if (!group.pallets.length) {
    return [];
  }

  const palletIds = group.pallets.map((id) => normalizeObjectIdToString(id));

  const pallets = await Pallet.find({
    _id: { $in: palletIds },
  })
    .select(PALLET_PROJECTION)
    .exec();

  const byId = new Map<string, PalletShortDto>();
  pallets.forEach((pallet) => {
    const dto = mapPalletToShortDto(pallet);
    byId.set(dto.id, dto);
  });

  return palletIds
    .map((id) => byId.get(id))
    .filter((dto): dto is PalletShortDto => Boolean(dto));
};

export const getPalletsShortForGroups = async (
  groups: Array<Pick<IPalletGroup, "_id" | "pallets">>,
): Promise<Record<string, PalletShortDto[]>> => {
  if (!groups.length) {
    return {};
  }

  const allPalletIds = groups.flatMap((group) =>
    group.pallets.map((id) => normalizeObjectIdToString(id)),
  );

  if (!allPalletIds.length) {
    return groups.reduce<Record<string, PalletShortDto[]>>((acc, group) => {
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

  const byId = new Map<string, PalletShortDto>();
  pallets.forEach((pallet) => {
    const dto = mapPalletToShortDto(pallet);
    byId.set(dto.id, dto);
  });

  const result: Record<string, PalletShortDto[]> = {};

  groups.forEach((group) => {
    const groupId = group._id.toString();
    const palletIds = group.pallets.map((id) => normalizeObjectIdToString(id));

    result[groupId] = palletIds
      .map((id) => byId.get(id))
      .filter((dto): dto is PalletShortDto => Boolean(dto));
  });

  return result;
};
