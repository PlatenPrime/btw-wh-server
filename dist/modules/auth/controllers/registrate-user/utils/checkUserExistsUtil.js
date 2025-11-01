import User from "../../../models/User.js";
/**
 * Проверяет существование пользователя по username
 *
 * @param username - Username для проверки
 * @returns true если пользователь существует, false в противном случае
 *
 * @example
 * ```typescript
 * const exists = await checkUserExistsUtil("testuser");
 * ```
 */
export const checkUserExistsUtil = async (username) => {
    const candidate = await User.findOne({ username });
    return !!candidate;
};
