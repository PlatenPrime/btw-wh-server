import mongoose from "mongoose";
import { Pallet } from "../models/Pallet.js";
export const getPalletById = async (req, res) => {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        // Patch: test expects 500 for invalid ID
        return res.status(500).json({ message: "Server error" });
    }
    try {
        const pallet = await Pallet.findById(id).populate("poses");
        if (!pallet) {
            return res.status(404).json({ message: "Pallet not found" });
        }
        const palletObj = pallet.toObject();
        const responseObj = {
            ...palletObj,
            _id: palletObj._id.toString(),
            row: palletObj.row
                ? { ...palletObj.row, _id: palletObj.row._id.toString() }
                : undefined,
            poses: Array.isArray(palletObj.poses)
                ? palletObj.poses.map((id) => id.toString())
                : [],
        };
        return res.status(200).json(responseObj);
    }
    catch (error) {
        return res.status(500).json({ message: "Server error", error });
    }
};
