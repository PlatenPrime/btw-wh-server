import mongoose from "mongoose";
import { Pos } from "../models/Pos.js";
export const getPosById = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: "Invalid position ID" });
        return;
    }
    try {
        const pos = await Pos.findById(id);
        if (!pos) {
            res.status(404).json({ error: "Position not found" });
            return;
        }
        res.json(pos);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch position", details: error });
    }
};
