# API Documentation - Blocks Module

## Overview

The Blocks module provides comprehensive management of blocks that contain zones. Blocks are used to organize zones and automatically calculate zone sectors based on block positions and zone positions within blocks.

**Base URL:** `/api/blocks`  
**Authentication:** Bearer Token required  
**Authorization:** ADMIN role required for all operations

## Data Models

### Block Interface

```typescript
interface IBlock {
  _id: string; // MongoDB ObjectId
  title: string; // Block name (unique)
  order: number; // Position in the blocks list (for sector calculation)
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
  sector: number; // Calculated sector based on block and zone positions
  block?: {
    id: string; // Block ObjectId
    title: string; // Block title
  };
  order?: number; // Position within the block (optional, if zone is in a block)
  createdAt: Date;
  updatedAt: Date;
}
```

### Field Descriptions

**Block:**
- `title`: Unique block identifier
- `order`: Numeric position for sector calculation (0-based)
- `_id`: MongoDB ObjectId

**Zone (updated fields):**
- `block`: Optional reference to the block containing this zone
  - `id`: Block ObjectId
  - `title`: Block title (cached for performance)
- `order`: Optional position within the block (0-based)
- `sector`: Calculated value based on formula: `blockOrder * 1000 + zoneOrder`

## Sector Calculation Logic

The sector for a zone is calculated using the following formula:

```
sector = blockOrder * SECTOR_MULTIPLIER + zoneOrder
```

Where:
- `SECTOR_MULTIPLIER = 1000` (constant for separating sectors between blocks)
- `blockOrder`: Position of the block in the sorted blocks list (0-based)
- `zoneOrder`: Position of the zone within its block (0-based)

**Examples:**
- Block 0, Zone 0: `sector = 0 * 1000 + 0 = 0`
- Block 0, Zone 5: `sector = 0 * 1000 + 5 = 5`
- Block 1, Zone 0: `sector = 1 * 1000 + 0 = 1000`
- Block 2, Zone 10: `sector = 2 * 1000 + 10 = 2010`

**Important:**
- Zones without a block always have `sector = 0`
- Sectors are automatically recalculated when:
  - Block order changes
  - Zone order within a block changes
  - Zones are moved between blocks
  - A block is deleted

## API Endpoints

### 1. Create Block

**POST** `/api/blocks/`

Creates a new block with automatic order assignment.

#### Request Body

```typescript
{
  title: string; // Required, unique block identifier
}
```

#### Validation Rules

- `title`: Required, must be unique, minimum 1 character

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
    order: 0,
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

Retrieves all blocks sorted by order (ascending).

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
  message: "Blocks retrieved successfully",
  data: [
    {
      _id: "507f1f77bcf86cd799439011",
      title: "Block A",
      order: 0,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    },
    {
      _id: "507f1f77bcf86cd799439012",
      title: "Block B",
      order: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200`: Success
- `500`: Server error

### 3. Get Block by ID

**GET** `/api/blocks/:id`

Retrieves a single block by its ID.

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

#### Example Response

```typescript
{
  message: "Block retrieved successfully",
  data: {
    _id: "507f1f77bcf86cd799439011",
    title: "Block A",
    order: 0,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid block ID format
- `404`: Block not found
- `500`: Server error

### 4. Update Block

**PUT** `/api/blocks/:id`

Updates a block. All fields are optional.

#### Path Parameters

- `id`: Block ObjectId (required)

#### Request Body

```typescript
{
  title?: string; // Optional: Update block title
  order?: number; // Optional: Update block position
  zones?: Array<{ // Optional: Update list of zones in block
    zoneId: string; // Zone ObjectId
    order: number; // Position of zone within block (0-based)
  }>;
}
```

#### Validation Rules

- `title`: Optional, must be unique if provided
- `order`: Optional, must be non-negative integer
- `zones`: Optional array of zone updates
  - `zoneId`: Required, must be valid ObjectId
  - `order`: Required, must be non-negative integer

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
    zones: [
      { zoneId: "507f1f77bcf86cd799439021", order: 0 },
      { zoneId: "507f1f77bcf86cd799439022", order: 1 },
      { zoneId: "507f1f77bcf86cd799439023", order: 2 },
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
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T01:00:00.000Z"
  }
}
```

**Important Notes:**
- If `order` or `zones` are updated, all zone sectors are automatically recalculated
- Zones not included in the `zones` array will have their `block` and `order` fields unset
- All zones in the `zones` array must exist

**Status Codes:**
- `200`: Block updated successfully
- `400`: Validation error
- `404`: Block not found or one or more zones not found
- `409`: Block with this title already exists
- `500`: Server error

### 5. Delete Block

**DELETE** `/api/blocks/:id`

Deletes a block and removes block associations from all related zones.

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
    order: 0,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  }
}
```

**Important Notes:**
- All zones associated with this block will have their `block` and `order` fields unset
- All zone sectors are automatically recalculated after deletion

**Status Codes:**
- `200`: Block deleted successfully
- `400`: Invalid block ID format
- `404`: Block not found
- `500`: Server error

### 6. Reset Zones Sectors (One-time)

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

## Frontend Integration

### TypeScript Types

```typescript
// Block types
interface Block {
  _id: string;
  title: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateBlockInput {
  title: string;
}

interface UpdateBlockInput {
  title?: string;
  order?: number;
  zones?: Array<{
    zoneId: string;
    order: number;
  }>;
}

// Zone types (updated)
interface Zone {
  _id: string;
  title: string;
  bar: number;
  sector: number;
  block?: {
    id: string;
    title: string;
  };
  order?: number;
  createdAt: string;
  updatedAt: string;
}
```

### TanStack Query Integration

#### Setup

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = "/api/blocks";
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
      return data.data as Block[];
    },
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
      queryClient.invalidateQueries({ queryKey: ["zones"] }); // Invalidate zones to refresh sectors
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
      queryClient.invalidateQueries({ queryKey: ["zones"] }); // Sectors recalculated
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
      queryClient.invalidateQueries({ queryKey: ["zones"] }); // Sectors recalculated
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
        if (block.order !== index) {
          updateBlock.mutate({
            id: block._id,
            data: { order: index },
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

### Example: Draggable Zones within Block

```typescript
const BlockZonesList = ({ blockId }: { blockId: string }) => {
  const { data: zones } = useZonesByBlock(blockId);
  const updateBlock = useUpdateBlock();

  const handleZoneDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = zones.findIndex((z) => z._id === active.id);
      const newIndex = zones.findIndex((z) => z._id === over.id);

      const newOrder = arrayMove(zones, oldIndex, newIndex);

      // Update block with new zone order
      updateBlock.mutate({
        id: blockId,
        data: {
          zones: newOrder.map((zone, index) => ({
            zoneId: zone._id,
            order: index,
          })),
        },
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleZoneDragEnd}
    >
      <SortableContext
        items={zones.map((z) => z._id)}
        strategy={verticalListSortingStrategy}
      >
        {zones.map((zone) => (
          <SortableZoneItem key={zone._id} zone={zone} />
        ))}
      </SortableContext>
    </DndContext>
  );
};
```

## Best Practices

1. **Optimistic Updates**: Consider using optimistic updates for better UX when dragging blocks/zones
2. **Debouncing**: Debounce sector recalculation if multiple updates happen quickly
3. **Error Handling**: Always handle errors and show user-friendly messages
4. **Loading States**: Show loading indicators during sector recalculation
5. **Cache Management**: Invalidate both blocks and zones queries after updates that affect sectors

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
- Sectors are automatically recalculated when block/zone positions change
- Zones can exist without blocks (sector = 0)
- Block order is 0-based
- Zone order within a block is 0-based
- SECTOR_MULTIPLIER = 1000 (allows up to 1000 zones per block)

