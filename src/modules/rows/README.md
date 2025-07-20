# Rows Module – API & Integration Guide

## Purpose

The Rows module manages warehouse rows, each containing multiple pallets. It provides a RESTful API for CRUD operations, with cascading deletes and robust error handling. This guide details all endpoints, controllers, routes, request/response schemas, and data models for seamless frontend integration.

---

## Data Model

### Row

```typescript
interface Row {
  _id: string; // MongoDB ObjectId
  title: string; // Unique row name
  pallets: string[]; // Array of Pallet ObjectIds
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}
```

### Example Row JSON

```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "title": "Row A",
  "pallets": ["64f8a1b2c3d4e5f6a7b8c9d1"],
  "createdAt": "2023-09-06T10:30:00.000Z",
  "updatedAt": "2023-09-06T10:30:00.000Z"
}
```

---

## API Endpoints & Controllers

| Method | Route                  | Controller    | Description                        |
| ------ | ---------------------- | ------------- | ---------------------------------- |
| GET    | /api/rows              | getAllRows    | List all rows                      |
| GET    | /api/rows/id/:id       | getRowById    | Get row by ObjectId                |
| GET    | /api/rows/title/:title | getRowByTitle | Get row by title                   |
| POST   | /api/rows              | createRow     | Create a new row                   |
| PUT    | /api/rows/:id          | updateRow     | Update row by ObjectId             |
| DELETE | /api/rows/:id          | deleteRow     | Delete row (cascade pallets/poses) |

---

## Endpoints in Detail

### 1. List All Rows

- **GET /api/rows**
- **Controller:** getAllRows
- **Response 200:** `Row[]` (sorted by title)
- **Response 404:** `{ message: "Rows not found" }`
- **Response 500:** `{ message: "Server error", error }`

#### Example

```json
[
  {
    "_id": "...",
    "title": "Row A",
    "pallets": ["..."],
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

---

### 2. Get Row by ID

- **GET /api/rows/id/:id**
- **Controller:** getRowById
- **Params:** `id` (string, required)
- **Response 200:** `Row`
- **Response 404:** `{ message: "Row not found" }`
- **Response 500:** `{ message: "Server error", error }`

---

### 3. Get Row by Title

- **GET /api/rows/title/:title**
- **Controller:** getRowByTitle
- **Params:** `title` (string, required)
- **Response 200:** `Row`
- **Response 404:** `{ message: "Row not found" }`
- **Response 500:** `{ message: "Server error", error }`

---

### 4. Create Row

- **POST /api/rows**
- **Controller:** createRow
- **Body:**
  ```json
  { "title": "New Row" }
  ```
- **Response 201:** `Row`
- **Response 400:** `{ message: "Title is required" }`
- **Response 409:** `{ message: "Row title must be unique" }`
- **Response 500:** `{ message: "Server error", error }`

---

### 5. Update Row

- **PUT /api/rows/:id**
- **Controller:** updateRow
- **Params:** `id` (string, required)
- **Body:**
  ```json
  { "title": "Updated Title", "pallets": ["..."] }
  ```
- **Response 200:** `Row`
- **Response 404:** `{ message: "Row not found" }`
- **Response 409:** `{ message: "Row title must be unique" }`
- **Response 500:** `{ message: "Server error", error }`

---

### 6. Delete Row (Cascading)

- **DELETE /api/rows/:id**
- **Controller:** deleteRow
- **Params:** `id` (string, required)
- **Response 200:** `{ message: "Row and related pallets and positions deleted" }`
- **Response 404:** `{ message: "Row not found" }`
- **Response 500:** `{ message: "Server error", error }`

---

## Controllers Overview

- **getAllRows:** Returns all rows, sorted by title.
- **getRowById:** Returns a row by its ObjectId.
- **getRowByTitle:** Returns a row by its unique title.
- **createRow:** Creates a new row (title must be unique).
- **updateRow:** Updates row title and/or pallets.
- **deleteRow:** Deletes a row and all related pallets and positions (cascading).

---

## Route Map

- `/api/rows` → getAllRows, createRow
- `/api/rows/id/:id` → getRowById
- `/api/rows/title/:title` → getRowByTitle
- `/api/rows/:id` → updateRow, deleteRow

---

## Request/Response Patterns

### Fetch All Rows

```typescript
const rows = await fetch("/api/rows").then((r) => r.json());
```

### Fetch Row by ID

```typescript
const row = await fetch(`/api/rows/id/${id}`).then((r) => r.json());
```

### Fetch Row by Title

```typescript
const row = await fetch(`/api/rows/title/${encodeURIComponent(title)}`).then(
  (r) => r.json()
);
```

### Create Row

```typescript
const newRow = await fetch("/api/rows", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title }),
}).then((r) => r.json());
```

### Update Row

```typescript
const updatedRow = await fetch(`/api/rows/${id}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title, pallets }),
}).then((r) => r.json());
```

### Delete Row

```typescript
const result = await fetch(`/api/rows/${id}`, { method: "DELETE" }).then((r) =>
  r.json()
);
```

---

## Error Handling

- All errors return JSON with a `message` field and, optionally, an `error` field for debugging.
- 404: Resource not found
- 409: Uniqueness violation
- 400: Bad request (e.g., missing title)
- 500: Internal server error

---

## Special Notes

- **Cascading Deletes:** Deleting a row removes all its pallets and their positions.
- **Title Uniqueness:** Row titles are unique. Creating/updating with a duplicate title returns 409.
- **Timestamps:** `createdAt` and `updatedAt` are ISO strings, auto-managed.
- **Relationships:** `pallets` is an array of Pallet ObjectIds. To fetch pallet details, query the pallets API.

---

## Related Modules

- **Pallets:** Rows reference pallets by ObjectId.
- **Positions:** Pallets reference positions. Deleting a row cascades to pallets and their positions.

---

## Frontend Integration Tips

- Use TanStack React Query for data fetching and cache invalidation.
- Always handle error responses and display user-friendly messages.
- Use optimistic updates for create/update/delete for best UX.
- Validate user input before sending requests (e.g., non-empty, unique title).
