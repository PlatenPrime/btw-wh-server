import mongoose, { ClientSession } from "mongoose";
import User, { IUser } from "../../../models/User.js";

type UpdateUserInput = {
  userId: string;
  updateData: {
    password?: string;
    fullname?: string;
    role?: string;
    telegram?: string;
    photo?: string;
  };
  session: ClientSession;
};

/**
 * Обновляет пользователя в транзакции
 *
 * @param input - ID пользователя, данные для обновления и сессия транзакции
 * @returns Обновленный пользователь или null если не найден
 *
 * @example
 * ```typescript
 * const user = await updateUserUtil({
 *   userId,
 *   updateData: { fullname: "New Name" },
 *   session
 * });
 * ```
 */
export const updateUserUtil = async ({
  userId,
  updateData,
  session,
}: UpdateUserInput): Promise<IUser | null> => {
  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    session,
  });

  return user;
};

