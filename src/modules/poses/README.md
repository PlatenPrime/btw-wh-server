# Positions Module API Documentation

## Overview

The Positions module provides a RESTful API for managing warehouse positions. Each position represents a specific item location within a pallet and row structure. The module supports full CRUD operations with proper error handling and relationship management.

## Data Model

### Position Schema

```typescript
interface Position {
  _id: string; // MongoDB ObjectId
  pallet: {
    _id: string; // Pallet ObjectId
    title: string; // Pallet title (cached)
    sector?: string; // Pallet sector (cached)
  }; // Required: Embedded pallet reference
  row: {
    _id: string; // Row ObjectId
    title: string; // Row title (cached)
  }; // Required: Embedded row reference
  palletTitle?: string; // Optional: Cached pallet title (legacy)
  rowTitle?: string; // Optional: Cached row title (legacy)
  artikul?: string; // Optional: Article number
  quant?: number; // Optional: Quantity
  boxes?: number; // Optional: Number of boxes
  date?: string; // Optional: Date string
  sklad?: string; // Optional: Warehouse identifier
  createdAt: Date; // Auto-generated timestamp
  updatedAt: Date; // Auto-generated timestamp
}
```

## API Endpoints

### Base URL

```
/api/poses
```

### 1. Get All Positions

**Endpoint:** `GET /api/poses`

**Query Parameters:**

- `page` (string, optional, default: "1") — Page number
- `limit` (string, optional, default: "10") — Items per page
- `palletId` (string, optional) — Filter by pallet ID
- `rowId` (string, optional) — Filter by row ID
- `artikul` (string, optional) — Search by article number (case-insensitive)
- `sklad` (string, optional) — Search by warehouse (case-insensitive)

**Response:**

- **Success (200):** Paginated response with positions
- **Server Error (500):** `{ error: "Failed to fetch poses", details }`

**Example Response:**

```json
{
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "pallet": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "title": "Pallet A",
        "sector": "Sector 1"
      },
      "row": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "title": "Row A"
      },
      "artikul": "ART001",
      "quant": 100,
      "boxes": 10,
      "date": "2024-01-01",
      "sklad": "Main",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "totalPages": 5
}
```

### 2. Get Position by ID

**Endpoint:** `GET /api/poses/:id`

**Parameters:**

- `id` (string): MongoDB ObjectId of the position

**Response:**

- **Success (200):** Position object with populated references
- **Bad Request (400):** `{ error: "Invalid position ID" }`
- **Not Found (404):** `{ error: "Position not found" }`
- **Server Error (500):** `{ error: "Failed to fetch position", details }`

### 3. Get Positions by Pallet ID

**Endpoint:** `GET /api/poses/by-pallet/:palletId`

**Parameters:**

- `palletId` (string): MongoDB ObjectId of the pallet

**Response:**

- **Success (200):** Array of positions for the specified pallet
- **Bad Request (400):** `{ error: "Invalid pallet ID" }`
- **Server Error (500):** `{ error: "Failed to fetch poses by pallet", details }`

### 4. Get Positions by Row ID

**Endpoint:** `GET /api/poses/by-row/:rowId`

**Parameters:**

- `rowId` (string): MongoDB ObjectId of the row

**Response:**

- **Success (200):** Array of positions for the specified row
- **Bad Request (400):** `{ error: "Invalid row ID" }`
- **Server Error (500):** `{ error: "Failed to fetch poses by row", details }`

### 5. Create Position

**Endpoint:** `POST /api/poses`

**Body:**

```json
{
  "palletId": "64f8a1b2c3d4e5f6a7b8c9d1", // Required: Pallet ObjectId
  "rowId": "64f8a1b2c3d4e5f6a7b8c9d2", // Required: Row ObjectId
  "palletTitle": "Pallet A", // optional: Override cached pallet title
  "rowTitle": "Row A", // optional: Override cached row title
  "artikul": "ART001", // optional
  "quant": 100, // optional
  "boxes": 10, // optional
  "date": "2024-01-01", // optional
  "sklad": "Main" // optional
}
```

**Response:**

- **Created (201):** Created position object with populated references
- **Bad Request (400):** `{ error: validation_errors }`
- **Not Found (404):** `{ error: "Pallet not found" }` or `{ error: "Row not found" }`
- **Server Error (500):** `{ error: "Failed to create position", details }`

### 6. Bulk Create Positions

**Endpoint:** `POST /api/poses/bulk`

**Body:**

```json
{
  "poses": [
    {
      "palletId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "rowId": "64f8a1b2c3d4e5f6a7b8c9d2",
      "artikul": "ART001",
      "quant": 100
    },
    {
      "palletId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "rowId": "64f8a1b2c3d4e5f6a7b8c9d2",
      "artikul": "ART002",
      "quant": 50
    }
  ]
}
```

**Response:**

- **Created (201):** `{ message: "X positions created successfully", data: [...] }`
- **Bad Request (400):** `{ error: validation_errors }`
- **Not Found (404):** `{ error: "Some pallets not found" }` or `{ error: "Some rows not found" }`
- **Server Error (500):** `{ error: "Failed to create positions", details }`

### 7. Update Position

**Endpoint:** `PUT /api/poses/:id`

**Parameters:**

- `id` (string): MongoDB ObjectId of the position

**Body:** (all fields optional)

```json
{
  "palletId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "rowId": "64f8a1b2c3d4e5f6a7b8c9d2",
  "artikul": "ART001",
  "quant": 150,
  "boxes": 15,
  "date": "2024-01-02",
  "sklad": "Secondary"
}
```

**Response:**

- **Success (200):** Updated position object with populated references
- **Bad Request (400):** `{ error: "Invalid position ID" }` or `{ error: validation_errors }`
- **Not Found (404):** `{ error: "Position not found" }`
- **Server Error (500):** `{ error: "Failed to update position", details }`

### 8. Delete Position

**Endpoint:** `DELETE /api/poses/:id`

**Parameters:**

- `id` (string): MongoDB ObjectId of the position

**Response:**

- **Success (200):** `{ message: "Position deleted successfully" }`
- **Bad Request (400):** `{ error: "Invalid position ID" }`
- **Not Found (404):** `{ error: "Position not found" }`
- **Server Error (500):** `{ error: "Failed to delete position", details }`

## Important Notes

1. **Request vs Response Format:** While requests use `palletId` and `rowId` references, responses include embedded pallet and row subdocuments for better performance.

2. **Transaction Safety:** All operations that modify multiple documents use MongoDB transactions to ensure data consistency.

3. **Validation:** All input data is validated using Zod schemas with proper error messages.

4. **Cached Data:** Position responses include embedded pallet and row data for easier frontend consumption without additional queries.

5. **Search and Filtering:** The getAllPoses endpoint supports flexible filtering and search capabilities.

6. **Pagination:** List endpoints support pagination with customizable page size.

## Related Modules

- **Pallets Module:** Positions are associated with pallets
- **Rows Module:** Positions are associated with rows
- **Arts Module:** Positions can reference articles by `artikul`

For more information about related modules, refer to their respective documentation.
