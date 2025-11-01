import { hashPasswordUtil } from "../../../utils/hashPasswordUtil.js";
/**
 * Хеширует пароль если он передан в данных обновления
 *
 * @param updateData - Данные для обновления пользователя
 * @returns Данные для обновления с захешированным паролем (если был передан)
 *
 * @example
 * ```typescript
 * const updateData = hashPasswordIfProvidedUtil({ password: "newPassword", fullname: "New Name" });
 * ```
 */
export const hashPasswordIfProvidedUtil = (updateData) => {
    if (updateData.password) {
        return {
            ...updateData,
            password: hashPasswordUtil(updateData.password),
        };
    }
    return updateData;
};
