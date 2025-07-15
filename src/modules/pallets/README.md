# Pallets Module API Documentation

## Overview

The Pallets module provides a RESTful API for managing warehouse pallets. Each pallet belongs to a specific row and can contain multiple positions. The module supports full CRUD operations with proper error handling and relationship management.

## Data Model

### Pallet Schema

```typescript
interface Pallet {
  _id: string; // MongoDB ObjectId
  title: string; // Required: Unique pallet identifier
  row: {
    _id: string; // Row ObjectId
    title: string; // Row title (cached)
  }; // Required: Row reference with cached title
  poses: string[]; // Array of Position ObjectIds (references)
  sector?: string; // Optional: Sector identifier
  createdAt: Date; // Auto-generated timestamp
  updatedAt: Date; // Auto-generated timestamp
}
```

## API Endpoints

### Base URL

```
/api/pallets
```

### 1. Get All Pallets

**Endpoint:** `GET /api/pallets`

**Description:** Retrieves all pallets with their associated data.

**Response:**

- **Success (200):** Array of pallet objects
- **Server Error (500):** `{ message: "Server error", error }`

**Example Response:**

```json
[
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "title": "Pallet A",
    "row": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "title": "Row A"
    },
    "poses": ["64f8a1b2c3d4e5f6a7b8c9d2", "64f8a1b2c3d4e5f6a7b8c9d3"],
    "sector": "Sector 1",
    "createdAt": "2023-09-06T10:30:00.000Z",
    "updatedAt": "2023-09-06T10:30:00.000Z"
  }
]
```

### 2. Get Pallet by ID

**Endpoint:** `GET /api/pallets/:id`

**Description:** Retrieves a specific pallet by its MongoDB ObjectId.

**Parameters:**

- `id` (string): MongoDB ObjectId of the pallet

**Response:**

- **Success (200):** Pallet object
- **Not Found (404):** `{ message: "Pallet not found" }`
- **Server Error (500):** `{ message: "Server error", error }`

**Example Request:**

```
GET /api/pallets/64f8a1b2c3d4e5f6a7b8c9d0
```

**Example Response:**

```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "title": "Pallet A",
  "row": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "title": "Row A"
  },
  "poses": ["64f8a1b2c3d4e5f6a7b8c9d2", "64f8a1b2c3d4e5f6a7b8c9d3"],
  "sector": "Sector 1",
  "createdAt": "2023-09-06T10:30:00.000Z",
  "updatedAt": "2023-09-06T10:30:00.000Z"
}
```

### 3. Get Pallets by Row ID

**Endpoint:** `GET /api/pallets/by-row/:rowId`

**Description:** Retrieves all pallets belonging to a specific row.

**Parameters:**

- `rowId` (string): MongoDB ObjectId of the row

**Response:**

- **Success (200):** Array of pallet objects for the specified row
- **Server Error (500):** `{ message: "Server error", error }`

**Example Request:**

```
GET /api/pallets/by-row/64f8a1b2c3d4e5f6a7b8c9d1
```

**Example Response:**

```json
[
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "title": "Pallet A",
    "row": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "title": "Row A"
    },
    "poses": ["64f8a1b2c3d4e5f6a7b8c9d2"],
    "sector": "Sector 1",
    "createdAt": "2023-09-06T10:30:00.000Z",
    "updatedAt": "2023-09-06T10:30:00.000Z"
  }
]
```

### 4. Create Pallet

**Endpoint:** `POST /api/pallets`

**Description:** Creates a new pallet with the specified data.

**Request Body:**

```typescript
{
  title: string; // Required: Unique pallet title
  rowId: string; // Required: Row ObjectId
  sector?: string; // Optional: Sector identifier
}
```

**Response:**

- **Success (201):** Created pallet object
- **Server Error (500):** `{ message: "Server error", error }`

**Example Request:**

```json
{
  "title": "New Pallet",
  "rowId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "sector": "Sector 2"
}
```

**Example Response:**

```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
  "title": "New Pallet",
  "row": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "title": "Row A"
  },
  "poses": [],
  "sector": "Sector 2",
  "createdAt": "2023-09-06T12:00:00.000Z",
  "updatedAt": "2023-09-06T12:00:00.000Z"
}
```

### 5. Update Pallet

**Endpoint:** `PUT /api/pallets/:id`

**Description:** Updates an existing pallet by ID.

**Parameters:**

- `id` (string): MongoDB ObjectId of the pallet to update

**Request Body:**

```typescript
{
  title?: string; // Optional: New title
  rowId?: string; // Optional: New row ObjectId
  sector?: string; // Optional: New sector
}
```

**Response:**

- **Success (200):** Updated pallet object
- **Not Found (404):** `{ message: "Pallet not found" }`
- **Server Error (500):** `{ message: "Server error", error }`

**Example Request:**

```json
PUT /api/pallets/64f8a1b2c3d4e5f6a7b8c9d0
{
  "title": "Updated Pallet Title",
  "sector": "Sector 3"
}
```

**Example Response:**

```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "title": "Updated Pallet Title",
  "row": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "title": "Row A"
  },
  "poses": ["64f8a1b2c3d4e5f6a7b8c9d2", "64f8a1b2c3d4e5f6a7b8c9d3"],
  "sector": "Sector 3",
  "createdAt": "2023-09-06T10:30:00.000Z",
  "updatedAt": "2023-09-06T12:30:00.000Z"
}
```

### 6. Delete Pallet

**Endpoint:** `DELETE /api/pallets/:id`

**Description:** Deletes a pallet and all associated positions.

**Parameters:**

- `id` (string): MongoDB ObjectId of the pallet to delete

**Response:**

- **Success (200):** `{ message: "Pallet and related positions deleted" }`
- **Not Found (404):** `{ message: "Pallet not found" }`
- **Server Error (500):** `{ message: "Server error", error }`

**Example Request:**

```
DELETE /api/pallets/64f8a1b2c3d4e5f6a7b8c9d0
```

**Example Response:**

```json
{
  "message": "Pallet and related positions deleted"
}
```

### 7. Delete Pallet Positions

**Endpoint:** `DELETE /api/pallets/:id/poses`

**Description:** Deletes all positions associated with a specific pallet.

**Parameters:**

- `id` (string): MongoDB ObjectId of the pallet

**Response:**

- **Success (200):** `{ message: "Pallet positions deleted" }`
- **Not Found (404):** `{ message: "Pallet not found" }`
- **Server Error (500):** `{ message: "Server error", error }`

**Example Request:**

```
DELETE /api/pallets/64f8a1b2c3d4e5f6a7b8c9d0/poses
```

**Example Response:**

```json
{
  "message": "Pallet positions deleted"
}
```

### 8. Move Pallet Positions

**Endpoint:** `POST /api/pallets/move-poses`

**Description:** Moves positions from one pallet to another.

**Request Body:**

```typescript
{
  fromPalletId: string; // Source pallet ObjectId
  toPalletId: string; // Destination pallet ObjectId
  positionIds: string[]; // Array of position ObjectIds to move
}
```

**Response:**

- **Success (200):** `{ message: "Positions moved successfully" }`
- **Server Error (500):** `{ message: "Server error", error }`

**Example Request:**

```json
{
  "fromPalletId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "toPalletId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "positionIds": ["64f8a1b2c3d4e5f6a7b8c9d2", "64f8a1b2c3d4e5f6a7b8c9d3"]
}
```

**Example Response:**

```json
{
  "message": "Positions moved successfully"
}
```

## Error Handling

All endpoints follow a consistent error handling pattern:

- **404 Not Found:** When the requested resource doesn't exist
- **500 Server Error:** When an internal server error occurs

Error responses include a `message` field with a human-readable description and may include an `error` field with technical details.

## Frontend Integration Examples

### Using Fetch API

```typescript
// Get all pallets
const getAllPallets = async () => {
  try {
    const response = await fetch("/api/pallets");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const pallets = await response.json();
    return pallets;
  } catch (error) {
    console.error("Error fetching pallets:", error);
    throw error;
  }
};

// Create a new pallet
const createPallet = async (palletData: {
  title: string;
  rowId: string;
  sector?: string;
}) => {
  try {
    const response = await fetch("/api/pallets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(palletData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const newPallet = await response.json();
    return newPallet;
  } catch (error) {
    console.error("Error creating pallet:", error);
    throw error;
  }
};

// Update a pallet
const updatePallet = async (id: string, updates: Partial<Pallet>) => {
  try {
    const response = await fetch(`/api/pallets/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const updatedPallet = await response.json();
    return updatedPallet;
  } catch (error) {
    console.error("Error updating pallet:", error);
    throw error;
  }
};

// Delete a pallet
const deletePallet = async (id: string) => {
  try {
    const response = await fetch(`/api/pallets/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error deleting pallet:", error);
    throw error;
  }
};
```

### Using React Query (TanStack Query)

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Query keys
const PALLET_KEYS = {
  all: ["pallets"] as const,
  lists: () => [...PALLET_KEYS.all, "list"] as const,
  list: (filters: string) => [...PALLET_KEYS.lists(), { filters }] as const,
  details: () => [...PALLET_KEYS.all, "detail"] as const,
  detail: (id: string) => [...PALLET_KEYS.details(), id] as const,
  byRow: (rowId: string) => [...PALLET_KEYS.all, "byRow", rowId] as const,
};

// Hooks
export const usePallets = () => {
  return useQuery({
    queryKey: PALLET_KEYS.lists(),
    queryFn: getAllPallets,
  });
};

export const usePallet = (id: string) => {
  return useQuery({
    queryKey: PALLET_KEYS.detail(id),
    queryFn: () => getPalletById(id),
    enabled: !!id,
  });
};

export const usePalletsByRow = (rowId: string) => {
  return useQuery({
    queryKey: PALLET_KEYS.byRow(rowId),
    queryFn: () => getPalletsByRowId(rowId),
    enabled: !!rowId,
  });
};

export const useCreatePallet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PALLET_KEYS.lists() });
    },
  });
};

export const useUpdatePallet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Pallet> }) =>
      updatePallet(id, updates),
    onSuccess: (updatedPallet) => {
      queryClient.invalidateQueries({ queryKey: PALLET_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: PALLET_KEYS.detail(updatedPallet._id),
      });
    },
  });
};

export const useDeletePallet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PALLET_KEYS.lists() });
    },
  });
};
```

## Important Notes

1. **Cascading Deletes:** When a pallet is deleted, all associated positions are automatically deleted.

2. **Row Relationship:** Each pallet must belong to a row, and the row information is cached in the pallet document.

3. **Position Management:** Pallets can contain multiple positions, and positions can be moved between pallets.

4. **Sector Information:** Pallets can optionally be assigned to sectors for organizational purposes.

5. **Timestamps:** All pallets include `createdAt` and `updatedAt` timestamps that are automatically managed by MongoDB.

6. **Error Handling:** Always implement proper error handling in your frontend code to handle network errors and API error responses.

## Related Modules

- **Rows Module:** Pallets belong to rows
- **Positions Module:** Pallets contain positions

For more information about related modules, refer to their respective documentation.

# Тестирование модуля Pallets

## Обзор

Модуль Pallets должен содержать комплексную систему тестирования, покрывающую все аспекты функциональности:

- **Контроллеры** — тестирование бизнес-логики (unit)
- **Модели** — тестирование схемы данных и валидации
- **Интеграционные тесты** — тестирование HTTP endpoints
- **Моки** — изоляция внешних зависимостей

## Структура тестов

```
src/modules/pallets/
├── controllers/
│   └── __tests__/
│       ├── createPallet.test.ts
│       ├── deletePallet.test.ts
│       ├── getAllPallets.test.ts
│       ├── getAllPalletsByRowId.test.ts
│       ├── getPalletById.test.ts
│       ├── movePalletPoses.test.ts
│       ├── deletePalletPoses.test.ts
│       └── updatePallet.test.ts
├── models/
│   └── __tests__/
│       └── Pallet.model.test.ts
├── __tests__/
│   ├── router.integration.test.ts
│   └── index.test.ts
```

## Запуск тестов

### Запуск всех тестов модуля

```bash
npm test -- src/modules/pallets
```

### Запуск конкретных тестов

```bash
# Только контроллеры
npm test -- src/modules/pallets/controllers

# Только модель
npm test -- src/modules/pallets/models

# Интеграционные тесты
npm test -- src/modules/pallets/__tests__/router.integration.test.ts
```

### Запуск с покрытием

```bash
npm run test:coverage -- src/modules/pallets
```

## Рекомендации по тестированию

- Использовать Vitest, Supertest, MongoDB Memory Server
- Покрывать edge cases, ошибки, валидацию
- Мокировать внешние зависимости
- Следовать best practices из arts/rows
