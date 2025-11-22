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
- `order`: Numeric position for sector calculation (1-based, starts from 1)
- `_id`: MongoDB ObjectId

**Zone (updated fields):**
- `block`: Optional reference to the block containing this zone
  - `id`: Block ObjectId
  - `title`: Block title (cached for performance)
- `order`: Optional position within the block (1-based, starts from 1)
- `sector`: Calculated value based on formula: `blockOrder * 1000 + zoneOrder - 1`

## Sector Calculation Logic

The sector for a zone is calculated using the following formula:

```
sector = blockOrder * SECTOR_MULTIPLIER + zoneOrder - 1
```

Where:
- `SECTOR_MULTIPLIER = 1000` (constant for separating sectors between blocks)
- `blockOrder`: Position of the block in the sorted blocks list (1-based, starts from 1)
- `zoneOrder`: Position of the zone within its block (1-based, starts from 1)

**Important:** Both blocks and zones start numbering from 1, not 0. This ensures that sectors start from 1000.

**Examples:**
- Block 1, Zone 1: `sector = 1 * 1000 + 1 - 1 = 1000`
- Block 1, Zone 2: `sector = 1 * 1000 + 2 - 1 = 1001`
- Block 1, Zone 5: `sector = 1 * 1000 + 5 - 1 = 1004`
- Block 2, Zone 1: `sector = 2 * 1000 + 1 - 1 = 2000`
- Block 2, Zone 10: `sector = 2 * 1000 + 10 - 1 = 2009`

**Important:**
- Zones without a block always have `sector = 0`
- Sectors are **NOT** automatically recalculated when block/zone positions change
- Use the dedicated `/recalculate-zones-sectors` endpoint to recalculate sectors when needed

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
- `order`: Automatically assigned, starts from 1 (not 0)

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
  exists: true,
  message: "Blocks retrieved successfully",
  data: [
    {
      _id: "507f1f77bcf86cd799439011",
      title: "Block A",
      order: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    },
    {
      _id: "507f1f77bcf86cd799439012",
      title: "Block B",
      order: 2,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

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

#### Example Response (Block Found)

```typescript
{
  exists: true,
  message: "Block retrieved successfully",
  data: {
    _id: "507f1f77bcf86cd799439011",
    title: "Block A",
    order: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  }
}
```

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
    order: number; // Position of zone within block (1-based, starts from 1)
  }>;
}
```

#### Validation Rules

- `title`: Optional, must be unique if provided
- `order`: Optional, must be at least 1 (1-based numbering)
- `zones`: Optional array of zone updates
  - `zoneId`: Required, must be valid ObjectId
  - `order`: Required, must be at least 1 (1-based numbering)

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
      { zoneId: "507f1f77bcf86cd799439021", order: 1 },
      { zoneId: "507f1f77bcf86cd799439022", order: 2 },
      { zoneId: "507f1f77bcf86cd799439023", order: 3 },
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
- Sectors are **NOT** automatically recalculated when `order` or `zones` are updated
- Zones not included in the `zones` array will have their `block` and `order` fields unset
- All zones in the `zones` array must exist
- Use `/recalculate-zones-sectors` endpoint to recalculate sectors after updating positions

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
    order: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  }
}
```

**Important Notes:**
- All zones associated with this block will have their `block` and `order` fields unset
- Sectors are **NOT** automatically recalculated after deletion
- Use `/recalculate-zones-sectors` endpoint to recalculate sectors after deletion if needed

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

### 7. Recalculate Zones Sectors

**POST** `/api/blocks/recalculate-zones-sectors`

Recalculates sectors for all zones based on current block and zone positions. This is a resource-intensive operation and should be called explicitly when needed.

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
    blocksProcessed: 5
  }
}
```

**Status Codes:**
- `200`: Sectors recalculated successfully
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
      // Проверяем флаг exists
      if (!data.exists) {
        return [];
      }
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
      // Сектора не пересчитываются автоматически
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
      // Сектора не пересчитываются автоматически
      // Вызовите recalculateZonesSectors если нужно обновить сектора
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
      // Сектора не пересчитываются автоматически
      // Вызовите recalculateZonesSectors если нужно обновить сектора
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

#### Recalculate Zones Sectors

```typescript
const useRecalculateZonesSectors = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE_URL}/recalculate-zones-sectors`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to recalculate sectors");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] }); // Обновить зоны с новыми секторами
    },
  });
};
```

## Best Practices

1. **Optimistic Updates**: Consider using optimistic updates for better UX when dragging blocks/zones
2. **Explicit Sector Recalculation**: Call `recalculate-zones-sectors` endpoint only when needed, not after every position change
3. **Batch Updates**: Update multiple block/zone positions first, then call recalculation once
4. **Error Handling**: Always handle errors and show user-friendly messages
5. **Loading States**: Show loading indicators during sector recalculation (it's a resource-intensive operation)
6. **Cache Management**: Invalidate zones queries after sector recalculation
7. **Check exists flag**: Always check the `exists` flag in get responses instead of relying on HTTP status codes

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
- Zones can exist without blocks (sector = 0)
- Block order is 1-based (starts from 1, not 0)
- Zone order within a block is 1-based (starts from 1, not 0)
- Sectors start from 1000 (first zone of first block gets sector = 1000)
- SECTOR_MULTIPLIER = 1000 (allows up to 1000 zones per block)

---

# Изменения в API (Changes)

## Обзор изменений

В модуле блоков были внесены следующие изменения:

### 1. Удален автоматический пересчет секторов

**Было:** При обновлении порядка блоков (`order`) или порядка зон в блоке (`zones`) сектора всех зон автоматически пересчитывались.

**Стало:** Пересчет секторов больше не происходит автоматически. Контроллеры `update-block` и `delete-block` теперь только обновляют данные, без пересчета секторов.

**Причина:** Пересчет секторов - это ресурсоемкая операция, которая не должна выполняться при каждом изменении позиций. Теперь фронтенд может обновлять порядок блоков и зон быстро, а пересчет секторов выполнять только когда это действительно необходимо.

### 2. Добавлен новый контроллер пересчета секторов

**Новый эндпоинт:** `POST /api/blocks/recalculate-zones-sectors`

Этот эндпоинт позволяет явно запустить пересчет секторов всех зон на основе текущих позиций блоков и зон. Используйте его после завершения всех изменений позиций, когда нужно обновить сектора.

### 3. Добавлен флаг `exists` в контроллеры получения

**Измененные эндпоинты:**
- `GET /api/blocks/` (getAllBlocks)
- `GET /api/blocks/:id` (getBlockById)

**Было:** При отсутствии данных возвращался HTTP статус `404`.

**Стало:** Всегда возвращается HTTP статус `200`, но в ответе присутствует флаг `exists`:
- `exists: true` - данные найдены
- `exists: false` - данные не найдены

**Причина:** Унификация API и упрощение обработки на фронтенде - не нужно обрабатывать 404 ошибки, достаточно проверить флаг `exists`.

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
  zones?: Array<{
    zoneId: string; // Обязательно, валидный ObjectId
    order: number; // Обязательно, неотрицательное целое число
  }>;
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
    createdAt: string;
    updatedAt: string;
  }
}
```

**Ошибки:**
- `400`: Ошибка валидации - неверный формат данных или ID
- `404`: Блок не найден или одна/несколько зон не найдены
- `409`: Блок с таким title уже существует
- `500`: Ошибка сервера

**Важно:** 
- Сектора зон **НЕ** пересчитываются автоматически
- Зоны, не включенные в массив `zones`, теряют связь с блоком (поля `block` и `order` удаляются)
- Все зоны в массиве `zones` должны существовать

---

### 5. Delete Block

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
- Все зоны, связанные с этим блоком, теряют связь с блоком (поля `block` и `order` удаляются)
- Сектора зон **НЕ** пересчитываются автоматически

---

### 6. Reset Zones Sectors

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

### 7. Recalculate Zones Sectors

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
    blocksProcessed: number; // Количество обработанных блоков
  }
}
```

**Ошибки:**
- `500`: Ошибка сервера

**Назначение:** Пересчитывает сектора всех зон на основе текущих позиций блоков и зон. Используйте этот эндпоинт после завершения всех изменений позиций, когда нужно обновить сектора.

**Формула расчета:**
```
sector = blockOrder * 1000 + zoneOrder - 1
```

Где:
- `blockOrder`: Порядок блока (начинается с 1)
- `zoneOrder`: Порядок зоны в блоке (начинается с 1)

**Примеры:**
- Блок 1, Зона 1: `sector = 1 * 1000 + 1 - 1 = 1000`
- Блок 1, Зона 2: `sector = 1 * 1000 + 2 - 1 = 1001`
- Блок 2, Зона 1: `sector = 2 * 1000 + 1 - 1 = 2000`

Зоны без блока получают `sector = 0`.

---

# Изменения связанные с убиранием 404 ответа

## Обзор изменений

В контроллерах получения данных (`getAllBlocks` и `getBlockById`) была изменена логика обработки отсутствующих данных.

## Было (до изменений)

### Get Block by ID

**Когда блок не найден:**
```typescript
// HTTP Status: 404
{
  message: "Block not found",
  data: null
}
```

**Проблема:** Фронтенд должен был обрабатывать HTTP статус `404` как особый случай, что усложняло обработку ошибок.

### Get All Blocks

**Когда список пустой:**
```typescript
// HTTP Status: 200
{
  message: "Blocks retrieved successfully",
  data: []
}
```

**Примечание:** Этот эндпоинт уже возвращал `200`, но без флага `exists`.

## Стало (после изменений)

### Get Block by ID

**Когда блок не найден:**
```typescript
// HTTP Status: 200
{
  exists: false,
  message: "Block not found",
  data: null
}
```

**Когда блок найден:**
```typescript
// HTTP Status: 200
{
  exists: true,
  message: "Block retrieved successfully",
  data: {
    _id: "...",
    title: "...",
    // ... остальные поля
  }
}
```

### Get All Blocks

**Когда есть блоки:**
```typescript
// HTTP Status: 200
{
  exists: true,
  message: "Blocks retrieved successfully",
  data: [
    // ... массив блоков
  ]
}
```

**Когда список пустой:**
```typescript
// HTTP Status: 200
{
  exists: false,
  message: "Blocks retrieved successfully",
  data: []
}
```

## Преимущества изменений

1. **Упрощение обработки на фронтенде:** Не нужно обрабатывать HTTP статус `404` отдельно. Всегда проверяйте флаг `exists`.

2. **Единообразие API:** Оба эндпоинта получения данных теперь работают одинаково - всегда возвращают `200` с флагом `exists`.

3. **Меньше ошибок:** HTTP статус `200` означает успешный запрос, а наличие данных определяется флагом `exists`. Это предотвращает ситуации, когда HTTP клиент может интерпретировать `404` как сетевую ошибку.

## Примеры использования на фронтенде

### Get Block by ID

```typescript
const response = await fetch(`/api/blocks/${blockId}`, {
  headers: { Authorization: `Bearer ${token}` }
});

const result = await response.json();

if (result.exists) {
  // Блок найден, работаем с данными
  console.log("Block:", result.data);
} else {
  // Блок не найден
  console.log("Block not found");
}
```

### Get All Blocks

```typescript
const response = await fetch("/api/blocks/", {
  headers: { Authorization: `Bearer ${token}` }
});

const result = await response.json();

if (result.exists) {
  // Есть блоки
  console.log("Blocks:", result.data);
} else {
  // Нет блоков
  console.log("No blocks found");
}
```

## Обработка ошибок

**Важно:** HTTP статус `200` возвращается только при успешном выполнении запроса. Ошибки валидации и серверные ошибки по-прежнему возвращают соответствующие HTTP статусы:

- `400`: Ошибка валидации (например, неверный формат ID)
- `500`: Ошибка сервера

Эти ошибки обрабатываются как обычно, проверка флага `exists` не требуется.

