import { Request, Response } from "express";
import mongoose from "mongoose";
import { Types } from "mongoose";
import { Ask } from "../../../asks/models/Ask.js";
import User from "../../../auth/models/User.js";
import { Pos } from "../../../poses/models/Pos.js";
import { processPullPositionSchema } from "./processPullPositionSchema.js";
import { updatePosQuantUtil } from "./utils/updatePosQuantUtil.js";
import { addPullActionToAskUtil } from "./utils/addPullActionToAskUtil.js";
import { checkAskCompletionUtil } from "./utils/checkAskCompletionUtil.js";
import { completeAskFromPullUtil } from "./utils/completeAskFromPullUtil.js";
import { sendAskCompletionNotificationUtil } from "./utils/sendAskCompletionNotificationUtil.js";
import { getProcessedQuantFromActionsUtil } from "./utils/getProcessedQuantFromActionsUtil.js";

/**
 * Controller to process a pull position
 * PATCH /api/pulls/:palletId/positions/:posId
 *
 * Processes a position by removing goods and updating ask actions
 * Automatically completes ask if fully processed
 */
export const processPullPositionController = async (
  req: Request,
  res: Response
) => {
  const session = await mongoose.startSession();

  try {
    const { palletId, posId } = req.params;

    // Validate ObjectId formats
    if (
      !mongoose.Types.ObjectId.isValid(palletId) ||
      !mongoose.Types.ObjectId.isValid(posId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid pallet ID or position ID format",
      });
      return;
    }

    // Validate request body
    const parseResult = processPullPositionSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: parseResult.error.errors,
      });
      return;
    }

    const { askId, actualQuant, solverId } = parseResult.data;
    const askObjectId = new Types.ObjectId(askId);
    const solverObjectId = new Types.ObjectId(solverId);
    const palletObjectId = new Types.ObjectId(palletId);
    const posObjectId = new Types.ObjectId(posId);

    let position: any = null;
    let solver: any = null;
    let ask: any = null;
    let completedAsk: any = null;
    let askProgress: number = 0;
    let askFullyProcessed: boolean = false;

    await session.withTransaction(async () => {
      // 1. Find and validate position
      position = await Pos.findById(posObjectId).session(session);
      if (!position) {
        throw new Error("Position not found");
      }

      // Verify position belongs to the specified pallet
      if (position.palletData._id.toString() !== palletObjectId.toString()) {
        throw new Error("Position does not belong to the specified pallet");
      }

      // 2. Validate actual quantity with race condition protection
      // Re-read position to ensure we have latest data (protection against concurrent modifications)
      const currentPosition = await Pos.findById(posObjectId).session(session);
      if (!currentPosition) {
        throw new Error("Position not found during validation");
      }
      if (actualQuant > currentPosition.quant) {
        throw new Error("Неможливо зняти більше товару, ніж є на позиції");
      }
      
      // Use the most recent position data
      position = currentPosition;

      // 3. Find solver user
      solver = await User.findById(solverObjectId).session(session);
      if (!solver) {
        throw new Error("Solver user not found");
      }

      // 4. Find the ask associated with this position
      ask = await Ask.findById(askObjectId).session(session);

      if (!ask) {
        throw new Error("Ask not found");
      }

      // Validate that the ask is still active
      if (ask.status !== "new") {
        throw new Error("Ask is no longer active");
      }

      // Validate that the ask matches the position's artikul
      if (ask.artikul !== position.artikul) {
        throw new Error("Ask artikul does not match position artikul");
      }

      // 5. Update position quantity
      const newQuant = position.quant - actualQuant;

      // Validate that newQuant is not negative (additional safety check)
      if (newQuant < 0) {
        throw new Error("Неможливо зняти більше товару, ніж є на позиції");
      }

      // Always update position quantity, even if it becomes 0
      await updatePosQuantUtil(posObjectId, newQuant, session);

      // 6. Add action to ask
      await addPullActionToAskUtil(
        ask._id,
        solver.fullname,
        actualQuant,
        position.palletTitle,
        session
      );

      // 7. Re-read ask to get updated actions array after adding new action
      const updatedAsk = await Ask.findById(askObjectId).session(session);
      if (!updatedAsk) {
        throw new Error("Ask not found after update");
      }

      // 8. Check if ask is fully completed using updated actions
      askFullyProcessed = checkAskCompletionUtil(updatedAsk, actualQuant);

      // 9. Calculate progress for response using updated actions
      askProgress = getProcessedQuantFromActionsUtil(updatedAsk.actions);

      // 10. Validate that we haven't over-fulfilled the ask (edge case protection)
      if (updatedAsk.quant && updatedAsk.quant > 0 && askProgress > updatedAsk.quant) {
        // Log warning but allow - this can happen if quant was changed after pull calculation
        console.warn(
          `Ask ${ask._id} has been over-fulfilled: ${askProgress} > ${updatedAsk.quant}`
        );
      }

      // 11. Auto-complete ask if fully processed
      if (askFullyProcessed) {
        completedAsk = await completeAskFromPullUtil(
          solver,
          solverObjectId,
          updatedAsk,
          session
        );
      }

      // Update ask reference for use outside transaction
      ask = updatedAsk;
    });

    // 8. Send completion notification (outside transaction)
    if (askFullyProcessed && completedAsk) {
      await sendAskCompletionNotificationUtil(completedAsk, solver.fullname);
    }

    // 9. Calculate remaining asks in pull (for client)
    const remainingAsksInPull = await calculateRemainingAsksInPull(
      palletObjectId,
      askObjectId
    );

    // 10. Return success response
    const newQuant = position.quant - actualQuant;
    res.status(200).json({
      success: true,
      message: "Position processed successfully",
      data: {
        positionId: posObjectId,
        palletId: palletObjectId,
        actualQuant,
        remainingQuant: newQuant > 0 ? newQuant : 0,
        askProgress,
        askFullyProcessed,
        askRequestedQuant: ask.quant || null,
        remainingAsksInPull,
        solverName: solver.fullname,
      },
    });
    return;
  } catch (error) {
    console.error("Error processing pull position:", error);

    if (!res.headersSent) {
      const statusCode =
        error instanceof Error && error.message.includes("not found")
          ? 404
          : error instanceof Error && error.message.includes("Неможливо зняти")
          ? 422
          : 500;
      res.status(statusCode).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to process position",
        error: statusCode === 500 ? "Internal server error" : undefined,
      });
    }
  } finally {
    await session.endSession();
  }
};

/**
 * Helper function to calculate remaining asks in pull
 * Used for client progress tracking
 */
async function calculateRemainingAsksInPull(
  palletId: Types.ObjectId,
  currentAskId: Types.ObjectId
): Promise<number> {
  try {
    const { calculatePullByPalletIdUtil } = await import(
      "../../utils/calculatePullsUtil.js"
    );
    const pull = await calculatePullByPalletIdUtil(palletId);

    if (!pull) {
      return 0;
    }

    // Count unique asks, excluding the current one if it's completed
    const uniqueAskIds = new Set(
      pull.positions
        .filter((p) => p.askId.toString() !== currentAskId.toString())
        .map((p) => p.askId.toString())
    );

    return uniqueAskIds.size;
  } catch (error) {
    console.error("Error calculating remaining asks:", error);
    return 0;
  }
}
