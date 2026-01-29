import { ClientSession } from "mongoose";
import { PalletGroup } from "../../../models/PalletGroup.js";
import { ReorderPalletGroupsInput } from "../schemas/reorderPalletGroupsSchema.js";

type ReorderPalletGroupsUtilInput = {
  orders: ReorderPalletGroupsInput["orders"];
  session: ClientSession;
};

export const reorderPalletGroupsUtil = async ({
  orders,
  session,
}: ReorderPalletGroupsUtilInput): Promise<{ updatedCount: number }> => {
  let updatedCount = 0;

  for (const { id, order: newOrder } of orders) {
    const group = await PalletGroup.findById(id).session(session);

    if (!group) {
      throw new Error(`Pallet group not found: ${id}`);
    }

    if (group.order !== newOrder) {
      group.order = newOrder;
      await group.save({ session });
      updatedCount += 1;
    }
  }

  return { updatedCount };
};
