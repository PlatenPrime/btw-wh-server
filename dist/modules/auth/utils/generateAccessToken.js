import jwt from "jsonwebtoken";
/**
 * Генерирует JWT токен доступа для пользователя
 *
 * @param id - ID пользователя
 * @param role - роль пользователя (USER, ADMIN, PRIME)
 * @param expiresIn - время жизни токена (по умолчанию 24 часа)
 * @returns JWT токен
 *
 * @throws Error если JWT_SECRET не установлен в переменных окружения
 *
 * @example
 * ```typescript
 * const token = generateAccessToken(userId, "ADMIN", "7d"); // токен на 7 дней
 * const token = generateAccessToken(userId, "USER"); // токен на 24 часа
 * ```
 */
export const generateAccessToken = (id, role, expiresIn = "30d") => {
    const payload = { id, role };
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    return jwt.sign(payload, secret, { expiresIn });
};
