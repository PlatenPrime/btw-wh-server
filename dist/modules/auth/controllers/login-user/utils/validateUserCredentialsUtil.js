import User from "../../../models/User.js";
import { comparePasswordUtil } from "../../../utils/comparePasswordUtil.js";
/**
 * Проверяет учетные данные пользователя
 *
 * @param input - username и password
 * @returns Объект с пользователем и флагом валидности
 *
 * @example
 * ```typescript
 * const result = await validateUserCredentialsUtil({
 *   username: "testuser",
 *   password: "password123"
 * });
 * ```
 */
export const validateUserCredentialsUtil = async ({ username, password, }) => {
    const user = await User.findOne({ username });
    if (!user) {
        return { user: null, isValid: false };
    }
    const isValid = comparePasswordUtil(password, user.password);
    return { user, isValid };
};
