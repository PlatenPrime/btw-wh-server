# Rows Module API Documentation

## Overview

The Rows module provides a RESTful API for managing warehouse rows. Each row can contain multiple pallets and is identified by a unique title. The module supports full CRUD operations with proper error handling and cascading deletes.

## Data Model

### Row Schema

```typescript
interface Row {
  _id: string; // MongoDB ObjectId
  title: string; // Required: Unique row identifier
  pallets: string[]; // Array of Pallet ObjectIds (references)
  createdAt: Date; // Auto-generated timestamp
  updatedAt: Date; // Auto-generated timestamp
}
```

## API Endpoints

### Base URL

```
/api/rows
```

### 1. Get All Rows

**Endpoint:** `GET /api/rows`

**Description:** Retrieves all rows sorted alphabetically by title.

**Response:**

- **Success (200):** Array of row objects
- **Not Found (404):** `{ message: "Rows not found" }`
- **Server Error (500):** `{ message: "Server error", error }`

**Example Response:**

```json
[
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "title": "Row A",
    "pallets": ["64f8a1b2c3d4e5f6a7b8c9d1", "64f8a1b2c3d4e5f6a7b8c9d2"],
    "createdAt": "2023-09-06T10:30:00.000Z",
    "updatedAt": "2023-09-06T10:30:00.000Z"
  },
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
    "title": "Row B",
    "pallets": [],
    "createdAt": "2023-09-06T11:00:00.000Z",
    "updatedAt": "2023-09-06T11:00:00.000Z"
  }
]
```

### 2. Get Row by ID

**Endpoint:** `GET /api/rows/id/:id`

**Description:** Retrieves a specific row by its MongoDB ObjectId.

**Parameters:**

- `id` (string): MongoDB ObjectId of the row

**Response:**

- **Success (200):** Row object
- **Not Found (404):** `{ message: "Row not found" }`
- **Server Error (500):** `{ message: "Server error", error }`

**Example Request:**

```
GET /api/rows/id/64f8a1b2c3d4e5f6a7b8c9d0
```

**Example Response:**

```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "title": "Row A",
  "pallets": ["64f8a1b2c3d4e5f6a7b8c9d1", "64f8a1b2c3d4e5f6a7b8c9d2"],
  "createdAt": "2023-09-06T10:30:00.000Z",
  "updatedAt": "2023-09-06T10:30:00.000Z"
}
```

### 3. Get Row by Title

**Endpoint:** `GET /api/rows/title/:title`

**Description:** Retrieves a specific row by its title.

**Parameters:**

- `title` (string): Title of the row

**Response:**

- **Success (200):** Row object
- **Not Found (404):** `{ message: "Row not found" }`
- **Server Error (500):** `{ message: "Server error", error }`

**Example Request:**

```
GET /api/rows/title/Row%20A
```

**Example Response:**

```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "title": "Row A",
  "pallets": ["64f8a1b2c3d4e5f6a7b8c9d1", "64f8a1b2c3d4e5f6a7b8c9d2"],
  "createdAt": "2023-09-06T10:30:00.000Z",
  "updatedAt": "2023-09-06T10:30:00.000Z"
}
```

### 4. Create Row

**Endpoint:** `POST /api/rows`

**Description:** Creates a new row with the specified title.

**Request Body:**

```typescript
{
  title: string; // Required: Unique row title
}
```

**Response:**

- **Success (201):** Created row object
- **Server Error (500):** `{ message: "Server error", error }`

**Example Request:**

```json
{
  "title": "New Row"
}
```

**Example Response:**

```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
  "title": "New Row",
  "pallets": [],
  "createdAt": "2023-09-06T12:00:00.000Z",
  "updatedAt": "2023-09-06T12:00:00.000Z"
}
```

### 5. Update Row

**Endpoint:** `PUT /api/rows/:id`

**Description:** Updates an existing row by ID.

**Parameters:**

- `id` (string): MongoDB ObjectId of the row to update

**Request Body:**

```typescript
{
  title?: string;     // Optional: New title
  pallets?: string[]; // Optional: Array of Pallet ObjectIds
}
```

**Response:**

- **Success (200):** Updated row object
- **Not Found (404):** `{ message: "Row not found" }`
- **Server Error (500):** `{ message: "Server error", error }`

**Example Request:**

```json
PUT /api/rows/64f8a1b2c3d4e5f6a7b8c9d0
{
  "title": "Updated Row Title"
}
```

**Example Response:**

```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "title": "Updated Row Title",
  "pallets": ["64f8a1b2c3d4e5f6a7b8c9d1", "64f8a1b2c3d4e5f6a7b8c9d2"],
  "createdAt": "2023-09-06T10:30:00.000Z",
  "updatedAt": "2023-09-06T12:30:00.000Z"
}
```

### 6. Delete Row

**Endpoint:** `DELETE /api/rows/:id`

**Description:** Deletes a row and all associated pallets and positions (cascading delete).

**Parameters:**

- `id` (string): MongoDB ObjectId of the row to delete

**Response:**

- **Success (200):** `{ message: "Row and related pallets and positions deleted" }`
- **Not Found (404):** `{ message: "Row not found" }`
- **Server Error (500):** `{ message: "Server error", error }`

**Example Request:**

```
DELETE /api/rows/64f8a1b2c3d4e5f6a7b8c9d0
```

**Example Response:**

```json
{
  "message": "Row and related pallets and positions deleted"
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
// Get all rows
const getAllRows = async () => {
  try {
    const response = await fetch("/api/rows");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const rows = await response.json();
    return rows;
  } catch (error) {
    console.error("Error fetching rows:", error);
    throw error;
  }
};

// Create a new row
const createRow = async (title: string) => {
  try {
    const response = await fetch("/api/rows", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const newRow = await response.json();
    return newRow;
  } catch (error) {
    console.error("Error creating row:", error);
    throw error;
  }
};

// Update a row
const updateRow = async (id: string, updates: Partial<Row>) => {
  try {
    const response = await fetch(`/api/rows/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const updatedRow = await response.json();
    return updatedRow;
  } catch (error) {
    console.error("Error updating row:", error);
    throw error;
  }
};

// Delete a row
const deleteRow = async (id: string) => {
  try {
    const response = await fetch(`/api/rows/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error deleting row:", error);
    throw error;
  }
};
```

### Using React Query (TanStack Query)

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Query keys
const ROW_KEYS = {
  all: ["rows"] as const,
  lists: () => [...ROW_KEYS.all, "list"] as const,
  list: (filters: string) => [...ROW_KEYS.lists(), { filters }] as const,
  details: () => [...ROW_KEYS.all, "detail"] as const,
  detail: (id: string) => [...ROW_KEYS.details(), id] as const,
};

// Hooks
export const useRows = () => {
  return useQuery({
    queryKey: ROW_KEYS.lists(),
    queryFn: getAllRows,
  });
};

export const useRow = (id: string) => {
  return useQuery({
    queryKey: ROW_KEYS.detail(id),
    queryFn: () => getRowById(id),
    enabled: !!id,
  });
};

export const useCreateRow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROW_KEYS.lists() });
    },
  });
};

export const useUpdateRow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Row> }) =>
      updateRow(id, updates),
    onSuccess: (updatedRow) => {
      queryClient.invalidateQueries({ queryKey: ROW_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: ROW_KEYS.detail(updatedRow._id),
      });
    },
  });
};

export const useDeleteRow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROW_KEYS.lists() });
    },
  });
};
```

## Important Notes

1. **Cascading Deletes:** When a row is deleted, all associated pallets and their positions are automatically deleted.

2. **Title Uniqueness:** Row titles should be unique within the system.

3. **Pallets Relationship:** Rows contain references to pallets via ObjectIds. When working with pallet data, you may need to populate these references.

4. **Timestamps:** All rows include `createdAt` and `updatedAt` timestamps that are automatically managed by MongoDB.

5. **Error Handling:** Always implement proper error handling in your frontend code to handle network errors and API error responses.

## Related Modules

- **Pallets Module:** Rows contain references to pallets
- **Positions Module:** Pallets contain positions, which are deleted when rows are deleted

For more information about related modules, refer to their respective documentation.
