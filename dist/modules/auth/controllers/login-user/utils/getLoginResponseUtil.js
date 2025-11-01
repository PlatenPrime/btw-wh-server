import { generateAccessToken } from "../../../utils/generateAccessToken.js";
import { getUserWithoutPasswordUtil } from "../../../utils/getUserWithoutPasswordUtil.js";
/**
 * Формирует ответ для успешного логина
 *
 * @param input - Объект пользователя
 * @returns Объект с пользователем (без пароля) и токеном
 *
 * @example
 * ```typescript
 * const response = getLoginResponseUtil({ user });
 * ```
 */
export const getLoginResponseUtil = ({ user, }) => {
    const userWithoutPassword = getUserWithoutPasswordUtil(user);
    const token = generateAccessToken(user._id.toString(), user.role || "USER");
    return {
        user: userWithoutPassword,
        token,
    };
};
