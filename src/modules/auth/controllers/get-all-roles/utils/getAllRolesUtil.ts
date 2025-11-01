import Role, { IRole } from "../../../models/Role.js";

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
export const getAllRolesUtil = async (): Promise<IRole[]> => {
  const roles = await Role.find();
  return roles;
};

