import User from "../../../models/User.js";
/**
 * Получает всех пользователей без поля password
 *
 * @returns Массив пользователей без паролей
 *
 * @example
 * ```typescript
 * const users = await getAllUsersUtil();
 * ```
 */
export const getAllUsersUtil = async () => {
    const users = await User.find().select("-password");
    return users;
};
