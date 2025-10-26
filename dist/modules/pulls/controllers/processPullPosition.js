import mongoose from "mongoose";
import { z } from "zod";
import { getCurrentFormattedDateTime } from "../../../utils/getCurrentFormattedDateTime.js";
import { sendMessageToTGUser } from "../../../utils/telegram/sendMessageToTGUser.js";
import { Ask } from "../../asks/models/Ask.js";
import User from "../../auth/models/User.js";
import { Pallet } from "../../pallets/models/Pallet.js";
import { Pos } from "../../poses/models/Pos.js";
// Validation schema for process pull position request
const processPullPositionSchema = z.object({
    actualQuant: z.number().min(0, "Actual quantity must be non-negative"),
    solverId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid solver ID format",
    }),
});
/**
 * Controller to process a pull position (remove goods from a specific position)
 * PATCH /api/pulls/:palletId/positions/:posId
 *
 * Handles the actual pulling of goods from a position:
 * 1. Validates input data
 * 2. Updates position quantity (decreases quant, removes if 0)
 * 3. Updates pallet (removes position if necessary)
 * 4. Adds action to corresponding ask
 * 5. Checks if ask is fully completed → transitions to "completed" + sends notification
 * 6. Returns updated state
 */
export const processPullPosition = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { palletId, posId } = req.params;
        // Validate ObjectId formats
        if (!mongoose.Types.ObjectId.isValid(palletId) ||
            !mongoose.Types.ObjectId.isValid(posId)) {
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
        const { actualQuant, solverId } = parseResult.data;
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
            if (position.pallet.toString() !== palletId) {
                throw new Error("Position does not belong to the specified pallet");
            }
            // 2. Validate actual quantity
            if (actualQuant > position.quant) {
                throw new Error("Actual quantity cannot exceed available quantity");
            }
            // 3. Find solver user
            const solver = await User.findById(solverObjectId).session(session);
            if (!solver) {
                throw new Error("Solver user not found");
            }
            // 4. Find the ask associated with this position
            // We need to find which ask is requesting this position
            const asks = await Ask.find({
                status: "new",
                artikul: position.artikul,
            }).session(session);
            if (asks.length === 0) {
                throw new Error("No active asks found for this position");
            }
            // For simplicity, we'll process the first ask that matches
            // In a more complex scenario, you might need to track which ask corresponds to which position
            const ask = asks[0];
            // 5. Update position quantity
            const newQuant = position.quant - actualQuant;
            if (newQuant <= 0) {
                // Remove position if quantity becomes 0 or negative
                await Pos.findByIdAndDelete(posObjectId).session(session);
                // Remove position from pallet
                await Pallet.findByIdAndUpdate(palletObjectId, { $pull: { poses: posObjectId } }, { session });
            }
            else {
                // Update position quantity
                await Pos.findByIdAndUpdate(posObjectId, { quant: newQuant }, { session });
            }
            // 6. Add action to ask
            const time = getCurrentFormattedDateTime();
            const solverName = solver.fullname;
            const actionMessage = `${time} ${solverName}: знято ${actualQuant} шт. з паллети ${position.palletTitle}`;
            await Ask.findByIdAndUpdate(ask._id, { $push: { actions: actionMessage } }, { session });
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
                await Ask.findByIdAndUpdate(ask._id, {
                    $push: { actions: completionAction },
                    $set: {
                        status: "completed",
                        solver: solverObjectId,
                        solverData,
                    },
                }, { session });
                // Send completion notification to asker
                if (ask.askerData?.telegram) {
                    try {
                        const telegramMessage = `✅ Ваш запит виконано!

📦 ${ask.artikul}
📝 ${ask.nameukr || "—"}
🔢 ${ask.quant ?? "—"}
👤 Виконавець: ${solverName}`;
                        await sendMessageToTGUser(telegramMessage, ask.askerData.telegram);
                    }
                    catch (telegramError) {
                        console.error("Failed to send Telegram notification:", telegramError);
                        // Don't throw error - notification failure shouldn't break the transaction
                    }
                }
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
    }
    catch (error) {
        console.error("Error processing pull position:", error);
        if (!res.headersSent) {
            const statusCode = error instanceof Error && error.message.includes("not found")
                ? 404
                : 500;
            res.status(statusCode).json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to process position",
                error: statusCode === 500 ? "Internal server error" : undefined,
            });
        }
    }
    finally {
        await session.endSession();
    }
};
