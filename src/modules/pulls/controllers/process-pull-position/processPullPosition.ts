import { Request, Response } from "express";
import mongoose from "mongoose";
import { getCurrentFormattedDateTime } from "../../../../utils/getCurrentFormattedDateTime.js";
import { sendCompleteAskMesToUser } from "../../../../utils/telegram/asks/sendCompleteAskMesToUser.js";
import { Ask } from "../../../asks/models/Ask.js";
import User from "../../../auth/models/User.js";
import { Pos } from "../../../poses/models/Pos.js";
import { processPullPositionSchema } from "./processPullPositionSchema.js";


export const processPullPosition = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const { palletId, posId } = req.params;

    // Validate ObjectId formats
    if (
      !mongoose.Types.ObjectId.isValid(palletId) ||
      !mongoose.Types.ObjectId.isValid(posId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pallet ID or position ID format",
      });
    }

    // Validate request body
    const parseResult = processPullPositionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: parseResult.error.errors,
      });
    }

    const { askId, actualQuant, solverId } = parseResult.data;
    const askObjectId = new mongoose.Types.ObjectId(askId);
    const solverObjectId = new mongoose.Types.ObjectId(solverId);
    const palletObjectId = new mongoose.Types.ObjectId(palletId);
    const posObjectId = new mongoose.Types.ObjectId(posId);

    await session.withTransaction(async () => {
      // 1. Find and validate position
      const position = await Pos.findById(posObjectId).session(session);
      if (!position) {
        throw new Error("Position not found");
      }

      // Verify position belongs to the specified pallet
      if (position.palletData._id.toString() !== palletObjectId.toString()) {
        throw new Error("Position does not belong to the specified pallet");
      }

      // 2. Validate actual quantity
      if (actualQuant > position.quant) {
        throw new Error("Неможливо зняти більше товару, ніж є на позиції");
      }

      // 3. Find solver user
      const solver = await User.findById(solverObjectId).session(session);
      if (!solver) {
        throw new Error("Solver user not found");
      }

      // 4. Find the ask associated with this position
      // Use the askId provided in the request to directly find the correct ask
      const ask = await Ask.findById(askObjectId).session(session);

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
      // Keep position with 0 quantity for warehouse history tracking
      await Pos.findByIdAndUpdate(
        posObjectId,
        { quant: newQuant },
        { session }
      );

      // 6. Add action to ask
      const time = getCurrentFormattedDateTime();
      const solverName = solver.fullname;
      const actionMessage = `${time} ${solverName}: знято ${actualQuant} шт. з паллети ${position.palletTitle}`;

      await Ask.findByIdAndUpdate(
        ask._id,
        { $push: { actions: actionMessage } },
        { session }
      );

      // 7. Check if ask is fully completed
      // This is a simplified check - in reality, you'd need to track total pulled quantity
      // across all positions for this ask
      const remainingQuant = (ask.quant || 0) - actualQuant;

      if (remainingQuant <= 0) {
        // Mark ask as completed
        const solverData = {
          _id: solver._id,
          fullname: solver.fullname,
          telegram: solver.telegram,
          photo: solver.photo,
        };

        const completionAction = `${time} ${solverName}: ВИКОНАВ запит`;

        await Ask.findByIdAndUpdate(
          ask._id,
          {
            $push: { actions: completionAction },
            $set: {
              status: "completed",
              solver: solverObjectId,
              solverData,
            },
          },
          { session }
        );

        // Send completion notification to asker

        await sendCompleteAskMesToUser(ask, solverName);
      }

      // 8. Return success response
      res.status(200).json({
        success: true,
        message: "Position processed successfully",
        data: {
          positionId: posObjectId,
          palletId: palletObjectId,
          actualQuant,
          remainingQuant: newQuant > 0 ? newQuant : 0,
          askCompleted: remainingQuant <= 0,
          solverName: solver.fullname,
        },
      });
    });
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
