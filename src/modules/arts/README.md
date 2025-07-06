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
| `marker`      | `string`          | No       | Marker/label              |
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

### 4. Get Btrade Info by Artikul

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

### 5. Upsert Arts (Bulk Insert/Update)

- **URL:** `POST /arts/upsert`
- **Body:** Array of Art objects (see model above)

```json
[
  {
    "artikul": "...",
    "zone": "...",
    "nameukr": "...",
    "namerus": "..."
    // ...other fields
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

- **Errors:**
  - `400` — Invalid or empty data
  - `500` — Server error

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
