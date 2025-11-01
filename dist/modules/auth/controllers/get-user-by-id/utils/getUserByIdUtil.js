import User from "../../../models/User.js";
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
export const getUserByIdUtil = async (id) => {
    const user = await User.findById(id).select("-password");
    if (!user) {
        return null;
    }
    return user;
};
