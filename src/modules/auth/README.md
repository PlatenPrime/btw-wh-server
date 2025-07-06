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
- Use the returned JWT token for authenticated requests (if required by backend).
- Error messages may be in English or Ukrainian.
- For any error, check the `message` field in the response.

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
      // Save token, use for authenticated requests
    }
  });
```

---

For further details, refer to the controller source code or contact backend developers.
