# 🔐 Руководство по авторизации и проверке ролей для фронтенда

## 📋 Содержание

- [Обзор](#обзор)
- [Роли пользователей](#роли-пользователей)
- [Процесс авторизации](#процесс-авторизации)
- [Работа с токенами](#работа-с-токенами)
- [Примеры запросов](#примеры-запросов)
- [Коды ошибок](#коды-ошибок)
- [Лучшие практики](#лучшие-практики)

---

## Обзор

Сервер использует JWT (JSON Web Token) для аутентификации и авторизации пользователей. Все защищенные эндпоинты требуют наличия валидного токена в заголовке `Authorization`.

### Основные компоненты:

- **Авторизация (checkAuth)**: Проверяет наличие и валидность JWT токена
- **Проверка ролей (checkRoles)**: Проверяет права доступа на основе роли пользователя
- **Проверка владельца (checkOwnership)**: Позволяет пользователям редактировать только свои ресурсы

---

## Роли пользователей

В системе существует три типа ролей с иерархией (от высшей к низшей):

### 1. **PRIME** (Суперпользователь)

- Полный доступ ко всему функционалу системы
- Может выполнять любые операции
- Не имеет ограничений

### 2. **ADMIN** (Администратор)

- Может создавать, редактировать и удалять сущности
- Может управлять asks других пользователей
- Доступ к административным функциям

### 3. **USER** (Обычный пользователь)

- Может просматривать данные
- Может создавать свои asks
- Может редактировать и удалять только свои asks
- Ограниченный функционал

---

## Процесс авторизации

### 1. Регистрация нового пользователя

**Endpoint:** `POST /api/auth/register`

**Request Body:**

```json
{
  "username": "john_doe",
  "password": "SecurePassword123!",
  "fullname": "John Doe",
  "telegram": "@johndoe",
  "photo": "https://example.com/photo.jpg",
  "role": "USER"
}
```

**Response (Success - 201):**

```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "fullname": "John Doe",
    "role": "USER",
    "telegram": "@johndoe",
    "photo": "https://example.com/photo.jpg",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Вход (Login)

**Endpoint:** `POST /api/auth/login`

**Request Body:**

```json
{
  "username": "john_doe",
  "password": "SecurePassword123!"
}
```

**Response (Success - 200):**

```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "fullname": "John Doe",
    "role": "USER",
    "telegram": "@johndoe",
    "photo": "https://example.com/photo.jpg"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzA1MzE1ODAwLCJleHAiOjE3MDU0MDIyMDB9.example_signature"
}
```

### 3. Сохранение токена

После успешного входа сохраните токен на клиенте:

```typescript
// LocalStorage
localStorage.setItem("authToken", response.token);
localStorage.setItem("user", JSON.stringify(response.user));

// SessionStorage (более безопасно для чувствительных данных)
sessionStorage.setItem("authToken", response.token);

// Cookie (с httpOnly для максимальной безопасности - требует настройки на бэкенде)
document.cookie = `authToken=${response.token}; Secure; SameSite=Strict`;
```

---

## Работа с токенами

### Структура JWT токена

JWT токен содержит следующие данные в payload:

```json
{
  "id": "507f1f77bcf86cd799439011", // ID пользователя
  "role": "USER", // Роль пользователя
  "iat": 1705315800, // Время создания (issued at)
  "exp": 1705402200 // Время истечения (expires)
}
```

### Время жизни токена

- **По умолчанию:** 24 часа
- Токен автоматически истекает через указанное время
- После истечения требуется повторная авторизация

### Добавление токена к запросам

**Все защищенные эндпоинты требуют заголовок:**

```
Authorization: Bearer <ваш_токен>
```

#### Примеры реализации:

**Axios:**

```typescript
import axios from "axios";

// Создание axios инстанса с токеном
const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

// Interceptor для автоматического добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Использование
const getUsers = async () => {
  const response = await api.get("/auth/users");
  return response.data;
};
```

**Fetch API:**

```typescript
const getUsers = async () => {
  const token = localStorage.getItem("authToken");

  const response = await fetch("http://localhost:3000/api/auth/users", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};
```

**React Query:**

```typescript
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const { data } = await axios.get("/api/auth/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return data;
    },
  });
};
```

---

## Примеры запросов

### Матрица доступа к эндпоинтам

| Модуль      | Метод  | Endpoint                   | USER         | ADMIN        | PRIME        |
| ----------- | ------ | -------------------------- | ------------ | ------------ | ------------ |
| **Auth**    |
|             | POST   | `/auth/login`              | ✅ Публичный | ✅ Публичный | ✅ Публичный |
|             | POST   | `/auth/register`           | ✅ Публичный | ✅ Публичный | ✅ Публичный |
|             | GET    | `/auth/users`              | ❌           | ✅           | ✅           |
|             | GET    | `/auth/users/:id`          | ✅           | ✅           | ✅           |
|             | GET    | `/auth/me/:id`             | ✅           | ✅           | ✅           |
|             | PUT    | `/auth/users/:userId`      | ❌           | ✅           | ✅           |
|             | GET    | `/auth/roles`              | ❌           | ✅           | ✅           |
| **Asks**    |
|             | POST   | `/asks`                    | ✅           | ✅           | ✅           |
|             | GET    | `/asks/by-date`            | ✅           | ✅           | ✅           |
|             | GET    | `/asks/:id`                | ✅           | ✅           | ✅           |
|             | PUT    | `/asks/:id`                | ✅ (свой)    | ✅           | ✅           |
|             | DELETE | `/asks/:id`                | ✅ (свой)    | ✅           | ✅           |
|             | PATCH  | `/asks/:id/complete`       | ❌           | ✅           | ✅           |
|             | PATCH  | `/asks/:id/reject`         | ❌           | ✅           | ✅           |
|             | PATCH  | `/asks/:id/actions`        | ❌           | ✅           | ✅           |
| **Arts**    |
|             | GET    | `/arts/*`                  | ✅           | ✅           | ✅           |
|             | PATCH  | `/arts/:id/limit`          | ❌           | ✅           | ✅           |
|             | POST   | `/arts/upsert`             | ❌           | ✅           | ✅           |
| **Pallets** |
|             | GET    | `/pallets/*`               | ✅           | ✅           | ✅           |
|             | POST   | `/pallets/*`               | ❌           | ✅           | ✅           |
|             | PUT    | `/pallets/:id`             | ❌           | ✅           | ✅           |
|             | DELETE | `/pallets/*`               | ❌           | ✅           | ✅           |
| **Poses**   |
|             | GET    | `/poses/*`                 | ✅           | ✅           | ✅           |
|             | POST   | `/poses/*`                 | ❌           | ✅           | ✅           |
|             | PUT    | `/poses/:id`               | ❌           | ✅           | ✅           |
|             | DELETE | `/poses/:id`               | ❌           | ✅           | ✅           |
| **Rows**    |
|             | GET    | `/rows/*`                  | ✅           | ✅           | ✅           |
|             | POST   | `/rows`                    | ❌           | ✅           | ✅           |
|             | PUT    | `/rows/:id`                | ❌           | ✅           | ✅           |
|             | DELETE | `/rows/:id`                | ❌           | ✅           | ✅           |
| **Defs**    |
|             | GET    | `/defs/latest`             | ✅           | ✅           | ✅           |
|             | GET    | `/defs/calculation-status` | ✅           | ✅           | ✅           |
|             | POST   | `/defs/calculate`          | ❌           | ✅           | ✅           |

---

## Коды ошибок

### Ошибки авторизации (401 Unauthorized)

| Код                     | Описание                               | Действие на фронтенде                       |
| ----------------------- | -------------------------------------- | ------------------------------------------- |
| `NO_TOKEN`              | Токен отсутствует в заголовке          | Перенаправить на страницу входа             |
| `INVALID_TOKEN_FORMAT`  | Неверный формат токена (не Bearer)     | Очистить токен, перенаправить на вход       |
| `TOKEN_EXPIRED`         | Токен истек                            | Показать уведомление, перенаправить на вход |
| `INVALID_TOKEN`         | Невалидный токен                       | Очистить токен, перенаправить на вход       |
| `INVALID_TOKEN_PAYLOAD` | В токене отсутствуют обязательные поля | Очистить токен, перенаправить на вход       |
| `USER_DATA_MISSING`     | Middleware checkAuth не был применен   | Ошибка сервера, повторить запрос            |

### Ошибки доступа (403 Forbidden)

| Код                        | Описание                                    | Действие на фронтенде                   |
| -------------------------- | ------------------------------------------- | --------------------------------------- |
| `INVALID_USER_ROLE`        | Невалидная роль пользователя                | Показать ошибку, связаться с поддержкой |
| `INSUFFICIENT_PERMISSIONS` | Недостаточно прав для выполнения операции   | Показать уведомление о недостатке прав  |
| `NOT_RESOURCE_OWNER`       | Пользователь не является владельцем ресурса | Показать уведомление "Доступ запрещен"  |

### Примеры обработки ошибок

**React + Axios:**

```typescript
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

// Interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    if (response?.status === 401) {
      const errorCode = response.data?.code;

      // Обработка разных кодов ошибок
      switch (errorCode) {
        case "NO_TOKEN":
        case "INVALID_TOKEN":
        case "INVALID_TOKEN_FORMAT":
        case "INVALID_TOKEN_PAYLOAD":
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          toast.error("Сессия недействительна. Пожалуйста, войдите снова.");
          window.location.href = "/login";
          break;

        case "TOKEN_EXPIRED":
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          toast.error("Сессия истекла. Пожалуйста, войдите снова.");
          window.location.href = "/login";
          break;

        default:
          toast.error("Ошибка авторизации");
      }
    } else if (response?.status === 403) {
      const errorCode = response.data?.code;

      switch (errorCode) {
        case "INSUFFICIENT_PERMISSIONS":
          toast.error("У вас недостаточно прав для выполнения этой операции");
          break;

        case "NOT_RESOURCE_OWNER":
          toast.error("Вы можете редактировать только свои ресурсы");
          break;

        default:
          toast.error("Доступ запрещен");
      }
    }

    return Promise.reject(error);
  }
);
```

**TypeScript типы для ошибок:**

```typescript
export type AuthErrorCode =
  | "NO_TOKEN"
  | "INVALID_TOKEN_FORMAT"
  | "TOKEN_EXPIRED"
  | "INVALID_TOKEN"
  | "INVALID_TOKEN_PAYLOAD"
  | "USER_DATA_MISSING"
  | "JWT_SECRET_NOT_CONFIGURED"
  | "AUTH_ERROR";

export type RoleErrorCode =
  | "INVALID_USER_ROLE"
  | "INSUFFICIENT_PERMISSIONS"
  | "NOT_RESOURCE_OWNER"
  | "ROLE_CHECK_ERROR"
  | "RESOURCE_NOT_FOUND"
  | "OWNERSHIP_CHECK_ERROR";

export interface AuthErrorResponse {
  message: string;
  code: AuthErrorCode | RoleErrorCode;
  requiredRoles?: string[];
  userRole?: string;
}
```

---

## Лучшие практики

### 1. Безопасное хранение токенов

**❌ Не рекомендуется:**

```typescript
// Хранение в глобальных переменных
window.authToken = token;

// Хранение в localStorage для очень чувствительных приложений
localStorage.setItem("authToken", token);
```

**✅ Рекомендуется:**

```typescript
// SessionStorage (токен удаляется при закрытии вкладки)
sessionStorage.setItem("authToken", token);

// HttpOnly Cookie (самый безопасный способ, но требует настройки сервера)
// Токен недоступен для JavaScript, защищен от XSS атак
```

### 2. Автоматическое обновление токена

```typescript
import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  id: string;
  role: string;
  exp: number;
}

const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const currentTime = Date.now() / 1000;

    // Проверяем, истечет ли токен в ближайшие 5 минут
    return decoded.exp < currentTime + 300;
  } catch {
    return true;
  }
};

const checkAndRefreshToken = async () => {
  const token = localStorage.getItem("authToken");

  if (!token || isTokenExpired(token)) {
    // Перенаправить на страницу входа или обновить токен
    window.location.href = "/login";
  }
};

// Проверяем токен каждые 5 минут
setInterval(checkAndRefreshToken, 5 * 60 * 1000);
```

### 3. Защита роутов на фронтенде

**React Router v6:**

```typescript
import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const token = localStorage.getItem("authToken");
  const userStr = localStorage.getItem("user");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (userStr) {
    const user = JSON.parse(userStr);
    const hasAccess = allowedRoles.includes(user.role);

    if (!hasAccess) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  return <Outlet />;
};

// Использование в роутах
<Route element={<ProtectedRoute allowedRoles={["ADMIN", "PRIME"]} />}>
  <Route path="/admin" element={<AdminPanel />} />
</Route>;
```

### 4. Условный рендеринг на основе ролей

```typescript
import { useAuth } from "./hooks/useAuth";

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const canDelete = user?.role === "ADMIN" || user?.role === "PRIME";
  const canEdit = canDelete || user?.role === "USER";

  return (
    <div>
      <h1>Dashboard</h1>

      {canEdit && <button>Редактировать</button>}
      {canDelete && <button>Удалить</button>}

      {user?.role === "PRIME" && (
        <div className="admin-panel">
          <h2>Панель администратора</h2>
        </div>
      )}
    </div>
  );
};
```

### 5. Custom Hook для авторизации

```typescript
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

interface User {
  _id: string;
  username: string;
  fullname: string;
  role: string;
  telegram?: string;
  photo?: string;
}

interface TokenPayload {
  id: string;
  role: string;
  exp: number;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        const decoded = jwtDecode<TokenPayload>(storedToken);
        const currentTime = Date.now() / 1000;

        if (decoded.exp > currentTime) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } else {
          logout();
        }
      } catch (error) {
        logout();
      }
    }

    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("authToken", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const hasRole = (requiredRole: string): boolean => {
    if (!user) return false;

    const roleHierarchy: Record<string, number> = {
      PRIME: 3,
      ADMIN: 2,
      USER: 1,
    };

    return (
      (roleHierarchy[user.role] || 0) >= (roleHierarchy[requiredRole] || 0)
    );
  };

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    login,
    logout,
    hasRole,
  };
};
```

### 6. Типизация для TypeScript

```typescript
// types/auth.ts
export enum RoleType {
  PRIME = "PRIME",
  ADMIN = "ADMIN",
  USER = "USER",
}

export interface User {
  _id: string;
  username: string;
  fullname: string;
  role: RoleType;
  telegram?: string;
  photo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  fullname: string;
  role?: RoleType;
  telegram?: string;
  photo?: string;
}

export interface RegisterResponse {
  user: Omit<User, "password">;
}
```

---

## Поддержка

При возникновении проблем с авторизацией:

1. Проверьте наличие токена в запросе
2. Проверьте формат токена (должен быть `Bearer <token>`)
3. Проверьте срок действия токена
4. Проверьте роль пользователя для доступа к эндпоинту
5. Проверьте логи сервера для получения детальной информации об ошибке

---

## Changelog

- **v1.0.0** (2025-01-15) - Первая версия системы авторизации
  - Добавлена проверка JWT токенов
  - Реализована система ролей (PRIME, ADMIN, USER)
  - Добавлена проверка владельца ресурса
  - Защита всех эндпоинтов API

---

**Дата последнего обновления:** 14 октября 2025 г.
