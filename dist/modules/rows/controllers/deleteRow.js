import { Pallet } from "../../pallets/models/Pallet.js";
import { Pos } from "../../poses/models/Pos.js";
import { Row } from "../../rows/models/Row.js";
export const deleteRow = async (req, res) => {
    try {
        const row = await Row.findById(req.params.id);
        if (!row)
            return res.status(404).json({ message: "Row not found" });
        // Находим все паллеты, принадлежащие этому ряду
        const pallets = await Pallet.find({ "rowData._id": row._id });
        // Получаем все их ID
        const palletIds = pallets.map((p) => p._id);
        // Удаляем все позиции, связанные с этими паллетами
        await Pos.deleteMany({ "palletData._id": { $in: palletIds } });
        // Удаляем паллеты
        await Pallet.deleteMany({ "rowData._id": row._id });
        // Удаляем сам ряд
        await row.deleteOne();
        res.json({ message: "Row and related pallets and positions deleted" });
    }
    catch (error) {
        console.error("Error deleting row:", error);
        res.status(500).json({ message: "Server error", error });
    }
};
