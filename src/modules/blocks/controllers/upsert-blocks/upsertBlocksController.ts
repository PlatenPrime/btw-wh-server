import { Request, Response } from "express";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { upsertBlocksSchema } from "./schemas/upsertBlocksSchema.js";
import { upsertBlocksUtil } from "./utils/upsertBlocksUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";

export const upsertBlocksController = async (req: Request, res: Response) => {
  try {
    const parseResult = upsertBlocksSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const payload = parseResult.data;
    const result = await upsertBlocksUtil({ blocks: payload });

    if (req.user?.id) {
      await createEventUtil({
        userId: req.user.id,
        department: "blocks",
        type: "other",
        description: `Масовий upsert блоків: додано ${result.bulkResult.upsertedCount}, оновлено ${result.bulkResult.modifiedCount} з ${payload.length} переданих`,
      });
    }

    res.status(200).json({
      message: "Blocks upsert completed",
      data: result,
    });
  } catch (error) {
    logModuleError("blocks", error, "upsertBlocksController error:");
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};


