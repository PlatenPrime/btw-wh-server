import bcrypt from "bcryptjs";

/**
 * Хеширует пароль с использованием bcrypt
 *
 * @param password - Пароль в открытом виде
 * @param saltRounds - Количество раундов соли (по умолчанию 7)
 * @returns Хешированный пароль
 *
 * @example
 * ```typescript
 * const hashedPassword = hashPasswordUtil("myPassword123");
 * ```
 */
export const hashPasswordUtil = (
  password: string,
  saltRounds: number = 7
): string => {
  return bcrypt.hashSync(password, saltRounds);
};

