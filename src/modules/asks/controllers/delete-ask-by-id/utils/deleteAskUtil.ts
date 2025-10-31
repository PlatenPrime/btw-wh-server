import mongoose, { ClientSession } from "mongoose";
import { Ask, IAsk } from "../../../models/Ask.js";

interface DeleteAskUtilInput {
  id: string;
  session: ClientSession;
}

export async function deleteAskUtil({
  id,
  session,
}: DeleteAskUtilInput): Promise<IAsk | null> {
  // Проверяем существование заявки перед удалением
  const ask: IAsk | null = await Ask.findById(id).session(session);

  if (!ask) {
    return null;
  }

  // Удаляем заявку
  await Ask.findByIdAndDelete(id).session(session);

  return ask;
}

