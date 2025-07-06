import { Art } from "../models/Art.js";
export const getAllArts = async (req, res) => {
    try {
        const { page = "1", limit = "10", search = "" } = req.query;
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const searchQuery = search ? {
            $or: [
                { artikul: { $regex: search, $options: "i" } },
                { nameukr: { $regex: search, $options: "i" } },
                { namerus: { $regex: search, $options: "i" } }
            ]
        } : {};
        const arts = await Art.find(searchQuery)
            .sort({ artikul: 1 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);
        const total = await Art.countDocuments(searchQuery);
        res.status(200).json({
            data: arts,
            total,
            page: pageNumber,
            totalPages: Math.ceil(total / limitNumber),
        });
    }
    catch (error) {
        console.error("Error fetching arts:", error);
        res.status(500).json({ message: "Server error" });
    }
};
