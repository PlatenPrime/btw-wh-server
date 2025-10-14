import { NextFunction, Request, Response } from "express";
import { hasRoleAccess, isValidRole, RoleType } from "../constants/roles.js";

/**
 * Middleware для проверки прав доступа пользователя на основе ролей
 *
 * Проверяет, имеет ли пользователь необходимую роль для доступа к ресурсу.
 * Использует иерархию ролей: PRIME > ADMIN > USER
 *
 * ВАЖНО: Этот middleware должен использоваться ПОСЛЕ checkAuth middleware,
 * так как требует наличия req.user
 *
 * @param requiredRoles - массив допустимых ролей для доступа
 * @returns Express middleware функция
 *
 * @example
 * ```typescript
 * // Доступ только для ADMIN и PRIME
 * router.delete('/users/:id', checkAuth, checkRoles([RoleType.ADMIN]), deleteUser);
 *
 * // Доступ для всех авторизованных пользователей
 * router.get('/profile', checkAuth, checkRoles([RoleType.USER]), getProfile);
 *
 * // Доступ только для PRIME
 * router.post('/critical', checkAuth, checkRoles([RoleType.PRIME]), criticalAction);
 * ```
 */
export const checkRoles = (requiredRoles: RoleType[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Проверяем наличие данных пользователя (должен быть установлен через checkAuth)
      if (!req.user) {
        res.status(401).json({
          message: "Не авторизовано: данные пользователя отсутствуют",
          code: "USER_DATA_MISSING",
        });
        return;
      }

      const { role } = req.user;

      // Проверяем, является ли роль валидной
      if (!isValidRole(role)) {
        res.status(403).json({
          message: "Доступ запрещен: невалидная роль пользователя",
          code: "INVALID_USER_ROLE",
        });
        return;
      }

      // Проверяем, входит ли роль пользователя в список разрешенных ролей
      const hasAccess = requiredRoles.some((requiredRole) =>
        hasRoleAccess(role, requiredRole)
      );

      if (!hasAccess) {
        res.status(403).json({
          message: "Доступ запрещен: недостаточно прав",
          code: "INSUFFICIENT_PERMISSIONS",
          requiredRoles,
          userRole: role,
        });
        return;
      }

      // Пользователь имеет необходимые права
      next();
    } catch (error) {
      res.status(500).json({
        message: "Ошибка проверки прав доступа",
        code: "ROLE_CHECK_ERROR",
      });
    }
  };
};

/**
 * Middleware для проверки, является ли пользователь владельцем ресурса
 *
 * Позволяет пользователю получить доступ к ресурсу, если:
 * 1. Пользователь имеет роль PRIME или ADMIN
 * 2. Пользователь является владельцем ресурса (userId совпадает)
 *
 * @param getUserIdFromResource - функция для извлечения userId из ресурса
 * @returns Express middleware функция
 *
 * @example
 * ```typescript
 * router.delete('/asks/:id',
 *   checkAuth,
 *   checkOwnership(async (req) => {
 *     const ask = await Ask.findById(req.params.id);
 *     return ask?.createdBy;
 *   }),
 *   deleteAsk
 * );
 * ```
 */
export const checkOwnership = (
  getUserIdFromResource: (req: Request) => Promise<string | undefined>
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "Не авторизовано: данные пользователя отсутствуют",
          code: "USER_DATA_MISSING",
        });
        return;
      }

      const { id: userId, role } = req.user;

      // PRIME и ADMIN имеют доступ ко всему
      if (role === RoleType.PRIME || role === RoleType.ADMIN) {
        next();
        return;
      }

      // Получаем ID владельца ресурса
      const resourceOwnerId = await getUserIdFromResource(req);

      if (!resourceOwnerId) {
        res.status(404).json({
          message: "Ресурс не найден",
          code: "RESOURCE_NOT_FOUND",
        });
        return;
      }

      // Проверяем, является ли пользователь владельцем
      if (userId !== resourceOwnerId) {
        res.status(403).json({
          message: "Доступ запрещен: вы не являетесь владельцем этого ресурса",
          code: "NOT_RESOURCE_OWNER",
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        message: "Ошибка проверки владельца ресурса",
        code: "OWNERSHIP_CHECK_ERROR",
      });
    }
  };
};
