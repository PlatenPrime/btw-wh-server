# API Documentation - Blocks Module

## Overview

The Blocks module provides comprehensive management of blocks that contain segments, which in turn contain zones. Blocks are used to organize zones through segments and automatically calculate zone sectors based on block positions and segment positions within blocks.

**Base URL:** `/api/blocks`  
**Authentication:** Bearer Token required  
**Authorization:** ADMIN role required for all operations

**Note:** Segments are managed through a separate module. See [Segments Documentation](../segs/SEGS_FRONTEND_DOCUMENTATION.md) for segment-specific endpoints.

## Data Models

### Block Interface

```typescript
interface IBlock {
  _id: string; // MongoDB ObjectId
  title: string; // Block name (unique)
  order: number; // Position in the blocks list (for sector calculation)
  segs: string[]; // Array of Segment ObjectIds (references)
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last update timestamp
}
```

### Zone Interface (Updated)

```typescript
interface IZone {
  _id: string; // MongoDB ObjectId
  title: string; // Zone identifier (e.g., "42-5-2")
  bar: number; // Barcode number (e.g., 420502)
  sector: number; // Calculated sector (same as segment sector)
  seg?: {
    id: string; // Segment ObjectId
    title?: string; // Optional cached segment title
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Field Descriptions

**Block:**

- `title`: Unique block identifier
- `order`: Numeric position for sector calculation (1-based, starts from 1)
- `segs`: Array of Segment ObjectIds (references to separate Seg collection)
- `_id`: MongoDB ObjectId

**Zone (updated fields):**

- `seg`: Optional reference to the segment containing this zone
  - `id`: Segment ObjectId
  - `title`: Optional cached segment title
- `sector`: Calculated value (same as segment sector)
- **Removed:** `block` and `order` fields

**Note:** For detailed segment information, use the Segments API endpoints. See [Segments Documentation](../segs/SEGS_FRONTEND_DOCUMENTATION.md).

## Sector Calculation Logic

The sector for a segment (and all its zones) is calculated using the following formula:

```
sector = blockOrder * SECTOR_MULTIPLIER + segOrder
```

Where:

- `SECTOR_MULTIPLIER = 1000` (constant for separating sectors between blocks)
- `blockOrder`: Position of the block in the sorted blocks list (1-based, starts from 1)
- `segOrder`: Position of the segment within its block (1-based, starts from 1)

**Important:** Both blocks and segments start numbering from 1, not 0.

**Examples:**

- Block 1, Segment 1: `sector = 1 * 1000 + 1 = 1001`
- Block 1, Segment 2: `sector = 1 * 1000 + 2 = 1002`
- Block 4, Segment 1: `sector = 4 * 1000 + 1 = 4001`
- Block 4, Segment 5: `sector = 4 * 1000 + 5 = 4005`

**Important:**

- All zones in a segment receive the same sector value
- Zones without a segment always have `sector = 0`
- Sectors are **NOT** automatically recalculated when block/segment positions change
- Use the dedicated `/recalculate-zones-sectors` endpoint to recalculate sectors when needed

## API Endpoints

### 1. Create Block

**POST** `/api/blocks/`

Creates a new block with automatic order assignment. Block is created with an empty `segs` array.

#### Request Body

```typescript
{
  title: string; // Required, unique block identifier
}
```

#### Validation Rules

- `title`: Required, must be unique, minimum 1 character
- `order`: Automatically assigned, starts from 1 (not 0)
- `segs`: Automatically initialized as empty array

#### Example Request

```typescript
const response = await fetch("/api/blocks/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    title: "Block A",
  }),
});
```

#### Example Response

```typescript
{
  message: "Block created successfully",
  data: {
    _id: "507f1f77bcf86cd799439011",
    title: "Block A",
    order: 1,
    segs: [],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**

- `201`: Block created successfully
- `400`: Validation error
- `409`: Block with this title already exists
- `500`: Server error

### 2. Get All Blocks

**GET** `/api/blocks/`

Retrieves all blocks sorted by order (ascending). The `segs` field contains an array of Segment ObjectIds.

#### Example Request

```typescript
const response = await fetch("/api/blocks/", {
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
  message: "Blocks retrieved successfully",
  data: [
    {
      _id: "507f1f77bcf86cd799439011",
      title: "Block A",
      order: 1,
      segs: [
        "507f1f77bcf86cd799439021",
        "507f1f77bcf86cd799439022"
      ],
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Note:** To get detailed segment information, use `GET /api/segs/by-block/:blockId` or `GET /api/segs/:id`.

**Response when no blocks exist:**

```typescript
{
  exists: false,
  message: "Blocks retrieved successfully",
  data: []
}
```

**Status Codes:**

- `200`: Success (always returns 200, check `exists` flag)
- `500`: Server error

### 3. Get Block by ID

**GET** `/api/blocks/:id`

Retrieves a single block by its ID. The `segs` field contains an array of Segment ObjectIds.

#### Path Parameters

- `id`: Block ObjectId (required)

#### Example Request

```typescript
const blockId = "507f1f77bcf86cd799439011";
const response = await fetch(`/api/blocks/${blockId}`, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

#### Example Response (Block Found)

```typescript
{
  exists: true,
  message: "Block retrieved successfully",
  data: {
    _id: "507f1f77bcf86cd799439011",
    title: "Block A",
    order: 1,
    segs: [
      "507f1f77bcf86cd799439021",
      "507f1f77bcf86cd799439022"
    ],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  }
}
```

**Note:** To get detailed segment information, use `GET /api/segs/by-block/:blockId`.

#### Example Response (Block Not Found)

```typescript
{
  exists: false,
  message: "Block not found",
  data: null
}
```

**Status Codes:**

- `200`: Success (always returns 200, check `exists` flag)
- `400`: Invalid block ID format
- `500`: Server error

### 4. Update Block

**PUT** `/api/blocks/:id`

Updates a block. All fields are optional. Can update title, order, and the list of segment references.

#### Path Parameters

- `id`: Block ObjectId (required)

#### Request Body

```typescript
{
  title?: string; // Optional: Update block title
  order?: number; // Optional: Update block position
  segs?: string[]; // Optional: Update list of Segment ObjectIds
}
```

#### Validation Rules

- `title`: Optional, must be unique if provided
- `order`: Optional, must be at least 1 (1-based numbering)
- `segs`: Optional array of Segment ObjectIds
  - All segments must exist
  - All segments must belong to this block

#### Example Request

```typescript
const blockId = "507f1f77bcf86cd799439011";
const response = await fetch(`/api/blocks/${blockId}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    title: "Updated Block A",
    order: 1,
    segs: [
      "507f1f77bcf86cd799439021",
      "507f1f77bcf86cd799439022",
      "507f1f77bcf86cd799439023", // New segment added
    ],
  }),
});
```

#### Example Response

```typescript
{
  message: "Block updated successfully",
  data: {
    _id: "507f1f77bcf86cd799439011",
    title: "Updated Block A",
    order: 1,
    segs: [
      "507f1f77bcf86cd799439021",
      "507f1f77bcf86cd799439022",
      "507f1f77bcf86cd799439023"
    ],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T01:00:00.000Z"
  }
}
```

**Important Notes:**

- Sectors are **NOT** automatically recalculated when `order` or `segs` are updated
- Segments not included in the `segs` array remain in the database but are removed from the block's reference list
- To create/update/delete segments, use the Segments API endpoints
- Use `/recalculate-zones-sectors` endpoint to recalculate sectors after updating positions

**Status Codes:**

- `200`: Block updated successfully
- `400`: Validation error
- `404`: Block not found or one or more segments not found
- `409`: Block with this title already exists
- `500`: Server error

### 5. Rename Block

**PATCH** `/api/blocks/:id/rename`

Renames a block by updating only its title field. This is a specialized endpoint for renaming operations.

#### Path Parameters

- `id`: Block ObjectId (required)

#### Request Body

```typescript
{
  title: string; // Required: new block title (must be unique)
}
```

#### Validation Rules

- `title`: Required, must be unique, minimum 1 character

#### Example Request

```typescript
const blockId = "507f1f77bcf86cd799439011";
const response = await fetch(`/api/blocks/${blockId}/rename`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    title: "Renamed Block A",
  }),
});
```

#### Example Response

```typescript
{
  message: "Block renamed successfully",
  data: {
    _id: "507f1f77bcf86cd799439011",
    title: "Renamed Block A",
    order: 1,
    segs: [
      "507f1f77bcf86cd799439021",
      "507f1f77bcf86cd799439022"
    ],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T01:00:00.000Z"
  }
}
```

**Status Codes:**

- `200`: Block renamed successfully
- `400`: Validation error or invalid block ID format
- `404`: Block not found
- `409`: Block with this title already exists
- `500`: Server error

### 6. Delete Block

**DELETE** `/api/blocks/:id`

Deletes a block and removes all associated segments. All zones in those segments will have their `seg` field unset and `sector = 0`.

#### Path Parameters

- `id`: Block ObjectId (required)

#### Example Request

```typescript
const blockId = "507f1f77bcf86cd799439011";
const response = await fetch(`/api/blocks/${blockId}`, {
  method: "DELETE",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

#### Example Response

```typescript
{
  message: "Block deleted successfully",
  data: {
    _id: "507f1f77bcf86cd799439011",
    title: "Block A",
    order: 1,
    segs: ["507f1f77bcf86cd799439021", "507f1f77bcf86cd799439022"],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  }
}
```

**Important Notes:**

- All segments associated with this block are deleted
- All zones in those segments will have their `seg` field unset and `sector = 0`
- Sectors are **NOT** automatically recalculated after deletion
- Use `/recalculate-zones-sectors` endpoint to recalculate sectors after deletion if needed

**Status Codes:**

- `200`: Block deleted successfully
- `400`: Invalid block ID format
- `404`: Block not found
- `500`: Server error

### 7. Reset Zones Sectors (One-time)

**POST** `/api/blocks/reset-zones-sectors`

Sets `sector = 0` for all zones. This is a one-time utility endpoint for initialization.

#### Example Request

```typescript
const response = await fetch("/api/blocks/reset-zones-sectors", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

#### Example Response

```typescript
{
  message: "Zones sectors reset successfully",
  data: {
    matchedCount: 150,
    modifiedCount: 150
  }
}
```

**Status Codes:**

- `200`: Sectors reset successfully
- `500`: Server error

### 7. Recalculate Zones Sectors

**POST** `/api/blocks/recalculate-zones-sectors`

Recalculates sectors for all zones based on current block and segment positions. This is a resource-intensive operation and should be called explicitly when needed.

#### Example Request

```typescript
const response = await fetch("/api/blocks/recalculate-zones-sectors", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

#### Example Response

```typescript
{
  message: "Zones sectors recalculated successfully",
  data: {
    updatedZones: 150,
    updatedSegs: 25,
    blocksProcessed: 5
  }
}
```

**Status Codes:**

- `200`: Sectors recalculated successfully
- `500`: Server error

**Formula:**

```
sector = blockOrder * 1000 + segOrder
```

Where:

- `blockOrder`: Position of the block (starts from 1)
- `segOrder`: Position of the segment within the block (starts from 1)

**Examples:**

- Block 1, Segment 1: `sector = 1 * 1000 + 1 = 1001`
- Block 1, Segment 2: `sector = 1 * 1000 + 2 = 1002`
- Block 4, Segment 1: `sector = 4 * 1000 + 1 = 4001`

Zones without a segment receive `sector = 0`.

### 9. Bulk Upsert Blocks

**POST** `/api/blocks/upsert`

Creates or updates multiple blocks in a single request. Existing blocks are matched by `_id`. If `_id` is omitted, a new block is created with a generated ObjectId. This endpoint is ideal for spreadsheets or drag-and-drop editors where the entire list of blocks needs to be synchronized at once.

#### Request Body

```typescript
[
  {
    _id?: string; // Optional: existing block ObjectId
    title: string; // Required: unique title
    order: number; // Required: >= 1
    segs?: string[]; // Optional: array of segment ObjectIds that already belong to this block
  }
]
```

#### Validation Rules

- Each entry must contain a title and order.
- Titles must be unique within the payload (case-insensitive) and the database.
- When `segs` is provided, every segment id must already exist and belong to the same block (new blocks should omit `segs`).
- Blocks cannot share the same `_id` within the payload.

#### Example Request

```typescript
await fetch("/api/blocks/upsert", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify([
    { title: "Block Alpha", order: 1 },
    { _id: existingBlockId, title: "Block Beta (renamed)", order: 2 },
  ]),
});
```

#### Example Response

```typescript
{
  message: "Blocks upsert completed",
  data: {
    bulkResult: {
      matchedCount: number;
      modifiedCount: number;
      upsertedCount: number;
    },
    updatedBlocks: IBlock[];
  }
}
```

#### Notes

- This endpoint does **not** delete blocks missing from the payload.
- Segment metadata (`blockData.title`) is kept in sync automatically after the upsert.
- Combine this endpoint with `/api/segs/upsert` to keep blocks and segments updated in lockstep.

## Frontend Integration

### TypeScript Types

```typescript
// Block types
interface Block {
  _id: string;
  title: string;
  order: number;
  segs: string[]; // Array of Segment ObjectIds
  createdAt: string;
  updatedAt: string;
}

interface CreateBlockInput {
  title: string;
}

interface UpdateBlockInput {
  title?: string;
  order?: number;
  segs?: string[]; // Array of Segment ObjectIds
}

interface RenameBlockInput {
  title: string; // Required: new block title
}

// Zone types (updated)
interface Zone {
  _id: string;
  title: string;
  bar: number;
  sector: number;
  seg?: {
    id: string;
    title?: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### TanStack Query Integration

#### Setup

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = "/api/blocks";
const SEGS_API_BASE_URL = "/api/segs";
```

#### Get All Blocks

```typescript
const useBlocks = () => {
  return useQuery({
    queryKey: ["blocks"],
    queryFn: async () => {
      const response = await fetch(API_BASE_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch blocks");
      const data = await response.json();
      if (!data.exists) {
        return [];
      }
      return data.data as Block[];
    },
  });
};
```

#### Get Segments for a Block

```typescript
const useSegsByBlock = (blockId: string) => {
  return useQuery({
    queryKey: ["segs", "block", blockId],
    queryFn: async () => {
      const response = await fetch(`${SEGS_API_BASE_URL}/by-block/${blockId}`, {
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

#### Create Block

```typescript
const useCreateBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBlockInput) => {
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
        throw new Error(error.message || "Failed to create block");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocks"] });
    },
  });
};
```

#### Update Block

```typescript
const useUpdateBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateBlockInput;
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
        throw new Error(error.message || "Failed to update block");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocks"] });
      queryClient.invalidateQueries({ queryKey: ["segs"] });
    },
  });
};
```

#### Rename Block

```typescript
const useRenameBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
    }: {
      id: string;
      title: string;
    }) => {
      const response = await fetch(`${API_BASE_URL}/${id}/rename`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to rename block");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocks"] });
      queryClient.invalidateQueries({ queryKey: ["segs"] });
    },
  });
};
```

#### Delete Block

```typescript
const useDeleteBlock = () => {
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
        throw new Error(error.message || "Failed to delete block");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocks"] });
      queryClient.invalidateQueries({ queryKey: ["segs"] });
      queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
  });
};
```

## Drag & Drop Implementation

### Recommended Library

We recommend using **@dnd-kit/core** for drag and drop functionality, as it's modern, accessible, and works well with React.

### Installation

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Example: Draggable Blocks List

```typescript
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useBlocks, useUpdateBlock } from "./hooks/useBlocks";

const BlocksList = () => {
  const { data: blocks, isLoading } = useBlocks();
  const updateBlock = useUpdateBlock();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b._id === active.id);
      const newIndex = blocks.findIndex((b) => b._id === over.id);

      const newOrder = arrayMove(blocks, oldIndex, newIndex);

      // Update all affected blocks
      newOrder.forEach((block, index) => {
        if (block.order !== index + 1) {
          updateBlock.mutate({
            id: block._id,
            data: { order: index + 1 },
          });
        }
      });
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={blocks.map((b) => b._id)}
        strategy={verticalListSortingStrategy}
      >
        {blocks.map((block) => (
          <SortableBlockItem key={block._id} block={block} />
        ))}
      </SortableContext>
    </DndContext>
  );
};
```

#### Recalculate Zones Sectors

```typescript
const useRecalculateZonesSectors = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/recalculate-zones-sectors`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to recalculate sectors");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      queryClient.invalidateQueries({ queryKey: ["segs"] });
      queryClient.invalidateQueries({ queryKey: ["blocks"] });
    },
  });
};
```

## Best Practices

1. **Segment Management**: Use the Segments API (`/api/segs`) for creating, updating, and deleting segments
2. **Getting Segment Details**: Use `GET /api/segs/by-block/:blockId` to get all segments for a block
3. **Getting Zones**: Use `GET /api/segs/:segId/zones` to get all zones for a specific segment
4. **Explicit Sector Recalculation**: Call `recalculate-zones-sectors` endpoint only when needed, not after every position change
5. **Batch Updates**: Update multiple block/segment positions first, then call recalculation once
6. **Error Handling**: Always handle errors and show user-friendly messages
7. **Loading States**: Show loading indicators during sector recalculation (it's a resource-intensive operation)
8. **Cache Management**: Invalidate zones, segs, and blocks queries after sector recalculation
9. **Check exists flag**: Always check the `exists` flag in get responses instead of relying on HTTP status codes
10. **Bulk sync**: Use `POST /api/blocks/upsert` to persist drag-and-drop or spreadsheet edits in one call instead of chaining multiple `PUT /:id` requests.

## Error Handling

All endpoints return consistent error responses:

```typescript
{
  message: string; // Error message
  errors?: Array<{ // Validation errors (if applicable)
    path: string[];
    message: string;
  }>;
  duplicateFields?: string[]; // Fields that caused duplicate error
}
```

Handle errors appropriately:

```typescript
try {
  await createBlock.mutateAsync({ title: "New Block" });
} catch (error) {
  if (error.message.includes("already exists")) {
    // Show duplicate error
  } else {
    // Show generic error
  }
}
```

## Notes

- All operations require ADMIN role
- Sectors are **NOT** automatically recalculated - use `/recalculate-zones-sectors` endpoint explicitly
- Zones can exist without segments (sector = 0)
- Block order is 1-based (starts from 1, not 0)
- Segment order within a block is 1-based (starts from 1, not 0)
- Sectors start from 1001 (first segment of first block gets sector = 1001)
- SECTOR_MULTIPLIER = 1000 (allows up to 1000 segments per block)
- Each zone can only be in one segment
- Each segment must contain at least 1 zone
- **Segments are managed through a separate API** - see [Segments Documentation](../segs/SEGS_FRONTEND_DOCUMENTATION.md)

---

# Изменения в API (Changes)

## Обзор изменений

В модуле блоков были внесены кардинальные изменения в структуру данных и логику работы.

### 1. Новая структура данных: Block → Seg → Zone

**Было:** Block → Zone (зоны напрямую в блоке с order)

**Стало:** Block → Seg → Zone (сегменты как промежуточный уровень)

### 2. Сегменты как отдельная коллекция

**Важное изменение:** Сегменты теперь являются отдельной коллекцией (как Pallet отдельно от Row), а не subdocuments в блоке.

**Преимущества:**

- Отдельные CRUD эндпоинты для сегментов
- Возможность получить зоны конкретного сегмента через `GET /api/segs/:segId/zones`
- Удобная работа с отдельными сегментами
- Отдельная страница для каждого сегмента

### 3. Изменения в моделях данных

**Block:**

- Поле `segs` теперь содержит массив ObjectId (ссылки на сегменты), а не subdocuments
- Для получения детальной информации о сегментах используйте `GET /api/segs/by-block/:blockId`

**Zone:**

- Удалено поле `block` (заменено на `seg`)
- Удалено поле `order` (порядок теперь определяется через сегмент)
- Добавлено поле `seg?: { id, title? }` (ссылка на сегмент)

**Seg (новая коллекция):**

- Отдельная коллекция с полями: `block`, `blockData`, `sector`, `order`, `zones[]`
- См. [Segments Documentation](../segs/SEGS_FRONTEND_DOCUMENTATION.md) для деталей

### 4. Изменение формулы расчета секторов

**Было:** `sector = blockOrder * 1000 + zoneOrder - 1`

**Стало:** `sector = blockOrder * 1000 + segOrder`

**Примеры:**

- Блок 1, Сегмент 1: `sector = 1 * 1000 + 1 = 1001` (было: 1000)
- Блок 4, Сегмент 1: `sector = 4 * 1000 + 1 = 4001` (было: 4000)

**Важно:** Все зоны в сегменте получают одинаковый сектор.

### 5. Новые эндпоинты для сегментов

**Базовый URL:** `/api/segs`

- `POST /api/segs` - создать сегмент
- `GET /api/segs` - получить все сегменты
- `GET /api/segs/:id` - получить сегмент по ID
- `GET /api/segs/by-block/:blockId` - получить сегменты блока
- `GET /api/segs/:segId/zones` - получить зоны сегмента (для отдельной страницы)
- `PUT /api/segs/:id` - обновить сегмент
- `DELETE /api/segs/:id` - удалить сегмент

См. [Segments Documentation](../segs/SEGS_FRONTEND_DOCUMENTATION.md) для полного описания.

### 6. Изменение API для обновления блока

**Было:**

```typescript
{
  segs?: Array<{
    _id?: string;
    order: number;
    zones: string[];
  }>;
}
```

**Стало:**

```typescript
{
  segs?: string[]; // Массив Segment ObjectIds
}
```

**Важно:** Для создания/обновления/удаления сегментов используйте эндпоинты Segments API.

### 7. Удаление автоматического пересчета секторов

**Было:** При обновлении порядка блоков или сегментов сектора автоматически пересчитывались.

**Стало:** Пересчет секторов больше не происходит автоматически. Контроллеры `update-block` и `delete-block` теперь только обновляют данные, без пересчета секторов.

**Причина:** Пересчет секторов - это ресурсоемкая операция, которая не должна выполняться при каждом изменении позиций. Теперь фронтенд может обновлять порядок блоков и сегментов быстро, а пересчет секторов выполнять только когда это действительно необходимо.

### 8. Добавлен новый контроллер пересчета секторов

**Новый эндпоинт:** `POST /api/blocks/recalculate-zones-sectors`

Этот эндпоинт позволяет явно запустить пересчет секторов всех зон на основе текущих позиций блоков и сегментов. Используйте его после завершения всех изменений позиций, когда нужно обновить сектора.

### 9. Добавлен флаг `exists` в контроллеры получения

**Измененные эндпоинты:**

- `GET /api/blocks/` (getAllBlocks)
- `GET /api/blocks/:id` (getBlockById)

**Было:** При отсутствии данных возвращался HTTP статус `404`.

**Стало:** Всегда возвращается HTTP статус `200`, но в ответе присутствует флаг `exists`:

- `exists: true` - данные найдены
- `exists: false` - данные не найдены

**Причина:** Унификация API и упрощение обработки на фронтенде - не нужно обрабатывать 404 ошибки, достаточно проверить флаг `exists`.

## Миграция данных

**Важно:** Миграция существующих данных не требуется - начинаем с чистого листа.

## Рекомендации для фронтенда

1. **Управление сегментами:** Используйте Segments API (`/api/segs`) для всех операций с сегментами
2. **Отдельная страница сегмента:** Используйте `GET /api/segs/:segId/zones` для получения зон на странице сегмента
3. **Форма создания сегмента:** Используйте форму с множественным выбором зон (аналогично текущей форме добавления зон в блок)
4. **Drag & Drop:** Перемещайте сегменты через Segments API
5. **Отображение:** Показывайте структуру Block → Seg → Zone в иерархическом виде
6. **Валидация:** Проверяйте, что каждая зона выбрана только один раз при создании/обновлении сегментов
7. **Пересчет секторов:** Вызывайте `/api/blocks/recalculate-zones-sectors` после завершения всех изменений позиций

---

# Контракты API (API Contracts)

## Полное описание всех эндпоинтов

### 1. Create Block

**Метод:** `POST`  
**Путь:** `/api/blocks/`  
**Требования:** Bearer Token, роль ADMIN

#### Что принимает сервер (Request)

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```typescript
{
  title: string; // Обязательно, минимум 1 символ, уникальное значение
}
```

#### Что возвращает сервер (Response)

**Успешный ответ (201):**

```typescript
{
  message: "Block created successfully",
  data: {
    _id: string; // MongoDB ObjectId
    title: string;
    order: number; // Автоматически присваивается
    segs: []; // Пустой массив сегментов
    createdAt: string; // ISO 8601 дата
    updatedAt: string; // ISO 8601 дата
  }
}
```

**Ошибки:**

- `400`: Ошибка валидации - неверный формат данных
- `409`: Блок с таким title уже существует
- `500`: Ошибка сервера

---

### 2. Get All Blocks

**Метод:** `GET`  
**Путь:** `/api/blocks/`  
**Требования:** Bearer Token, роль ADMIN

#### Что принимает сервер (Request)

**Headers:**

```
Authorization: Bearer <token>
```

**Query параметры:** отсутствуют

#### Что возвращает сервер (Response)

**Успешный ответ (200) - есть блоки:**

```typescript
{
  exists: true,
  message: "Blocks retrieved successfully",
  data: Array<{
    _id: string;
    title: string;
    order: number;
    segs: string[]; // Массив Segment ObjectIds
    createdAt: string;
    updatedAt: string;
  }>
}
```

**Успешный ответ (200) - нет блоков:**

```typescript
{
  exists: false,
  message: "Blocks retrieved successfully",
  data: []
}
```

**Ошибки:**

- `500`: Ошибка сервера

**Важно:** Всегда возвращает статус `200`. Проверяйте флаг `exists` для определения наличия данных.

---

### 3. Get Block by ID

**Метод:** `GET`  
**Путь:** `/api/blocks/:id`  
**Требования:** Bearer Token, роль ADMIN

#### Что принимает сервер (Request)

**Headers:**

```
Authorization: Bearer <token>
```

**Path параметры:**

- `id`: string - MongoDB ObjectId блока (обязательно)

#### Что возвращает сервер (Response)

**Успешный ответ (200) - блок найден:**

```typescript
{
  exists: true,
  message: "Block retrieved successfully",
  data: {
    _id: string;
    title: string;
    order: number;
    segs: string[]; // Массив Segment ObjectIds
    createdAt: string;
    updatedAt: string;
  }
}
```

**Успешный ответ (200) - блок не найден:**

```typescript
{
  exists: false,
  message: "Block not found",
  data: null
}
```

**Ошибки:**

- `400`: Неверный формат ID (не валидный ObjectId)
- `500`: Ошибка сервера

**Важно:** Всегда возвращает статус `200`. Проверяйте флаг `exists` для определения наличия блока.

---

### 4. Update Block

**Метод:** `PUT`  
**Путь:** `/api/blocks/:id`  
**Требования:** Bearer Token, роль ADMIN

#### Что принимает сервер (Request)

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path параметры:**

- `id`: string - MongoDB ObjectId блока (обязательно)

**Body (все поля опциональны):**

```typescript
{
  title?: string; // Опционально, минимум 1 символ, уникальное значение
  order?: number; // Опционально, неотрицательное целое число
  segs?: string[]; // Опционально, массив Segment ObjectIds
}
```

#### Что возвращает сервер (Response)

**Успешный ответ (200):**

```typescript
{
  message: "Block updated successfully",
  data: {
    _id: string;
    title: string;
    order: number;
    segs: string[]; // Массив Segment ObjectIds
    createdAt: string;
    updatedAt: string;
  }
}
```

**Ошибки:**

- `400`: Ошибка валидации - неверный формат данных или ID
- `404`: Блок не найден или одна/несколько сегментов не найдены
- `409`: Блок с таким title уже существует
- `500`: Ошибка сервера

**Важно:**

- Сектора зон **НЕ** пересчитываются автоматически
- Для создания/обновления/удаления сегментов используйте Segments API
- Все сегменты в массиве `segs` должны существовать и принадлежать этому блоку

---

### 5. Rename Block

**Метод:** `PATCH`  
**Путь:** `/api/blocks/:id/rename`  
**Требования:** Bearer Token, роль ADMIN

#### Что принимает сервер (Request)

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path параметры:**

- `id`: string - MongoDB ObjectId блока (обязательно)

**Body:**

```typescript
{
  title: string; // Обязательно, минимум 1 символ, уникальное значение
}
```

#### Что возвращает сервер (Response)

**Успешный ответ (200):**

```typescript
{
  message: "Block renamed successfully",
  data: {
    _id: string;
    title: string; // Новое название
    order: number;
    segs: string[]; // Массив Segment ObjectIds
    createdAt: string;
    updatedAt: string;
  }
}
```

**Ошибки:**

- `400`: Ошибка валидации - неверный формат данных или ID
- `404`: Блок не найден
- `409`: Блок с таким title уже существует
- `500`: Ошибка сервера

**Важно:**

- Обновляется только поле `title`
- Сектора зон **НЕ** пересчитываются автоматически
- Новое название должно быть уникальным

---

### 6. Delete Block

**Метод:** `DELETE`  
**Путь:** `/api/blocks/:id`  
**Требования:** Bearer Token, роль ADMIN

#### Что принимает сервер (Request)

**Headers:**

```
Authorization: Bearer <token>
```

**Path параметры:**

- `id`: string - MongoDB ObjectId блока (обязательно)

#### Что возвращает сервер (Response)

**Успешный ответ (200):**

```typescript
{
  message: "Block deleted successfully",
  data: {
    _id: string;
    title: string;
    order: number;
    segs: string[];
    createdAt: string;
    updatedAt: string;
  }
}
```

**Ошибки:**

- `400`: Неверный формат ID
- `404`: Блок не найден
- `500`: Ошибка сервера

**Важно:**

- Все сегменты, связанные с этим блоком, удаляются
- Все зоны, связанные с этими сегментами, теряют связь с сегментом (поле `seg` удаляется, `sector = 0`)
- Сектора зон **НЕ** пересчитываются автоматически

---

### 7. Reset Zones Sectors

**Метод:** `POST`  
**Путь:** `/api/blocks/reset-zones-sectors`  
**Требования:** Bearer Token, роль ADMIN

#### Что принимает сервер (Request)

**Headers:**

```
Authorization: Bearer <token>
```

**Body:** отсутствует

#### Что возвращает сервер (Response)

**Успешный ответ (200):**

```typescript
{
  message: "Zones sectors reset successfully",
  data: {
    matchedCount: number; // Количество найденных зон
    modifiedCount: number; // Количество обновленных зон
  }
}
```

**Ошибки:**

- `500`: Ошибка сервера

**Назначение:** Утилитарный эндпоинт для инициализации - устанавливает `sector = 0` для всех зон.

---

### 8. Recalculate Zones Sectors

**Метод:** `POST`  
**Путь:** `/api/blocks/recalculate-zones-sectors`  
**Требования:** Bearer Token, роль ADMIN

#### Что принимает сервер (Request)

**Headers:**

```
Authorization: Bearer <token>
```

**Body:** отсутствует

#### Что возвращает сервер (Response)

**Успешный ответ (200):**

```typescript
{
  message: "Zones sectors recalculated successfully",
  data: {
    updatedZones: number; // Количество обновленных зон
    updatedSegs: number; // Количество обновленных сегментов
    blocksProcessed: number; // Количество обработанных блоков
  }
}
```

**Ошибки:**

- `500`: Ошибка сервера

**Назначение:** Пересчитывает сектора всех зон на основе текущих позиций блоков и сегментов. Используйте этот эндпоинт после завершения всех изменений позиций, когда нужно обновить сектора.

**Формула расчета:**

```
sector = blockOrder * 1000 + segOrder
```

Где:

- `blockOrder`: Порядок блока (начинается с 1)
- `segOrder`: Порядок сегмента в блоке (начинается с 1)

**Примеры:**

- Блок 1, Сегмент 1: `sector = 1 * 1000 + 1 = 1001`
- Блок 1, Сегмент 2: `sector = 1 * 1000 + 2 = 1002`
- Блок 4, Сегмент 1: `sector = 4 * 1000 + 1 = 4001`

Зоны без сегмента получают `sector = 0`.

---

# Связанная документация

- [Segments API Documentation](../segs/SEGS_FRONTEND_DOCUMENTATION.md) - Полное описание API для работы с сегментами
