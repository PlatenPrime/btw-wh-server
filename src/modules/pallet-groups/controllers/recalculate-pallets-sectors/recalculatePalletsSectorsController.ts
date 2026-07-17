import { Request, Response } from "express";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { calculatePalletsSectorsUtil } from "../../utils/calculatePalletsSectorsUtil.js";

export const recalculatePalletsSectorsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const result = await calculatePalletsSectorsUtil();

    if (req.user?.id) {
      await createEventUtil({
        userId: req.user.id,
        department: "pallet-groups",
        type: "other",
        description: `Перераховано сектори паллет: оновлено ${result.updatedPallets} паллет у ${result.groupsProcessed} групах, ${result.updatedPositions} позицій`,
      });
    }

    return res.status(200).json({
      message: "Pallets sectors recalculated successfully",
      data: {
        updatedPallets: result.updatedPallets,
        groupsProcessed: result.groupsProcessed,
        updatedPositions: result.updatedPositions,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to recalculate pallets sectors",
    });
  }
};
