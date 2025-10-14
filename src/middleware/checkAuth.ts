import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

/**
 * Интерфейс для payload JWT токена
 */
interface JWTPayload {
  id: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware для проверки авторизации пользователя
 *
 * Проверяет наличие и валидность JWT токена в заголовке Authorization.
 * При успешной проверке добавляет данные пользователя в req.user
 *
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 *
 * @example
 * ```typescript
 * router.get('/protected', checkAuth, (req, res) => {
 *   const userId = req.user?.id;
 *   const userRole = req.user?.role;
 *   // ... ваша логика
 * });
 * ```
 */
export const checkAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Извлекаем токен из заголовка Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        message: "Не авторизовано: отсутствует токен авторизации",
        code: "NO_TOKEN",
      });
      return;
    }

    // Токен должен быть в формате "Bearer <token>"
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      res.status(401).json({
        message: "Не авторизовано: неверный формат токена",
        code: "INVALID_TOKEN_FORMAT",
      });
      return;
    }

    const token = parts[1];

    // Проверяем наличие JWT_SECRET
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({
        message: "Ошибка сервера: не настроен JWT_SECRET",
        code: "JWT_SECRET_NOT_CONFIGURED",
      });
      return;
    }

    // Верифицируем токен
    const decoded = jwt.verify(token, secret) as JWTPayload;

    // Проверяем наличие обязательных полей
    if (!decoded.id || !decoded.role) {
      res.status(401).json({
        message: "Не авторизовано: невалидный токен",
        code: "INVALID_TOKEN_PAYLOAD",
      });
      return;
    }

    // Добавляем данные пользователя в request
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        message: "Не авторизовано: токен истек",
        code: "TOKEN_EXPIRED",
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        message: "Не авторизовано: невалидный токен",
        code: "INVALID_TOKEN",
      });
      return;
    }

    res.status(500).json({
      message: "Ошибка проверки авторизации",
      code: "AUTH_ERROR",
    });
  }
};
