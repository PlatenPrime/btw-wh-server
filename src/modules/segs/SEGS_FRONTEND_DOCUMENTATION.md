# API Documentation - Segments Module

## Overview

The Segments module provides comprehensive management of segments that contain zones. Segments are intermediate entities between blocks and zones, allowing multiple zones to share the same sector. Segments belong to blocks and contain zones.

**Base URL:** `/api/segs`  
**Authentication:** Bearer Token required  
**Authorization:** ADMIN role required for all operations

## Data Models

### Segment Interface

```typescript
interface ISeg {
  _id: string; // MongoDB ObjectId
  block: string; // Block ObjectId (reference)
  blockData: {
    _id: string; // Block ObjectId (cached)
    title: string; // Block title (cached)
  };
  sector: number; // Calculated sector: blockOrder * 1000 + segOrder
  order: number; // Position within the block (1-based, starts from 1)
  zones: string[]; // Array of Zone ObjectIds
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last update timestamp
}
```

### Field Descriptions

**Segment:**
- `_id`: MongoDB ObjectId
- `block`: Reference to the parent block (ObjectId)
- `blockData`: Cached block data for performance
  - `_id`: Block ObjectId
  - `title`: Block title
- `sector`: Calculated value based on formula: `blockOrder * 1000 + segOrder`
- `order`: Position within the block (1-based, starts from 1)
- `zones`: Array of Zone ObjectIds (minimum 1 zone required)
- `createdAt/updatedAt`: Automatic timestamps

## Sector Calculation Logic

The sector for a segment (and all its zones) is calculated using the following formula:

```
sector = blockOrder * SECTOR_MULTIPLIER + segOrder
```

Where:
- `SECTOR_MULTIPLIER = 1000` (constant for separating sectors between blocks)
- `blockOrder`: Position of the block in the sorted blocks list (1-based, starts from 1)
- `segOrder`: Position of the segment within its block (1-based, starts from 1)

**Examples:**
- Block 1, Segment 1: `sector = 1 * 1000 + 1 = 1001`
- Block 1, Segment 2: `sector = 1 * 1000 + 2 = 1002`
- Block 4, Segment 1: `sector = 4 * 1000 + 1 = 4001`
- Block 4, Segment 5: `sector = 4 * 1000 + 5 = 4005`

**Important:**
- All zones in a segment receive the same sector value
- Sectors are **NOT** automatically recalculated when block/segment positions change
- Use `/api/blocks/recalculate-zones-sectors` endpoint to recalculate sectors when needed

## API Endpoints

### 1. Create Segment

**POST** `/api/segs/`

Creates a new segment with zones. The segment is automatically added to the block's `segs` array.

#### Request Body

```typescript
{
  blockData: {
    _id: string; // Required, valid Block ObjectId
    title: string; // Required, block title
  };
  order: number; // Required, position within block (1-based, min 1)
  zones: string[]; // Required, array of Zone ObjectIds (minimum 1 zone)
}
```

#### Validation Rules

- `blockData._id`: Required, must be valid ObjectId, block must exist
- `blockData.title`: Required, must match the block's title
- `order`: Required, must be at least 1 (1-based numbering)
- `zones`: Required array, must contain at least 1 zone ObjectId
  - All zones must exist
  - Zones cannot already belong to other segments

#### Example Request

```typescript
const response = await fetch("/api/segs/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    blockData: {
      _id: "507f1f77bcf86cd799439011",
      title: "Block A",
    },
    order: 1,
    zones: [
      "507f1f77bcf86cd799439031",
      "507f1f77bcf86cd799439032",
      "507f1f77bcf86cd799439033",
    ],
  }),
});
```

#### Example Response

```typescript
{
  message: "Segment created successfully",
  data: {
    _id: "507f1f77bcf86cd799439021",
    block: "507f1f77bcf86cd799439011",
    blockData: {
      _id: "507f1f77bcf86cd799439011",
      title: "Block A",
    },
    sector: 1001,
    order: 1,
    zones: [
      "507f1f77bcf86cd799439031",
      "507f1f77bcf86cd799439032",
      "507f1f77bcf86cd799439033",
    ],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `201`: Segment created successfully
- `400`: Validation error or zones already belong to segments
- `404`: Block not found
- `500`: Server error

### 2. Get All Segments

**GET** `/api/segs/`

Retrieves all segments sorted by order.

#### Example Request

```typescript
const response = await fetch("/api/segs/", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

#### Example Response

```typescript
{
  exists: true,
  message: "Segments retrieved successfully",
  data: [
    {
      _id: "507f1f77bcf86cd799439021",
      block: "507f1f77bcf86cd799439011",
      blockData: {
        _id: "507f1f77bcf86cd799439011",
        title: "Block A",
      },
      sector: 1001,
      order: 1,
      zones: ["507f1f77bcf86cd799439031", "507f1f77bcf86cd799439032"],
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200`: Success (always returns 200, check `exists` flag)
- `500`: Server error

### 3. Get Segment by ID

**GET** `/api/segs/:id`

Retrieves a single segment by its ID.

#### Path Parameters

- `id`: Segment ObjectId (required)

#### Example Request

```typescript
const segId = "507f1f77bcf86cd799439021";
const response = await fetch(`/api/segs/${segId}`, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

#### Example Response (Segment Found)

```typescript
{
  exists: true,
  message: "Segment retrieved successfully",
  data: {
    _id: "507f1f77bcf86cd799439021",
    block: "507f1f77bcf86cd799439011",
    blockData: {
      _id: "507f1f77bcf86cd799439011",
      title: "Block A",
    },
    sector: 1001,
    order: 1,
    zones: ["507f1f77bcf86cd799439031", "507f1f77bcf86cd799439032"],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  }
}
```

#### Example Response (Segment Not Found)

```typescript
{
  exists: false,
  message: "Segment not found",
  data: null
}
```

**Status Codes:**
- `200`: Success (always returns 200, check `exists` flag)
- `400`: Invalid segment ID format
- `500`: Server error

### 4. Get Segments by Block ID

**GET** `/api/segs/by-block/:blockId`

Retrieves all segments belonging to a specific block, sorted by order.

#### Path Parameters

- `blockId`: Block ObjectId (required)

#### Example Request

```typescript
const blockId = "507f1f77bcf86cd799439011";
const response = await fetch(`/api/segs/by-block/${blockId}`, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

#### Example Response

```typescript
{
  exists: true,
  message: "Segments retrieved successfully",
  data: [
    {
      _id: "507f1f77bcf86cd799439021",
      block: "507f1f77bcf86cd799439011",
      blockData: {
        _id: "507f1f77bcf86cd799439011",
        title: "Block A",
      },
      sector: 1001,
      order: 1,
      zones: ["507f1f77bcf86cd799439031"],
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    },
    {
      _id: "507f1f77bcf86cd799439022",
      block: "507f1f77bcf86cd799439011",
      blockData: {
        _id: "507f1f77bcf86cd799439011",
        title: "Block A",
      },
      sector: 1002,
      order: 2,
      zones: ["507f1f77bcf86cd799439032"],
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200`: Success (always returns 200, check `exists` flag)
- `400`: Invalid block ID format
- `500`: Server error

### 5. Get Zones by Segment ID

**GET** `/api/segs/:segId/zones`

Retrieves all zones belonging to a specific segment. This endpoint is useful for displaying zones on a segment's dedicated page.

#### Path Parameters

- `segId`: Segment ObjectId (required)

#### Example Request

```typescript
const segId = "507f1f77bcf86cd799439021";
const response = await fetch(`/api/segs/${segId}/zones`, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

#### Example Response

```typescript
{
  exists: true,
  message: "Zones retrieved successfully",
  data: [
    {
      _id: "507f1f77bcf86cd799439031",
      title: "42-5-2",
      bar: 420502,
      sector: 1001,
      seg: {
        id: "507f1f77bcf86cd799439021",
      },
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    },
    {
      _id: "507f1f77bcf86cd799439032",
      title: "42-5-3",
      bar: 420503,
      sector: 1001,
      seg: {
        id: "507f1f77bcf86cd799439021",
      },
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200`: Success (always returns 200, check `exists` flag)
- `400`: Invalid segment ID format
- `500`: Server error

### 6. Update Segment

**PUT** `/api/segs/:id`

Updates a segment. All fields are optional, but at least one field must be provided.

#### Path Parameters

- `id`: Segment ObjectId (required)

#### Request Body

```typescript
{
  order?: number; // Optional: Update segment position within block
  zones?: string[]; // Optional: Update list of zones (minimum 1 zone)
}
```

#### Validation Rules

- `order`: Optional, must be at least 1 (1-based numbering)
- `zones`: Optional array, must contain at least 1 zone ObjectId if provided
  - All zones must exist
  - Zones cannot already belong to other segments
  - Zones removed from segment will have their `seg` field unset and `sector = 0`

#### Example Request

```typescript
const segId = "507f1f77bcf86cd799439021";
const response = await fetch(`/api/segs/${segId}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    order: 2,
    zones: [
      "507f1f77bcf86cd799439031",
      "507f1f77bcf86cd799439032",
      "507f1f77bcf86cd799439033",
      "507f1f77bcf86cd799439034", // New zone added
    ],
  }),
});
```

#### Example Response

```typescript
{
  message: "Segment updated successfully",
  data: {
    _id: "507f1f77bcf86cd799439021",
    block: "507f1f77bcf86cd799439011",
    blockData: {
      _id: "507f1f77bcf86cd799439011",
      title: "Block A",
    },
    sector: 1002, // Updated based on new order
    order: 2,
    zones: [
      "507f1f77bcf86cd799439031",
      "507f1f77bcf86cd799439032",
      "507f1f77bcf86cd799439033",
      "507f1f77bcf86cd799439034",
    ],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T01:00:00.000Z"
  }
}
```

**Important Notes:**
- Sectors are **NOT** automatically recalculated when `order` is updated
- Zones not included in the `zones` array will have their `seg` field unset and `sector = 0`
- All zones in the `zones` array must exist
- Zones cannot already belong to other segments
- Use `/api/blocks/recalculate-zones-sectors` endpoint to recalculate sectors after updating positions

**Status Codes:**
- `200`: Segment updated successfully
- `400`: Validation error or zones already belong to other segments
- `404`: Segment not found
- `500`: Server error

### 7. Delete Segment

**DELETE** `/api/segs/:id`

Deletes a segment and removes segment associations from all related zones. The segment is also removed from the block's `segs` array.

#### Path Parameters

- `id`: Segment ObjectId (required)

#### Example Request

```typescript
const segId = "507f1f77bcf86cd799439021";
const response = await fetch(`/api/segs/${segId}`, {
  method: "DELETE",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

#### Example Response

```typescript
{
  message: "Segment deleted successfully",
  data: {
    _id: "507f1f77bcf86cd799439021",
    block: "507f1f77bcf86cd799439011",
    blockData: {
      _id: "507f1f77bcf86cd799439011",
      title: "Block A",
    },
    sector: 1001,
    order: 1,
    zones: ["507f1f77bcf86cd799439031", "507f1f77bcf86cd799439032"],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  }
}
```

**Important Notes:**
- All zones associated with this segment will have their `seg` field unset and `sector = 0`
- The segment is removed from the block's `segs` array
- Sectors are **NOT** automatically recalculated after deletion
- Use `/api/blocks/recalculate-zones-sectors` endpoint to recalculate sectors after deletion if needed

**Status Codes:**
- `200`: Segment deleted successfully
- `400`: Invalid segment ID format
- `404`: Segment not found
- `500`: Server error

### 8. Bulk Upsert Segments

**POST** `/api/segs/upsert`

Creates or updates multiple segments in one request. Existing segments are matched by `_id`; omit `_id` to create new segments. All operations are executed inside a MongoDB transaction to keep blocks, segments, and zones consistent.

#### Request Body

```typescript
[
  {
    _id?: string; // Optional: existing segment ObjectId
    blockId: string; // Required: parent block id
    order: number; // Required: >= 1
    zones: string[]; // Required: >= 1 zone id
  }
]
```

#### Validation Rules

- Each entry must reference an existing block.
- Zone ids must exist and cannot appear in multiple payload entries.
- When updating, `blockId` must match the segment's current block (block transfers are not supported via this endpoint).
- Zones already attached to other segments (outside the payload) will trigger an error—detach them first.

#### Example Request

```typescript
await fetch("/api/segs/upsert", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify([
    {
      blockId: blockId,
      order: 1,
      zones: [zoneAId, zoneBId],
    },
    {
      _id: existingSegId,
      blockId: blockId,
      order: 2,
      zones: [zoneCId],
    },
  ]),
});
```

#### Example Response

```typescript
{
  message: "Segments upsert completed",
  data: {
    processedSegs: ISeg[];
  }
}
```

#### Notes

- Zones removed from a segment are automatically cleared (`seg` unset, `sector = 0`).
- Updated segments automatically receive recalculated sectors using the parent block order.
- Combine this endpoint with `/api/blocks/upsert` for full spreadsheet/drag-and-drop workflows.

## Frontend Integration

### TypeScript Types

```typescript
// Segment types
interface Segment {
  _id: string;
  block: string;
  blockData: {
    _id: string;
    title: string;
  };
  sector: number;
  order: number;
  zones: string[];
  createdAt: string;
  updatedAt: string;
}

interface CreateSegInput {
  blockData: {
    _id: string;
    title: string;
  };
  order: number;
  zones: string[]; // Minimum 1 zone required
}

interface UpdateSegInput {
  order?: number;
  zones?: string[]; // Minimum 1 zone required if provided
}
```

### TanStack Query Integration

#### Setup

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = "/api/segs";
```

#### Get Segments by Block ID

```typescript
const useSegsByBlock = (blockId: string) => {
  return useQuery({
    queryKey: ["segs", "block", blockId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/by-block/${blockId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch segments");
      const data = await response.json();
      if (!data.exists) {
        return [];
      }
      return data.data as Segment[];
    },
    enabled: !!blockId,
  });
};
```

#### Get Zones by Segment ID

```typescript
const useZonesBySeg = (segId: string) => {
  return useQuery({
    queryKey: ["zones", "seg", segId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/${segId}/zones`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch zones");
      const data = await response.json();
      if (!data.exists) {
        return [];
      }
      return data.data as Zone[];
    },
    enabled: !!segId,
  });
};
```

#### Create Segment

```typescript
const useCreateSeg = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSegInput) => {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create segment");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["segs", "block", variables.blockData._id] });
      queryClient.invalidateQueries({ queryKey: ["blocks"] });
    },
  });
};
```

#### Update Segment

```typescript
const useUpdateSeg = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateSegInput;
    }) => {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update segment");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["segs"] });
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      queryClient.invalidateQueries({ queryKey: ["blocks"] });
    },
  });
};
```

#### Delete Segment

```typescript
const useDeleteSeg = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete segment");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["segs"] });
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      queryClient.invalidateQueries({ queryKey: ["blocks"] });
    },
  });
};
```

## Best Practices

1. **Segment Page**: Use `GET /api/segs/:segId/zones` to display all zones on a segment's dedicated page
2. **Adding Zones**: Use `PUT /api/segs/:id` with updated `zones` array to add/remove zones
3. **Multiple Zone Selection**: When creating a segment, use a multi-select component similar to zone selection for blocks
4. **Sector Recalculation**: Call `/api/blocks/recalculate-zones-sectors` after updating segment positions
5. **Error Handling**: Always handle errors and show user-friendly messages
6. **Cache Management**: Invalidate related queries (segs, zones, blocks) after mutations
7. **Bulk sync**: Prefer `POST /api/segs/upsert` when saving large reorder operations instead of issuing many `PUT` calls per segment.

## Notes

- All operations require ADMIN role
- Sectors are **NOT** automatically recalculated - use `/api/blocks/recalculate-zones-sectors` endpoint explicitly
- Each segment must contain at least 1 zone
- Each zone can only be in one segment
- Segment order within a block is 1-based (starts from 1, not 0)
- Sectors start from 1001 (first segment of first block gets sector = 1001)
- SECTOR_MULTIPLIER = 1000 (allows up to 1000 segments per block)

