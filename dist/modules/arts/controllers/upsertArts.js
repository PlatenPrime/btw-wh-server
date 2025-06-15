import Art from "../models/Art.js";
export const upsertArts = async (req, res, next) => {
    const arts = req.body;
    if (!Array.isArray(arts) || arts.length === 0) {
        res.status(400).json({ message: "Invalid or empty data" });
        return;
    }
    const operations = arts.map((art) => ({
        updateOne: {
            filter: { artikul: art.artikul },
            update: {
                $set: {
                    zone: art.zone,
                    namerus: art.namerus,
                    nameukr: art.nameukr,
                },
            },
            upsert: true,
        },
    }));
    try {
        const result = await Art.bulkWrite(operations);
        res.status(200).json({ message: "Upsert completed", result });
    }
    catch (error) {
        console.error("Upsert error:", error);
        res.status(500).json({ message: "Server error", error });
    }
};
