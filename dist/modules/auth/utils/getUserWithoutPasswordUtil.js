/**
 * Исключает поле password из объекта пользователя
 *
 * @param user - Объект пользователя с паролем
 * @returns Объект пользователя без поля password
 *
 * @example
 * ```typescript
 * const userWithoutPassword = getUserWithoutPasswordUtil(user);
 * ```
 */
export const getUserWithoutPasswordUtil = (user) => {
    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
};
