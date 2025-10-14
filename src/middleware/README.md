# Middleware для авторизации и проверки ролей

## Обзор

Этот модуль содержит middleware для проверки авторизации и прав доступа на основе ролей пользователей.

## Компоненты

### 1. `checkAuth` - Проверка авторизации

Middleware для проверки JWT токена и добавления данных пользователя в `req.user`.

**Использование:**

```typescript
import { checkAuth } from "./middleware/index.js";

router.get("/protected", checkAuth, (req, res) => {
  const userId = req.user?.id;
  const userRole = req.user?.role;
  res.json({ userId, userRole });
});
```

**Что делает:**

- Проверяет наличие заголовка `Authorization`
- Валидирует формат токена (`Bearer <token>`)
- Верифицирует JWT токен
- Добавляет данные пользователя в `req.user`

**Возможные ошибки:**

- `401 NO_TOKEN` - Токен отсутствует
- `401 INVALID_TOKEN_FORMAT` - Неверный формат
- `401 TOKEN_EXPIRED` - Токен истек
- `401 INVALID_TOKEN` - Невалидный токен
- `401 INVALID_TOKEN_PAYLOAD` - Неверный payload

---

### 2. `checkRoles` - Проверка прав доступа

Middleware для проверки, имеет ли пользователь необходимую роль.

**Важно:** Используется ПОСЛЕ `checkAuth`!

**Использование:**

```typescript
import { checkAuth, checkRoles } from "./middleware/index.js";
import { RoleType } from "../constants/roles.js";

// Доступ только для ADMIN и PRIME
router.delete(
  "/users/:id",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  deleteUser
);

// Доступ для всех авторизованных (USER, ADMIN, PRIME)
router.get("/profile", checkAuth, checkRoles([RoleType.USER]), getProfile);

// Доступ только для PRIME
router.post(
  "/critical",
  checkAuth,
  checkRoles([RoleType.PRIME]),
  criticalAction
);
```

**Что делает:**

- Проверяет наличие `req.user`
- Валидирует роль пользователя
- Проверяет соответствие роли требуемому уровню доступа

**Возможные ошибки:**

- `401 USER_DATA_MISSING` - Данные пользователя отсутствуют
- `403 INVALID_USER_ROLE` - Невалидная роль
- `403 INSUFFICIENT_PERMISSIONS` - Недостаточно прав

---

### 3. `checkOwnership` - Проверка владельца ресурса

Middleware для проверки, является ли пользователь владельцем ресурса.

**Использование:**

```typescript
import { checkAuth, checkOwnership } from "./middleware/index.js";
import { Ask } from "./models/Ask.js";

// Удалить можно только свой ask (или если ты ADMIN/PRIME)
router.delete(
  "/asks/:id",
  checkAuth,
  checkOwnership(async (req) => {
    const ask = await Ask.findById(req.params.id);
    return ask?.asker.toString();
  }),
  deleteAsk
);

// Редактировать можно только свой профиль (или если ты ADMIN/PRIME)
router.put(
  "/profile/:userId",
  checkAuth,
  checkOwnership(async (req) => {
    return req.params.userId;
  }),
  updateProfile
);
```

**Что делает:**

- Проверяет наличие `req.user`
- Автоматически разрешает доступ для PRIME и ADMIN
- Для USER проверяет, является ли он владельцем ресурса
- Вызывает переданную функцию для получения ID владельца

**Возможные ошибки:**

- `401 USER_DATA_MISSING` - Данные пользователя отсутствуют
- `404 RESOURCE_NOT_FOUND` - Ресурс не найден
- `403 NOT_RESOURCE_OWNER` - Пользователь не владелец

---

## Иерархия ролей

```
PRIME (3) > ADMIN (2) > USER (1)
```

При проверке `checkRoles([RoleType.ADMIN])`:

- ✅ PRIME - доступ разрешен (уровень выше)
- ✅ ADMIN - доступ разрешен (точное совпадение)
- ❌ USER - доступ запрещен (уровень ниже)

---

## Примеры использования в роутерах

### Базовый пример

```typescript
import { Router } from "express";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { RoleType } from "../../constants/roles.js";

const router = Router();

// Публичные роуты (без авторизации)
router.post("/login", login);
router.post("/register", register);

// Защищенные роуты

// Чтение - доступно всем авторизованным
router.get("/items", checkAuth, checkRoles([RoleType.USER]), getItems);

// Создание/изменение - только ADMIN и PRIME
router.post("/items", checkAuth, checkRoles([RoleType.ADMIN]), createItem);
router.put("/items/:id", checkAuth, checkRoles([RoleType.ADMIN]), updateItem);

// Удаление - только PRIME
router.delete(
  "/items/:id",
  checkAuth,
  checkRoles([RoleType.PRIME]),
  deleteItem
);

export default router;
```

### Пример с проверкой владельца

```typescript
import { Router } from "express";
import {
  checkAuth,
  checkOwnership,
  checkRoles,
} from "../../middleware/index.js";
import { RoleType } from "../../constants/roles.js";
import { Post } from "./models/Post.js";

const router = Router();

// Создать пост - любой авторизованный
router.post("/", checkAuth, checkRoles([RoleType.USER]), createPost);

// Редактировать - только владелец или ADMIN/PRIME
router.put(
  "/:id",
  checkAuth,
  checkOwnership(async (req) => {
    const post = await Post.findById(req.params.id);
    return post?.authorId.toString();
  }),
  updatePost
);

// Удалить - только владелец или ADMIN/PRIME
router.delete(
  "/:id",
  checkAuth,
  checkOwnership(async (req) => {
    const post = await Post.findById(req.params.id);
    return post?.authorId.toString();
  }),
  deletePost
);

export default router;
```

---

## Типы

```typescript
// Расширение Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

// Роли
enum RoleType {
  PRIME = "PRIME",
  ADMIN = "ADMIN",
  USER = "USER",
}
```

---

## Тестирование

```typescript
import request from "supertest";
import app from "./app";

describe("Auth Middleware", () => {
  it("should reject request without token", async () => {
    const response = await request(app).get("/api/protected").expect(401);

    expect(response.body.code).toBe("NO_TOKEN");
  });

  it("should accept request with valid token", async () => {
    const token = "valid_jwt_token";

    const response = await request(app)
      .get("/api/protected")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });
});

describe("Role Middleware", () => {
  it("should reject USER for ADMIN route", async () => {
    const userToken = "user_jwt_token";

    const response = await request(app)
      .delete("/api/users/123")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(403);

    expect(response.body.code).toBe("INSUFFICIENT_PERMISSIONS");
  });

  it("should allow ADMIN for ADMIN route", async () => {
    const adminToken = "admin_jwt_token";

    await request(app)
      .delete("/api/users/123")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
  });
});
```

---

## Best Practices

1. **Всегда используйте `checkAuth` перед `checkRoles`:**

   ```typescript
   ✅ router.get('/path', checkAuth, checkRoles([RoleType.USER]), handler);
   ❌ router.get('/path', checkRoles([RoleType.USER]), checkAuth, handler);
   ```

2. **Используйте минимально необходимые права:**

   ```typescript
   ✅ checkRoles([RoleType.USER])  // Все авторизованные
   ❌ checkRoles([RoleType.ADMIN]) // Только для чтения
   ```

3. **Для владельцев используйте `checkOwnership`:**

   ```typescript
   ✅ checkOwnership(async (req) => getOwnerId(req))
   ❌ checkRoles([RoleType.USER]) + ручная проверка в контроллере
   ```

4. **Обрабатывайте асинхронные ошибки в `checkOwnership`:**
   ```typescript
   checkOwnership(async (req) => {
     try {
       const resource = await Model.findById(req.params.id);
       return resource?.ownerId;
     } catch (error) {
       return undefined; // Вернет 404 RESOURCE_NOT_FOUND
     }
   });
   ```
