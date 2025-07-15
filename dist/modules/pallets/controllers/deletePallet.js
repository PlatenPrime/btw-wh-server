import mongoose from "mongoose";
import { Pos } from "../../poses/models/Pos.js";
import { Row } from "../../rows/models/Row.js";
import { Pallet } from "../models/Pallet.js";
export const deletePallet = async (req, res) => {
    const { id } = req.params || {};
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid pallet ID" });
    }
    const session = await Pallet.startSession();
    try {
        await session.withTransaction(async () => {
            try {
                const pallet = await Pallet.findById(id).session(session);
                if (!pallet) {
                    return res.status(404).json({ message: "Pallet not found" });
                }
                if (pallet.poses && pallet.poses.length > 0) {
                    await Pos.deleteMany({ _id: { $in: pallet.poses } }).session(session);
                }
                const row = await Row.findById(pallet.row._id).session(session);
                if (row) {
                    row.pallets = row.pallets.filter((pid) => pid.toString() !== id);
                    await row.save({ session });
                }
                await Pallet.findByIdAndDelete(id).session(session);
                return res.status(200).json({ message: "Pallet deleted" });
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
