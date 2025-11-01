import Role from "../../../models/Role.js";
/**
 * Получает все роли
 *
 * @returns Массив всех ролей
 *
 * @example
 * ```typescript
 * const roles = await getAllRolesUtil();
 * ```
 */
export const getAllRolesUtil = async () => {
    const roles = await Role.find();
    return roles;
};
