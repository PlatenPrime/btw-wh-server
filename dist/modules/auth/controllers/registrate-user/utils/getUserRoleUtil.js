import Role from "../../../models/Role.js";
/**
 * Получает роль по значению или возвращает дефолтную роль "USER"
 *
 * @param roleValue - Значение роли для поиска
 * @returns Значение роли (найденная или "USER" по умолчанию)
 *
 * @example
 * ```typescript
 * const role = await getUserRoleUtil("ADMIN");
 * ```
 */
export const getUserRoleUtil = async (roleValue) => {
    if (!roleValue) {
        return "USER";
    }
    const role = await Role.findOne({ value: roleValue });
    return role?.value || "USER";
};
