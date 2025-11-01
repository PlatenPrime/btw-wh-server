import { Pallet } from "../../../../pallets/models/Pallet.js";
import { Pos } from "../../../../poses/models/Pos.js";
import { Row } from "../../../models/Row.js";
export const deleteRowUtil = async ({ id, session, }) => {
    const row = await Row.findById(id).session(session);
    if (!row) {
        return false;
    }
    // Находим все паллеты, принадлежащие этому ряду
    const pallets = await Pallet.find({ "rowData._id": row._id }).session(session);
    // Получаем все их ID
    const palletIds = pallets.map((p) => p._id);
    // Удаляем все позиции, связанные с этими паллетами
    await Pos.deleteMany({ "palletData._id": { $in: palletIds } }).session(session);
    // Удаляем паллеты
    await Pallet.deleteMany({ "rowData._id": row._id }).session(session);
    // Удаляем сам ряд
    await row.deleteOne({ session });
    return true;
};
