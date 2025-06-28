import { Row } from "../models/Row.js";
export const getRowByTitle = async (req, res) => {
    const { title } = req.params;
    try {
        const row = await Row.findOne({ title: title });
        if (!row) {
            res.status(404).json({ message: "Row not found" });
            return;
        }
        res.status(200).json(row);
    }
    catch (error) {
        console.log("Error fetching row:", error);
        res.status(500).json({ message: "Server error", error });
    }
};
