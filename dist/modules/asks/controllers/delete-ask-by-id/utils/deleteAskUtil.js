import { Ask } from "../../../models/Ask.js";
export async function deleteAskUtil({ id, session, }) {
    // Проверяем существование заявки перед удалением
    const ask = await Ask.findById(id).session(session);
    if (!ask) {
        return null;
    }
    // Удаляем заявку
    await Ask.findByIdAndDelete(id).session(session);
    return ask;
}
