import bcrypt from "bcryptjs";

/**
 * Сравнивает пароль с хешем
 *
 * @param password - Пароль в открытом виде
 * @param hash - Хешированный пароль
 * @returns true если пароль совпадает, false в противном случае
 *
 * @example
 * ```typescript
 * const isValid = comparePasswordUtil("myPassword123", user.password);
 * ```
 */
export const comparePasswordUtil = (
  password: string,
  hash: string
): boolean => {
  return bcrypt.compareSync(password, hash);
};

