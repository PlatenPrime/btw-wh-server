import { Ask } from "../models/Ask.js";
export const deleteAskById = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ message: "ID is required" });
        return;
    }
    try {
        // Проверяем существование заявки перед удалением
        const ask = await Ask.findById(id);
        if (!ask) {
            res.status(404).json({ message: "Ask not found" });
            return;
        }
        // Удаляем заявку
        await Ask.findByIdAndDelete(id);
        res.status(200).json({
            message: "Ask deleted successfully",
            data: { id, artikul: ask.artikul },
        });
    }
    catch (error) {
        console.error("Error deleting ask by ID:", error);
        res.status(500).json({
            message: "Server error while deleting ask",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
