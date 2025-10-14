/**
 * Перечисление типов ролей пользователей в системе
 */
export enum RoleType {
  /** Суперпользователь с полным доступом ко всему функционалу */
  PRIME = "PRIME",
  /** Администратор с правами создания и удаления сущностей */
  ADMIN = "ADMIN",
  /** Обычный пользователь с ограниченными правами */
  USER = "USER",
}

/**
 * Иерархия ролей (от высшей к низшей)
 * Используется для проверки прав доступа
 */
export const ROLE_HIERARCHY = {
  [RoleType.PRIME]: 3,
  [RoleType.ADMIN]: 2,
  [RoleType.USER]: 1,
} as const;

/**
 * Проверяет, имеет ли пользователь достаточный уровень доступа
 * @param userRole - роль пользователя
 * @param requiredRole - требуемая роль
 * @returns true если роль пользователя >= требуемой роли
 */
export const hasRoleAccess = (
  userRole: string,
  requiredRole: RoleType
): boolean => {
  const userLevel = ROLE_HIERARCHY[userRole as RoleType] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole];
  return userLevel >= requiredLevel;
};

/**
 * Проверяет, является ли строка валидной ролью
 */
export const isValidRole = (role: string): role is RoleType => {
  return Object.values(RoleType).includes(role as RoleType);
};
