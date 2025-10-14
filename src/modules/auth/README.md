# Auth Module API Documentation

This document describes the authentication and user management API endpoints for frontend integration.

---

## Base Path

```
/api/auth
```

---

## Endpoints

### 1. Get All Users

- **URL:** `/users`
- **Method:** `GET`
- **Response:**
  - `200 OK`: Array of [User](#user-object) objects
- **Example Response:**

```json
[
  {
    "_id": "...",
    "username": "johndoe",
    "fullname": "John Doe",
    "role": "ADMIN",
    "telegram": "@johndoe",
    "photo": "https://...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 2. Get User by ID

- **URL:** `/users/:id`
- **Method:** `GET`
- **Response:**
  - `200 OK`: `{ user: User }`
  - `404 Not Found`: `{ message: "User not found" }`
- **Example Response:**

```json
{
  "user": {
    "_id": "...",
    "username": "johndoe",
    "fullname": "John Doe",
    "role": "ADMIN",
    "telegram": "@johndoe",
    "photo": "https://...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3. Get Current User (Me)

- **URL:** `/me/:id`
- **Method:** `GET`
- **Response:**
  - `200 OK`: `{ user: User, token: string }`
  - `400 Bad Request`: `{ message: "User not found" }`
- **Example Response:**

```json
{
  "user": {
    /* see User object */
  },
  "token": "jwt-token-string"
}
```

---

### 4. Update User Info

- **URL:** `/users/:userId`
- **Method:** `PUT`
- **Body:**

```json
{
  "fullname": "New Name",
  "password": "newpassword", // optional
  "telegram": "@newtelegram", // optional
  "photo": "https://..." // optional
}
```

- **Response:**
  - `200 OK`: `{ user: User, token: string }`
  - `404 Not Found`: `{ message: "User not found" }`
  - `400 Bad Request`: `{ message: "Update error", error: any }`

---

### 5. Login

- **URL:** `/login`
- **Method:** `POST`
- **Body:**

```json
{
  "username": "johndoe",
  "password": "password123"
}
```

- **Response:**
  - `200 OK`: `{ user: User, token: string }`
  - `400 Bad Request`: `{ message: "User not found" | "Invalid password" | "Login error" }`

---

### 6. Register

- **URL:** `/register`
- **Method:** `POST`
- **Body:**

```json
{
  "username": "johndoe",
  "password": "password123",
  "fullname": "John Doe",
  "role": "ADMIN", // optional, default: USER
  "telegram": "@johndoe", // optional
  "photo": "https://..." // optional
}
```

- **Response:**
  - `201 Created`: `{ user: User }`
  - `409 Conflict`: `{ message: "User with this username already exists" }`
  - `500 Internal Server Error`: `{ message: "Registration error", error: any }`

---

### 7. Get All Roles

- **URL:** `/roles`
- **Method:** `GET`
- **Response:**
  - `200 OK`: Array of [Role](#role-object) objects
- **Example Response:**

```json
[
  { "value": "ADMIN", "name": "Administrator" },
  { "value": "USER", "name": "User" }
]
```

---

## Object Schemas

### User Object

```json
{
  "_id": "string",
  "username": "string",
  "fullname": "string",
  "role": "string",
  "telegram": "string", // optional
  "photo": "string", // optional (URL)
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

### Role Object

```json
{
  "value": "string",
  "name": "string" // optional
}
```

---

## Notes

- All endpoints return JSON.
- Passwords are never returned in responses.
- **JWT token required:** Most endpoints now require authentication via JWT token in `Authorization` header.
- Error messages may be in English or Ukrainian.
- For any error, check the `message` field in the response.

---

## 🔐 Authorization & Roles (New!)

### Authentication Required

Most endpoints now require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### User Roles & Permissions

The system has three role levels with hierarchical access:

| Role      | Level | Description                                              |
| --------- | ----- | -------------------------------------------------------- |
| **PRIME** | 3     | Full access to all functionality                         |
| **ADMIN** | 2     | Can create, update, and delete entities                  |
| **USER**  | 1     | Read access + limited create/delete (own resources only) |

### Endpoint Access Matrix

| Endpoint         | Method | USER | ADMIN | PRIME | Public |
| ---------------- | ------ | ---- | ----- | ----- | ------ |
| `/login`         | POST   | -    | -     | -     | ✅     |
| `/register`      | POST   | -    | -     | -     | ✅     |
| `/users`         | GET    | ❌   | ✅    | ✅    | ❌     |
| `/users/:id`     | GET    | ✅   | ✅    | ✅    | ❌     |
| `/me/:id`        | GET    | ✅   | ✅    | ✅    | ❌     |
| `/users/:userId` | PUT    | ❌   | ✅    | ✅    | ❌     |
| `/roles`         | GET    | ❌   | ✅    | ✅    | ❌     |

### Error Codes

#### Authentication Errors (401)

- `NO_TOKEN` - Authorization header missing
- `INVALID_TOKEN_FORMAT` - Token format is not "Bearer <token>"
- `TOKEN_EXPIRED` - JWT token has expired
- `INVALID_TOKEN` - Token signature invalid
- `INVALID_TOKEN_PAYLOAD` - Token missing required fields (id, role)

#### Authorization Errors (403)

- `INSUFFICIENT_PERMISSIONS` - User role lacks required permissions
- `INVALID_USER_ROLE` - User has an unrecognized role

### JWT Token Structure

```json
{
  "id": "user_id_string",
  "role": "USER|ADMIN|PRIME",
  "iat": 1705315800,
  "exp": 1705402200
}
```

- **Default expiration:** 24 hours
- Token must be included in all protected endpoints

---

## Example Usage

**Login:**

```js
fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "johndoe", password: "password123" }),
})
  .then((res) => res.json())
  .then((data) => {
    if (data.token) {
      // Save token for future requests
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    }
  });
```

**Making Authenticated Requests:**

```js
const token = localStorage.getItem("authToken");

fetch("/api/auth/users", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
})
  .then((res) => res.json())
  .then((data) => console.log(data))
  .catch((error) => {
    if (error.status === 401) {
      // Token expired or invalid - redirect to login
      window.location.href = "/login";
    }
  });
```

**Using Axios with Interceptors:**

```js
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Use the API
api.get("/auth/users").then((response) => console.log(response.data));
```

---

For further details, refer to:

- **Frontend Guide:** `FRONTEND_AUTH_GUIDE.md` (comprehensive frontend integration guide)
- **Middleware Documentation:** `src/middleware/README.md` (backend middleware usage)
- Controller source code or contact backend developers.
