import { Pos } from "../../../models/Pos.js";
/**
 * Удаляет позицию и возвращает её данные (для удаления из паллета)
 */
export const deletePosUtil = async ({ posId, session, }) => {
    const pos = await Pos.findById(posId).session(session);
    if (!pos) {
        throw new Error("Position not found");
    }
    await Pos.findByIdAndDelete(posId).session(session);
    return pos;
};
