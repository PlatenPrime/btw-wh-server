import User, { IUser } from "../../../models/User.js";

/**
 * Получает пользователя по ID без поля password
 *
 * @param id - ID пользователя
 * @returns Пользователь без пароля или null если не найден
 *
 * @example
 * ```typescript
 * const user = await getUserByIdUtil(userId);
 * ```
 */
export const getUserByIdUtil = async (
  id: string
): Promise<Omit<IUser, "password"> | null> => {
  const user = await User.findById(id).select("-password");
  if (!user) {
    return null;
  }
  return user as Omit<IUser, "password">;
};

