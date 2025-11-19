import mongoose from "mongoose";
import { Block, IBlock } from "../../../models/Block.js";
import { Zone } from "../../../../zones/models/Zone.js";

type DeleteBlockByIdInput = {
  id: string;
};

export const deleteBlockByIdUtil = async ({
  id,
}: DeleteBlockByIdInput): Promise<IBlock | null> => {
  const objectId = new mongoose.Types.ObjectId(id);
  
  // Удалить блок
  const deletedBlock = await Block.findByIdAndDelete(objectId).exec();

  if (!deletedBlock) {
    return null;
  }

  // Обнулить block и order у всех связанных зон
  await Zone.updateMany(
    { "block.id": objectId },
    {
      $unset: {
        block: "",
        order: "",
      },
      $set: {
        sector: 0,
      },
    }
  );

  return deletedBlock;
};

