# Arts Module API Documentation

This document describes the available API endpoints for the `arts` module. Use these endpoints to interact with the Art resources from the frontend.

---

## Model: `Art`

### Fields

| Field         | Type              | Required | Description               |
| ------------- | ----------------- | -------- | ------------------------- |
| `artikul`     | `string`          | Yes      | Unique article identifier |
| `nameukr`     | `string`          | No       | Name in Ukrainian         |
| `namerus`     | `string`          | No       | Name in Russian           |
| `zone`        | `string`          | Yes      | Zone/category             |
| `limit`       | `number`          | No       | Limit value               |
| `marker`      | `string`          | No       | Date marker in YYYYMMDD format (e.g., "20251123" for November 23, 2025). Automatically set on upsert if not provided. |
| `btradeStock` | `{ value, date }` | No       | Btrade stock info         |
| `createdAt`   | `Date`            | No       | Creation timestamp        |
| `updatedAt`   | `Date`            | No       | Update timestamp          |

---

## Endpoints

### 1. Get All Arts

- **URL:** `GET /arts`
- **Query Parameters:**
  - `page` (string, optional, default: "1") — Page number
  - `limit` (string, optional, default: "10") — Items per page
  - `search` (string, optional) — Search by `artikul`, `nameukr`, or `namerus`
- **Response:**

```json
{
  "data": [Art, ...],
  "total": 100,
  "page": 1,
  "totalPages": 10
}
```

- **Errors:**
  - `500` — Server error

---

### 2. Get Art by ID

- **URL:** `GET /arts/id/:id`
- **Response:**

```json
{
  "_id": "...",
  "artikul": "...",
  "nameukr": "...",
  "namerus": "...",
  "zone": "..."
  // ...other fields
}
```

- **Errors:**
  - `404` — Art not found
  - `500` — Server error

---

### 3. Get Art by Artikul

- **URL:** `GET /arts/artikul/:artikul`
- **Response:**

```json
{
  "_id": "...",
  "artikul": "...",
  "nameukr": "...",
  "namerus": "...",
  "zone": "..."
  // ...other fields
}
```

- **Errors:**
  - `404` — Art not found
  - `500` — Server error

---

### 4. Get Arts by Zone

- **URL:** `GET /arts/zone/:zone`
- **Path Parameters:**
  - `zone` (string, required) — Zone identifier (e.g., "42-5-2")
- **Response:**

```json
{
  "data": [Art, ...],
  "total": 25
}
```

- **Errors:**
  - `500` — Server error

---

### 5. Get Btrade Info by Artikul

- **URL:** `GET /arts/btrade/:artikul`
- **Response:**

```json
{
  "nameukr": "...",
  "price": 123.45,
  "quantity": 10
}
```

- **Errors:**
  - `400` — Artikul is required
  - `404` — No products found / Product data not found or incomplete
  - `500` — Parsing Btrade artikul failed

---

### 6. Upsert Arts (Bulk Insert/Update)

- **URL:** `POST /arts/upsert`
- **Access:** ADMIN, PRIME
- **Body:** Array of Art objects (see model above)

```json
[
  {
    "artikul": "...",
    "zone": "...",
    "nameukr": "...",
    "namerus": "...",
    "limit": 10,
    "marker": "20251123"  // Optional: if not provided, current date marker will be set automatically
  }
  // ...
]
```

- **Response:**

```json
{
  "message": "Upsert completed",
  "result": {
    /* MongoDB bulkWrite result */
  }
}
```

- **Notes:**
  - If `marker` is not provided in the request, it will be automatically set to the current date in YYYYMMDD format (based on Europe/Kyiv timezone)
  - You can still manually set `marker` if needed
  - All arts in the same upsert batch will receive the same auto-generated marker if not explicitly provided

- **Errors:**
  - `400` — Invalid or empty data / Validation error
  - `401` — Unauthorized
  - `403` — Insufficient permissions (requires ADMIN or PRIME role)
  - `500` — Server error

---

### 7. Delete Arts Without Latest Marker

- **URL:** `DELETE /arts/without-latest-marker`
- **Access:** PRIME only
- **Description:** Deletes all arts that don't have the latest marker value. This endpoint finds the maximum marker among all arts in the database and removes all arts with:
  - Missing marker (null, undefined, empty string)
  - Marker value less than the maximum marker

- **Request:** No body required

- **Response:**

```json
{
  "message": "Arts without latest marker deleted successfully",
  "result": {
    "deletedCount": 42,
    "latestMarker": "20251123"
  }
}
```

- **Response Fields:**
  - `deletedCount` (number) — Number of arts that were deleted
  - `latestMarker` (string | null) — The maximum marker value found in the database (null if no markers exist)

- **Example Usage:**

```javascript
// Using fetch with error handling
async function deleteArtsWithoutLatestMarker(token) {
  try {
    const response = await fetch('/api/arts/without-latest-marker', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete arts');
    }

    const data = await response.json();
    console.log(`Deleted ${data.result.deletedCount} arts`);
    console.log(`Latest marker was: ${data.result.latestMarker}`);
    
    return data;
  } catch (error) {
    console.error('Error deleting arts:', error);
    throw error;
  }
}

// Usage
deleteArtsWithoutLatestMarker(userToken)
  .then(result => {
    // Handle success
    alert(`Удалено артикулов: ${result.result.deletedCount}`);
  })
  .catch(error => {
    // Handle error (401, 403, 500, etc.)
    if (error.message.includes('403')) {
      alert('Недостаточно прав. Требуется роль PRIME.');
    } else {
      alert(`Ошибка: ${error.message}`);
    }
  });
```

- **Errors:**
  - `401` — Unauthorized (missing or invalid token)
  - `403` — Insufficient permissions (requires PRIME role)
  - `500` — Server error

- **Important Notes:**
  - ⚠️ **This operation is irreversible** — deleted arts cannot be recovered
  - Only users with PRIME role can access this endpoint
  - The operation finds the maximum marker value and deletes all arts with markers less than that value or without markers
  - If no arts exist or no markers are found, `deletedCount` will be 0 and `latestMarker` will be null

---

## Error Handling

- All endpoints return errors in the following format:

```json
{
  "message": "Error description",
  "error": {
    /* optional, error details */
  }
}
```

---

## Notes

- All responses are in JSON.
- For authentication/authorization, refer to the main API documentation if required.
- Use appropriate HTTP methods and status codes as described above.

---

For further details, refer to the source code or contact the backend team.
