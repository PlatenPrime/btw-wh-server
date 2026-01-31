import User from "../../../models/User.js";
/**
 * Проверяет, доступен ли username для обновления пользователя (не занят другим пользователем).
 *
 * @param userId - ID текущего пользователя (исключается из проверки)
 * @param username - Проверяемый username
 * @returns true если username свободен или принадлежит тому же пользователю
 *
 * @example
 * ```typescript
 * const available = await checkUsernameAvailableForUpdateUtil(userId, "newlogin");
 * ```
 */
export const checkUsernameAvailableForUpdateUtil = async (userId, username) => {
    const existing = await User.findOne({ username });
    if (!existing)
        return true;
    return existing._id.toString() === userId;
};
