import { Pallet } from "../../pallets/models/Pallet.js";
import { sortPalletsByTitle } from "../../pallets/utils/sortPalletsByTitle.js";
import { Row } from "../models/Row.js";
export const getRowById = async (req, res) => {
    const { id } = req.params;
    try {
        const row = await Row.findById(id);
        if (!row) {
            res.status(200).json({
                exists: false,
                message: "Row not found",
                data: null,
            });
            return;
        }
        const pallets = await Pallet.find({ "rowData._id": row._id }).select("_id title sector poses isDef");
        const palletsFormatted = pallets.map((p) => ({
            _id: p._id,
            title: p.title,
            sector: p.sector,
            isEmpty: p.poses.length === 0,
            isDef: p.isDef,
        }));
        const sortedPallets = sortPalletsByTitle(palletsFormatted);
        res.status(200).json({
            exists: true,
            message: "Row retrieved successfully",
            data: {
                _id: row._id,
                title: row.title,
                pallets: sortedPallets,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
            },
        });
    }
    catch (error) {
        console.log("Error fetching row:", error);
        res.status(500).json({ message: "Server error", error });
    }
};
