import { Pallet } from "../../pallets/models/Pallet.js";
import { Row } from "../models/Row.js";
import { sortPalletsByTitle } from "../../pallets/utils/sortPalletsByTitle.js";
export const getRowByTitle = async (req, res) => {
    const { title } = req.params;
    try {
        const row = await Row.findOne({ title: title });
        if (!row) {
            res.status(404).json({ message: "Row not found" });
            return;
        }
        const pallets = await Pallet.find({ "rowData._id": row._id }).select("_id title sector poses");
        const palletsFormatted = pallets.map((p) => ({
            _id: p._id,
            title: p.title,
            sector: p.sector,
            isEmpty: p.poses.length === 0,
        }));
        const sortedPallets = sortPalletsByTitle(palletsFormatted);
        res.status(200).json({
            _id: row._id,
            title: row.title,
            pallets: sortedPallets,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    }
    catch (error) {
        console.log("Error fetching row:", error);
        res.status(500).json({ message: "Server error", error });
    }
};
