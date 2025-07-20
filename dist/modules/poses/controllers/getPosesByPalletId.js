import mongoose from "mongoose";
import { Pos } from "../models/Pos.js";
export const getPosesByPalletId = async (req, res) => {
    const { palletId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(palletId)) {
        res.status(400).json({ error: "Invalid pallet ID" });
        return;
    }
    try {
        const poses = await Pos.find({ "palletData._id": palletId }).sort({
            artikul: 1,
        });
        res.json(poses);
    }
    catch (error) {
        res
            .status(500)
            .json({ error: "Failed to fetch poses by pallet", details: error });
    }
};
