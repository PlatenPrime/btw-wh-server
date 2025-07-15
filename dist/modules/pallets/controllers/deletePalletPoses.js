import { Pallet } from "../models/Pallet.js";
export const deletePalletPoses = async (req, res) => {
    const { palletId, poses } = req.body;
    if (!palletId || !Array.isArray(poses) || poses.length === 0) {
        return res.status(400).json({ message: "palletId and poses are required" });
    }
    const session = await Pallet.startSession();
    try {
        await session.withTransaction(async () => {
            try {
                const pallet = await Pallet.findById(palletId).session(session);
                if (!pallet) {
                    return res.status(404).json({ message: "Pallet not found" });
                }
                pallet.poses = pallet.poses.filter((p) => !poses.includes(p.toString()));
                await pallet.save({ session });
                return res.status(200).json({
                    message: "Pallet content removed successfully",
                    removedPosesCount: poses.length,
                });
            }
            catch (err) {
                if (err.name === "ValidationError" || err.name === "CastError") {
                    return res.status(400).json({ message: err.message, error: err });
                }
                return res.status(500).json({ message: "Server error", error: err });
            }
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Server error", error });
    }
    finally {
        await session.endSession();
    }
};
