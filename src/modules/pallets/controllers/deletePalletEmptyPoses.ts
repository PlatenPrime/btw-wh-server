import { Request, Response } from "express";
import { Pos } from "../../poses/models/Pos.js";
import { Pallet } from "../models/Pallet.js";

/**
 * Controller to delete empty poses (quant = 0 and boxes = 0) from a specific pallet
 *
 * This controller removes empty poses from a specific pallet identified by ID.
 * It finds all poses belonging to the pallet where both quant and boxes are equal to 0,
 * removes them from the Pos collection, and updates the pallet to remove references
 * to the deleted poses.
 *
 * The operation is performed within a MongoDB transaction to ensure data consistency.
 *
 * @route DELETE /pallets/:id/empty-poses
 * @param req - Express request object with pallet ID in params
 * @param res - Express response object
 * @returns Promise<void>
 *
 * @example
 * // Request: DELETE /pallets/507f1f77bcf86cd799439011/empty-poses
 * // Response:
 * {
 *   "message": "Empty poses removed from pallet successfully",
 *   "deletedCount": 3,
 *   "affectedPoseIds": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
 * }
 */
export const deletePalletEmptyPoses = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Pallet ID is required" });
  }

  const session = await Pallet.startSession();

  try {
    await session.withTransaction(async () => {
      try {
        // Find the pallet first
        const pallet = await Pallet.findById(id).session(session);
        if (!pallet) {
          return res.status(404).json({ message: "Pallet not found" });
        }

        // Find empty poses belonging to this pallet
        const emptyPoses = await Pos.find({
          "palletData._id": id,
          quant: 0,
          boxes: 0,
        }).session(session);

        if (emptyPoses.length === 0) {
          return res.status(200).json({
            message: "No empty poses found in this pallet",
            deletedCount: 0,
          });
        }

        // Get IDs of empty poses for removal
        const emptyPoseIds = emptyPoses.map((pose) => pose._id);

        // Remove empty poses from database
        const deleteResult = await Pos.deleteMany({
          "palletData._id": id,
          quant: 0,
          boxes: 0,
        }).session(session);

        // Update the pallet to remove references to deleted poses
        pallet.poses = pallet.poses.filter(
          (poseId) =>
            !emptyPoseIds.some((deletedId: any) => deletedId.equals(poseId))
        );
        await pallet.save({ session });

        return res.status(200).json({
          message: "Empty poses removed from pallet successfully",
          deletedCount: deleteResult.deletedCount,
          affectedPoseIds: emptyPoseIds.map((id: any) => id.toString()),
        });
      } catch (err: any) {
        if (err.name === "ValidationError" || err.name === "CastError") {
          return res.status(400).json({
            message: err.message,
            error: err,
          });
        }
        return res.status(500).json({
          message: "Server error during pose deletion",
          error: err,
        });
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Server error",
      error,
    });
  } finally {
    await session.endSession();
  }
};
