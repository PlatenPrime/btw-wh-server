import { IUser } from "../models/User.js";

/**
 * Исключает поле password из объекта пользователя
 *
 * @param user - Объект пользователя с паролем
 * @returns Объект пользователя без поля password
 *
 * @example
 * ```typescript
 * const userWithoutPassword = getUserWithoutPasswordUtil(user);
 * ```
 */
export const getUserWithoutPasswordUtil = (user: IUser): Omit<IUser, "password"> => {
  const { password, ...userWithoutPassword } = user.toObject();
  return userWithoutPassword as Omit<IUser, "password">;
};

