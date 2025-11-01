import User, { IUser } from "../../../models/User.js";

/**
 * Получает пользователя по ID
 *
 * @param id - ID пользователя
 * @returns Пользователь или null если не найден
 *
 * @example
 * ```typescript
 * const user = await getMeUtil(userId);
 * ```
 */
export const getMeUtil = async (id: string): Promise<IUser | null> => {
  const user = await User.findById(id);
  return user;
};

