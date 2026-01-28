import { Types } from "mongoose";
import { Pallet } from "../../pallets/models/Pallet.js";
import { Pos } from "../../poses/models/Pos.js";
import { PalletGroup } from "../models/PalletGroup.js";

const PALLET_SECTOR_MULTIPLIER = 100;

type CalculatePalletsSectorsOptions = {
  groupIds?: Types.ObjectId[];
};

/**
 * Recalculates sectors for pallets based on pallet groups and order of pallets inside each group.
 * Formula: sector = groupOrder * PALLET_SECTOR_MULTIPLIER + palletIndex
 * where palletIndex starts from 1 inside group.pallets array.
 * Pallets not belonging to any group get sector = 0 and palgr unset.
 */
export const calculatePalletsSectorsUtil = async (
  options: CalculatePalletsSectorsOptions = {},
) => {
  const { groupIds } = options;

  const groupQuery = groupIds ? { _id: { $in: groupIds } } : {};

  const groups = await PalletGroup.find(groupQuery).sort({ order: 1 }).exec();

  const allPallets = await Pallet.find({}).exec();

  const palletUpdatesMap = new Map<string, number>();

  const palletOperations: Array<{
    updateOne: {
      filter: { _id: any };
      update: {
        $set?: {
          sector?: number;
          palgr?: { id: Types.ObjectId; title: string };
        };
        $unset?: { palgr?: "" };
      };
    };
  }> = [];

  const palletsInGroups = new Set<string>();

  for (const group of groups) {
    const groupOrder = group.order;

    group.pallets.forEach((palletId, index) => {
      const palletIndex = index + 1;
      const sector = groupOrder * PALLET_SECTOR_MULTIPLIER + palletIndex;

      const palletIdString = palletId.toString();
      palletsInGroups.add(palletIdString);

      palletUpdatesMap.set(palletIdString, sector);

      palletOperations.push({
        updateOne: {
          filter: { _id: palletId },
          update: {
            $set: {
              sector,
              palgr: {
                id: group._id,
                title: group.title,
              },
            },
          },
        },
      });
    });
  }

  if (!groupIds) {
    const palletsWithoutGroup = allPallets.filter(
      (pallet) => !palletsInGroups.has(pallet._id.toString()),
    );

    palletsWithoutGroup.forEach((pallet) => {
      const palletIdString = pallet._id.toString();

      palletUpdatesMap.set(palletIdString, 0);

      palletOperations.push({
        updateOne: {
          filter: { _id: pallet._id },
          update: {
            $set: { sector: 0 },
            $unset: { palgr: "" },
          },
        },
      });
    });
  }

  if (palletOperations.length > 0) {
    await Pallet.bulkWrite(palletOperations);
  }

  let updatedPositions = 0;

  if (palletUpdatesMap.size > 0) {
    const posOperations: Array<{
      updateMany: {
        filter: { pallet: any };
        update: { $set: { "palletData.sector": number } };
      };
    }> = [];

    for (const [palletIdString, sector] of palletUpdatesMap.entries()) {
      posOperations.push({
        updateMany: {
          filter: { pallet: palletIdString },
          update: {
            $set: {
              "palletData.sector": sector,
            },
          },
        },
      });
    }

    if (posOperations.length > 0) {
      const posBulkWriteResult = await Pos.bulkWrite(posOperations);

      updatedPositions =
        (posBulkWriteResult as unknown as { modifiedCount?: number })
          .modifiedCount ?? 0;
    }
  }

  return {
    updatedPallets: palletOperations.length,
    groupsProcessed: groups.length,
    updatedPositions,
  };
};
