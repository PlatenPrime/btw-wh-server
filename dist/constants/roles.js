/**
 * Перечисление типов ролей пользователей в системе
 */
export var RoleType;
(function (RoleType) {
    /** Суперпользователь с полным доступом ко всему функционалу */
    RoleType["PRIME"] = "PRIME";
    /** Администратор с правами создания и удаления сущностей */
    RoleType["ADMIN"] = "ADMIN";
    /** Обычный пользователь с ограниченными правами */
    RoleType["USER"] = "USER";
})(RoleType || (RoleType = {}));
/**
 * Иерархия ролей (от высшей к низшей)
 * Используется для проверки прав доступа
 */
export const ROLE_HIERARCHY = {
    [RoleType.PRIME]: 3,
    [RoleType.ADMIN]: 2,
    [RoleType.USER]: 1,
};
/**
 * Проверяет, имеет ли пользователь достаточный уровень доступа
 * @param userRole - роль пользователя
 * @param requiredRole - требуемая роль
 * @returns true если роль пользователя >= требуемой роли
 */
export const hasRoleAccess = (userRole, requiredRole) => {
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole];
    return userLevel >= requiredLevel;
};
/**
 * Проверяет, является ли строка валидной ролью
 */
export const isValidRole = (role) => {
    return Object.values(RoleType).includes(role);
};
