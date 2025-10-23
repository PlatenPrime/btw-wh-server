# API Documentation - Zones Module

## Overview

The Zones module provides comprehensive management of warehouse zones with unique identifiers, barcodes, and sector assignments. This module is designed for warehouse management systems where zones represent physical locations (rows, racks, shelves) with corresponding barcodes for inventory tracking.

**Base URL:** `/api/zones`  
**Authentication:** Bearer Token required  
**Authorization:** ADMIN role required for all operations

## Data Model

### Zone Interface

```typescript
interface IZone {
  _id: string; // MongoDB ObjectId
  title: string; // Zone identifier (e.g., "42-5-2")
  bar: number; // Barcode number (e.g., 420502)
  sector: number; // Sector assignment (default: 0)
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last update timestamp
}
```

### Field Descriptions

- **title**: Unique zone identifier in format `row-rack-shelf` (1-3 numeric segments, 1-2 digits each)
  - Examples: `"42-1"`, `"22-5-1"`, `"42-13-2"`
  - Pattern: `/^\d{1,2}(-\d{1,2}){0,2}$/`
- **bar**: Unique barcode number for Code-128 format
  - Must be positive integer
  - Used for physical scanning operations
- **sector**: Zone sector assignment
  - Non-negative integer
  - Default: 0 (calculated by separate service)
- **createdAt/updatedAt**: Automatic timestamps managed by MongoDB

## API Endpoints

### 1. Create Zone

**POST** `/api/zones/`

Creates a new zone with validation for uniqueness.

#### Request Body

```typescript
{
  title: string;    // Required, unique zone identifier
  bar: number;      // Required, unique barcode
  sector?: number;  // Optional, defaults to 0
}
```

#### Validation Rules

- `title`: Required, must match pattern `/^\d{1,2}(-\d{1,2}){0,2}$/`
- `bar`: Required, positive integer, must be unique
- `sector`: Optional, non-negative integer, defaults to 0

#### Example Request

```javascript
const response = await fetch("/api/zones/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer your-jwt-token",
  },
  body: JSON.stringify({
    title: "42-5-2",
    bar: 420502,
    sector: 0,
  }),
});
```

#### Success Response (201)

```json
{
  "message": "Zone created successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "title": "42-5-2",
    "bar": 420502,
    "sector": 0,
    "createdAt": "2023-07-01T10:30:00.000Z",
    "updatedAt": "2023-07-01T10:30:00.000Z"
  }
}
```

#### Error Responses

**400 - Validation Error**

```json
{
  "message": "Validation error",
  "errors": [
    {
      "code": "invalid_string",
      "expected": "string",
      "received": "number",
      "path": ["title"],
      "message": "Expected string, received number"
    }
  ]
}
```

**409 - Duplicate Zone**

```json
{
  "message": "Zone with this data already exists",
  "duplicateFields": ["title", "bar"]
}
```

### 2. Get All Zones

**GET** `/api/zones/`

Retrieves zones with pagination, search, and sorting capabilities.

#### Query Parameters

| Parameter   | Type   | Default  | Description                                       |
| ----------- | ------ | -------- | ------------------------------------------------- |
| `page`      | number | 1        | Page number (positive integer)                    |
| `limit`     | number | 10       | Items per page (1-100)                            |
| `search`    | string | ""       | Search term for title field                       |
| `sortBy`    | string | "sector" | Sort field: "title", "bar", "sector", "createdAt" |
| `sortOrder` | string | "asc"    | Sort direction: "asc", "desc"                     |

#### Example Request

```javascript
const response = await fetch(
  "/api/zones/?page=1&limit=20&search=42&sortBy=title&sortOrder=asc",
  {
    headers: {
      Authorization: "Bearer your-jwt-token",
    },
  }
);
```

#### Success Response (200)

```json
{
  "message": "Zones retrieved successfully",
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "title": "42-1",
      "bar": 420001,
      "sector": 1,
      "createdAt": "2023-07-01T10:30:00.000Z",
      "updatedAt": "2023-07-01T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 3. Export Zones to Excel

**GET** `/api/zones/export`

Exports all zones to an Excel file with Russian column headers.

#### Example Request

```javascript
const response = await fetch("/api/zones/export", {
  headers: {
    Authorization: "Bearer your-jwt-token",
  },
});

if (response.ok) {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "zones_export_2023-07-01.xlsx";
  a.click();
}
```

#### Success Response (200)

- **Content-Type**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Content-Disposition**: `attachment; filename="zones_export_YYYY-MM-DD.xlsx"`
- **Body**: Excel file buffer

#### Excel Columns

| Column          | Description                |
| --------------- | -------------------------- |
| Название зоны   | Zone title                 |
| Штрихкод        | Barcode number             |
| Сектор          | Sector number              |
| Дата создания   | Creation date (DD.MM.YYYY) |
| Дата обновления | Update date (DD.MM.YYYY)   |

#### Error Response (404)

```json
{
  "message": "No zones found to export"
}
```

### 4. Get Zone by Title

**GET** `/api/zones/title/:title`

Retrieves a specific zone by its title.

#### Path Parameters

- `title` (string): Zone title to search for

#### Example Request

```javascript
const response = await fetch("/api/zones/title/42-5-2", {
  headers: {
    Authorization: "Bearer your-jwt-token",
  },
});
```

#### Success Response (200)

```json
{
  "message": "Zone retrieved successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "title": "42-5-2",
    "bar": 420502,
    "sector": 0,
    "createdAt": "2023-07-01T10:30:00.000Z",
    "updatedAt": "2023-07-01T10:30:00.000Z"
  }
}
```

#### Error Responses

**400 - Missing Title**

```json
{
  "message": "Title is required"
}
```

**404 - Zone Not Found**

```json
{
  "message": "Zone not found"
}
```

### 5. Get Zone by ID

**GET** `/api/zones/:id`

Retrieves a specific zone by its MongoDB ObjectId.

#### Path Parameters

- `id` (string): MongoDB ObjectId

#### Example Request

```javascript
const response = await fetch("/api/zones/64a1b2c3d4e5f6789012345", {
  headers: {
    Authorization: "Bearer your-jwt-token",
  },
});
```

#### Success Response (200)

```json
{
  "message": "Zone retrieved successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "title": "42-5-2",
    "bar": 420502,
    "sector": 0,
    "createdAt": "2023-07-01T10:30:00.000Z",
    "updatedAt": "2023-07-01T10:30:00.000Z"
  }
}
```

#### Error Responses

**400 - Invalid ID Format**

```json
{
  "message": "Invalid zone ID format"
}
```

**404 - Zone Not Found**

```json
{
  "message": "Zone not found"
}
```

### 6. Update Zone

**PUT** `/api/zones/:id`

Updates an existing zone. All fields are optional, but at least one must be provided.

#### Path Parameters

- `id` (string): MongoDB ObjectId

#### Request Body

```typescript
{
  title?: string;   // Optional, must be unique if provided
  bar?: number;     // Optional, must be unique if provided
  sector?: number;  // Optional, non-negative integer
}
```

#### Example Request

```javascript
const response = await fetch("/api/zones/64a1b2c3d4e5f6789012345", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer your-jwt-token",
  },
  body: JSON.stringify({
    sector: 5,
  }),
});
```

#### Success Response (200)

```json
{
  "message": "Zone updated successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "title": "42-5-2",
    "bar": 420502,
    "sector": 5,
    "createdAt": "2023-07-01T10:30:00.000Z",
    "updatedAt": "2023-07-01T11:45:00.000Z"
  }
}
```

#### Error Responses

**400 - Validation Error**

```json
{
  "message": "Validation error",
  "errors": [
    {
      "code": "custom",
      "message": "At least one field must be provided for update",
      "path": []
    }
  ]
}
```

**404 - Zone Not Found**

```json
{
  "message": "Zone not found"
}
```

**409 - Duplicate Data**

```json
{
  "message": "Zone with this data already exists",
  "duplicateFields": ["title"]
}
```

### 7. Delete Zone

**DELETE** `/api/zones/:id`

Deletes a zone by its ID.

#### Path Parameters

- `id` (string): MongoDB ObjectId

#### Example Request

```javascript
const response = await fetch("/api/zones/64a1b2c3d4e5f6789012345", {
  method: "DELETE",
  headers: {
    Authorization: "Bearer your-jwt-token",
  },
});
```

#### Success Response (200)

```json
{
  "message": "Zone deleted successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "title": "42-5-2",
    "bar": 420502,
    "sector": 0,
    "createdAt": "2023-07-01T10:30:00.000Z",
    "updatedAt": "2023-07-01T10:30:00.000Z"
  }
}
```

#### Error Responses

**400 - Invalid ID Format**

```json
{
  "message": "Invalid zone ID format"
}
```

**404 - Zone Not Found**

```json
{
  "message": "Zone not found"
}
```

### 8. Bulk Create Zones

**POST** `/api/zones/bulk`

Creates multiple zones in a single request. Useful for Excel import operations.

#### Request Body

```typescript
{
  zones: Array<{
    title: string; // Required, unique zone identifier
    bar: number; // Required, unique barcode
  }>;
}
```

#### Validation Rules

- `zones`: Array with 1-1000 items
- Each zone must have unique `title` and `bar`
- `sector` is automatically set to 0

#### Example Request

```javascript
const response = await fetch("/api/zones/bulk", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer your-jwt-token",
  },
  body: JSON.stringify({
    zones: [
      { title: "42-1", bar: 420001 },
      { title: "42-2", bar: 420002 },
      { title: "42-3", bar: 420003 },
    ],
  }),
});
```

#### Success Response (200)

```json
{
  "message": "Bulk create completed",
  "results": {
    "created": 2,
    "skipped": 1,
    "errors": [
      {
        "index": 2,
        "error": "Zone with title \"42-3\" or bar \"420003\" already exists",
        "data": {
          "title": "42-3",
          "bar": 420003
        }
      }
    ]
  }
}
```

#### Error Responses

**400 - Validation Error**

```json
{
  "message": "Validation error",
  "errors": [
    {
      "code": "too_big",
      "maximum": 1000,
      "type": "array",
      "inclusive": true,
      "exact": false,
      "message": "Array must contain at most 1000 element(s)",
      "path": ["zones"]
    }
  ]
}
```

## Validation Schemas

### Create Zone Schema

```typescript
{
  title: string; // Pattern: /^\d{1,2}(-\d{1,2}){0,2}$/
  bar: number; // Positive integer
  sector: number; // Non-negative integer, default: 0
}
```

### Update Zone Schema

```typescript
{
  title?: string;   // Optional, same pattern as create
  bar?: number;     // Optional, positive integer
  sector?: number;  // Optional, non-negative integer
}
// At least one field must be provided
```

### Bulk Create Schema

```typescript
{
  zones: Array<{
    title: string; // Required, same pattern
    bar: number; // Required, positive integer
  }>; // 1-1000 items
}
```

### Query Parameters Schema

```typescript
{
  page?: number;      // Default: 1, positive
  limit?: number;     // Default: 10, 1-100
  search?: string;    // Default: ""
  sortBy?: string;    // Default: "sector", enum: ["title", "bar", "sector", "createdAt"]
  sortOrder?: string; // Default: "asc", enum: ["asc", "desc"]
}
```

## Error Handling

### HTTP Status Codes

| Code | Description                          |
| ---- | ------------------------------------ |
| 200  | Success                              |
| 201  | Created                              |
| 400  | Bad Request (validation errors)      |
| 401  | Unauthorized (missing/invalid token) |
| 403  | Forbidden (insufficient role)        |
| 404  | Not Found                            |
| 409  | Conflict (duplicate data)            |
| 500  | Internal Server Error                |

### Authentication Errors

**401 - No Token**

```json
{
  "message": "Не авторизовано: отсутствует токен авторизации",
  "code": "NO_TOKEN"
}
```

**401 - Invalid Token Format**

```json
{
  "message": "Не авторизовано: неверный формат токена",
  "code": "INVALID_TOKEN_FORMAT"
}
```

**401 - Token Expired**

```json
{
  "message": "Не авторизовано: токен истек",
  "code": "TOKEN_EXPIRED"
}
```

**401 - Invalid Token**

```json
{
  "message": "Не авторизовано: невалидный токен",
  "code": "INVALID_TOKEN"
}
```

### Authorization Errors

**403 - Insufficient Role**

```json
{
  "message": "Access denied: ADMIN role required"
}
```

### Validation Errors

All validation errors follow the Zod error format:

```json
{
  "message": "Validation error",
  "errors": [
    {
      "code": "invalid_string",
      "expected": "string",
      "received": "number",
      "path": ["title"],
      "message": "Expected string, received number"
    }
  ]
}
```

### Server Errors

**500 - Internal Server Error**

```json
{
  "message": "Server error",
  "error": "Detailed error message (development only)"
}
```

## Usage Examples

### Frontend Integration with Fetch API

```javascript
class ZonesAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}/api/zones${endpoint}`;
    const config = {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Request failed");
    }

    return response.json();
  }

  // Create zone
  async createZone(zoneData) {
    return this.request("/", {
      method: "POST",
      body: JSON.stringify(zoneData),
    });
  }

  // Get all zones with pagination
  async getZones(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/?${query}`);
  }

  // Get zone by ID
  async getZoneById(id) {
    return this.request(`/${id}`);
  }

  // Update zone
  async updateZone(id, updateData) {
    return this.request(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  }

  // Delete zone
  async deleteZone(id) {
    return this.request(`/${id}`, {
      method: "DELETE",
    });
  }

  // Bulk create zones
  async bulkCreateZones(zones) {
    return this.request("/bulk", {
      method: "POST",
      body: JSON.stringify({ zones }),
    });
  }

  // Export to Excel
  async exportZones() {
    const response = await fetch(`${this.baseURL}/api/zones/export`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Export failed");
    }

    return response.blob();
  }
}

// Usage
const zonesAPI = new ZonesAPI("http://localhost:3232", "your-jwt-token");

// Create a zone
try {
  const newZone = await zonesAPI.createZone({
    title: "42-5-2",
    bar: 420502,
    sector: 0,
  });
  console.log("Zone created:", newZone.data);
} catch (error) {
  console.error("Error creating zone:", error.message);
}

// Get zones with pagination
try {
  const zones = await zonesAPI.getZones({
    page: 1,
    limit: 20,
    search: "42",
    sortBy: "title",
    sortOrder: "asc",
  });
  console.log("Zones:", zones.data);
  console.log("Pagination:", zones.pagination);
} catch (error) {
  console.error("Error fetching zones:", error.message);
}
```

### React Hook Example

```javascript
import { useState, useEffect } from "react";

function useZonesAPI(token) {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const api = new ZonesAPI("http://localhost:3232", token);

  const fetchZones = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getZones(params);
      setZones(response.data);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createZone = async (zoneData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.createZone(zoneData);
      setZones((prev) => [...prev, response.data]);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateZone = async (id, updateData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.updateZone(id, updateData);
      setZones((prev) =>
        prev.map((zone) => (zone._id === id ? response.data : zone))
      );
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteZone = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await api.deleteZone(id);
      setZones((prev) => prev.filter((zone) => zone._id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    zones,
    loading,
    error,
    fetchZones,
    createZone,
    updateZone,
    deleteZone,
  };
}
```

## Best Practices

### 1. Error Handling

- Always check response status before processing data
- Implement proper error boundaries in React components
- Log errors for debugging purposes
- Show user-friendly error messages

### 2. Loading States

- Implement loading indicators for all async operations
- Use optimistic updates where appropriate
- Handle network timeouts gracefully

### 3. Data Validation

- Validate data on the frontend before sending requests
- Use TypeScript interfaces for type safety
- Implement form validation with proper error messages

### 4. Caching

- Consider implementing client-side caching for frequently accessed data
- Use React Query or SWR for server state management
- Implement proper cache invalidation strategies

### 5. Security

- Never expose JWT tokens in client-side code
- Implement token refresh mechanisms
- Use HTTPS in production environments

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for production use to prevent abuse.

## Versioning

This API does not currently implement versioning. All endpoints are under `/api/zones/`. Future versions should use URL versioning (e.g., `/api/v1/zones/`).

---

**Last Updated:** October 2025  
**API Version:** 1.0  
**Maintainer:** Backend Team
