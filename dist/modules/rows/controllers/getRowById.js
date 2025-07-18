import { Pallet } from "../../pallets/models/Pallet.js";
import { Row } from "../models/Row.js";
export const getRowById = async (req, res) => {
    const { id } = req.params;
    try {
        const row = await Row.findById(id);
        if (!row) {
            res.status(404).json({ message: "Row not found" });
            return;
        }
        const pallets = await Pallet.find({ "rowData._id": row._id }).select("_id title");
        const palletsFormatted = pallets.map((p) => ({
            _id: p._id,
            title: p.title,
        }));
        res.status(200).json({
            _id: row._id,
            title: row.title,
            pallets: palletsFormatted,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    }
    catch (error) {
        console.log("Error fetching row:", error);
        res.status(500).json({ message: "Server error", error });
    }
};
