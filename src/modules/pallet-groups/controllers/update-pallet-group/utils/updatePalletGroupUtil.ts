import { ClientSession } from "mongoose";
import { IPalletGroup, PalletGroup } from "../../../models/PalletGroup.js";

type UpdatePalletGroupUtilInput = {
  id: string;
  title?: string;
  order?: number;
  session: ClientSession;
};

export const updatePalletGroupUtil = async ({
  id,
  title,
  order,
  session,
}: UpdatePalletGroupUtilInput): Promise<IPalletGroup> => {
  const group = await PalletGroup.findById(id).session(session);

  if (!group) {
    throw new Error("Pallet group not found");
  }

  if (title !== undefined) {
    group.title = title;
  }

  if (order !== undefined && order !== group.order) {
    const allGroups = await PalletGroup.find({})
      .sort({ order: 1 })
      .session(session);

    const targetIndex = order - 1;
    if (targetIndex < 0 || targetIndex >= allGroups.length) {
      throw new Error("Invalid order value");
    }

    const currentIndex = allGroups.findIndex(
      (g) => g._id.toString() === group._id.toString()
    );
    if (currentIndex === -1) {
      throw new Error("Pallet group not found in ordering list");
    }

    allGroups.splice(currentIndex, 1);
    allGroups.splice(targetIndex, 0, group);

    for (let index = 0; index < allGroups.length; index += 1) {
      const g = allGroups[index];
      g.order = index + 1;
      await g.save({ session });
    }
  } else {
    await group.save({ session });
  }

  return group;
};

