import { generateAccessToken } from "../../../utils/generateAccessToken.js";
import { getUserWithoutPasswordUtil } from "../../../utils/getUserWithoutPasswordUtil.js";
/**
 * Формирует ответ для обновления пользователя с токеном
 *
 * @param input - Объект обновленного пользователя
 * @returns Объект с пользователем (без пароля) и токеном
 *
 * @example
 * ```typescript
 * const response = getUpdateUserResponseUtil({ user });
 * ```
 */
export const getUpdateUserResponseUtil = ({ user, }) => {
    const userWithoutPassword = getUserWithoutPasswordUtil(user);
    const token = generateAccessToken(user._id.toString(), user.role || "USER");
    return {
        user: userWithoutPassword,
        token,
    };
};
