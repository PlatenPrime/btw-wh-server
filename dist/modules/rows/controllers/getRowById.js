import { Row } from "../models/Row.js";
export const getRowById = async (req, res) => {
    const { id } = req.params;
    try {
        const row = await Row.findById(id);
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
