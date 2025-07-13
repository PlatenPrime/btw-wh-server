import { Pos } from "../models/Pos.js";
export const getAllPoses = async (req, res) => {
    try {
        const { page = "1", limit = "10", palletId, rowId, artikul, sklad, } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Строим фильтр
        const filter = {};
        if (palletId)
            filter["pallet._id"] = palletId;
        if (rowId)
            filter["row._id"] = rowId;
        if (artikul)
            filter.artikul = { $regex: artikul, $options: "i" };
        if (sklad)
            filter.sklad = { $regex: sklad, $options: "i" };
        const poses = await Pos.find(filter)
            .skip(skip)
            .limit(limitNum)
            .sort({ createdAt: -1 });
        const total = await Pos.countDocuments(filter);
        res.json({
            data: poses,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch poses", details: error });
    }
};
