# Модуль Poses

## Описание модуля

Модуль `poses` решает задачи управления позициями товаров на складе. Позиции представляют собой конкретные единицы товара, размещенные на паллетах, и являются базовым уровнем учета товаров. Модуль обеспечивает создание и управление позициями, их привязку к паллетам и рядам, отслеживание остатков товаров, а также интеграцию с внешними складами. Модуль является основой для учета товаров на складе и позволяет отслеживать точное количество каждого товара в каждом месте.

## Сущности модуля

### Pos (Позиция)

Позиция представляет собой конкретную единицу товара на паллете. Это реальная физическая единица товара, которая имеет артикул, название, количество, количество коробок, дату, склад, комментарий, и привязана к паллете и ряду. Позиция является базовым уровнем учета товаров и позволяет отслеживать точное количество каждого товара в каждом месте на складе.

## Связи между сущностями

- **Pos → Pallet**: Многие к одному. Каждая позиция принадлежит одной паллете. Связь осуществляется через поле pallet (ObjectId) и кэшированные данные паллеты в поле palletData.

- **Pos → Row**: Многие к одному. Каждая позиция принадлежит одному ряду. Связь осуществляется через поле row (ObjectId) и кэшированные данные ряда в поле rowData.

- **Pos → Art**: Косвенная связь через артикул. Позиция связана с артикулом через поле artikul, которое должно соответствовать артикулу из модуля arts.

## Концепции и принятые решения

### Конкретные единицы товара на паллетах

Позиции представляют реальные физические единицы товара на паллетах. Каждая позиция имеет точное количество товара (quant) и количество коробок (boxes), что позволяет отслеживать остатки и планировать закупки.

### Кэширование данных

Данные паллеты (palletData) и ряда (rowData) кэшируются в позиции. Также кэшируются названия паллеты (palletTitle) и ряда (rowTitle) для повышения производительности. Это позволяет избежать дополнительных запросов к базе данных при работе с позициями и обеспечивает целостность данных даже если паллета или ряд изменятся после создания позиции.

### Обязательные поля

Все ключевые поля позиции (palletTitle, rowTitle, artikul, quant, boxes) являются обязательными. Это обеспечивает целостность данных и гарантирует что каждая позиция содержит полную информацию о товаре и его местоположении.

### Интеграция с внешними складами

Позиция может иметь поле sklad, которое указывает на внешний склад. Это позволяет интегрировать данные из разных источников и отслеживать товары на разных складах.

### Массовые операции

Модуль поддерживает массовое создание позиций через эндпоинт bulk. Это критично при импорте данных из внешних систем или при первоначальной настройке склада.

### Заполнение недостающих данных

Модуль поддерживает операцию populate-missing-data, которая заполняет недостающие кэшированные данные (palletData, rowData, palletTitle, rowTitle) для существующих позиций. Это полезно при миграции данных или восстановлении целостности данных.

### Экспорт остатков

Модуль поддерживает экспорт остатков товаров в Excel файл. Это позволяет работать с данными об остатках во внешних системах и выполнять анализ.

### Группировка по артикулам

При получении позиций по артикулу результаты группируются по паллетам и рядам, что позволяет видеть все места где находится товар и общее количество.

## API эндпоинты

### GET `/api/poses`

Получение всех позиций.

**Запрос:**
- Query параметры отсутствуют

**Ответ:**
- 200: `Array<Pos>`
- 500: `{ message: string, error?: any }` - ошибка сервера

**Доступ:** Требует роль USER

### GET `/api/poses/:id`

Получение позиции по идентификатору.

**Запрос:**
- Path параметры: `id` (MongoDB ObjectId)

**Ответ:**
- 200: `Pos`
- 400: `{ message: string, errors?: array }` - неверный формат ID
- 404: `{ message: string }` - позиция не найдена
- 500: `{ message: string, error?: any }` - ошибка сервера

**Доступ:** Требует роль USER

### GET `/api/poses/by-artikul/:artikul`

Получение позиций по артикулу с группировкой по паллетам и рядам.

**Запрос:**
- Path параметры: `artikul` (string)

**Ответ:**
- 200: `{ success: boolean, data: { artikul: string, nameukr?: string, totalQuant: number, totalBoxes: number, locations: Array<{ pallet: { _id: string, title: string }, row: { _id: string, title: string }, quant: number, boxes: number }> } }`
- 400: `{ success: boolean, message: string }` - артикул не указан
- 500: `{ success: boolean, message: string }` - ошибка сервера

**Доступ:** Требует роль USER

### GET `/api/poses/by-pallet/:palletId`

Получение всех позиций паллеты.

**Запрос:**
- Path параметры: `palletId` (MongoDB ObjectId)

**Ответ:**
- 200: `Array<Pos>`
- 400: `{ message: string, errors?: array }` - неверный формат ID
- 500: `{ message: string, error?: any }` - ошибка сервера

**Доступ:** Требует роль USER

### GET `/api/poses/by-row/:rowId`

Получение всех позиций ряда.

**Запрос:**
- Path параметры: `rowId` (MongoDB ObjectId)

**Ответ:**
- 200: `Array<Pos>`
- 400: `{ message: string, errors?: array }` - неверный формат ID
- 500: `{ message: string, error?: any }` - ошибка сервера

**Доступ:** Требует роль USER

### POST `/api/poses`

Создание новой позиции.

**Запрос:**
- Body: `{ pallet: string, row: string, artikul: string, nameukr?: string, quant: number, boxes: number, date?: string, sklad?: string, comment?: string }`

**Ответ:**
- 201: `Pos`
- 400: `{ message: string, errors?: array }` - ошибка валидации
- 404: `{ message: string }` - паллета или ряд не найдены
- 500: `{ message: string, error?: any }` - ошибка сервера

**Доступ:** Требует роль ADMIN

### POST `/api/poses/bulk`

Массовое создание позиций.

**Запрос:**
- Body: `Array<{ pallet: string, row: string, artikul: string, nameukr?: string, quant: number, boxes: number, date?: string, sklad?: string, comment?: string }>`

**Ответ:**
- 201: `{ message: string, created: number, errors: Array<{ index: number, error: string, data: object }> }`
- 400: `{ message: string, errors?: array }` - ошибка валидации
- 500: `{ message: string, error?: any }` - ошибка сервера

**Доступ:** Требует роль ADMIN

### POST `/api/poses/populate-missing-data`

Заполнение недостающих кэшированных данных для существующих позиций.

**Запрос:**
- Body отсутствует

**Ответ:**
- 200: `{ updated: number, errors: Array<string>, errorDetails: Array<{ index: number, error: string }> }`
- 500: `{ error: string }` - ошибка сервера

**Доступ:** Требует роль ADMIN

### POST `/api/poses/export-stocks`

Экспорт остатков товаров в Excel файл.

**Запрос:**
- Body отсутствует

**Ответ:**
- 200: Excel файл (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
- 500: `{ message: string, error?: any }` - ошибка сервера

**Доступ:** Требует роль ADMIN

### PUT `/api/poses/:id`

Обновление позиции.

**Запрос:**
- Path параметры: `id` (MongoDB ObjectId)
- Body: `{ pallet?: string, row?: string, artikul?: string, nameukr?: string, quant?: number, boxes?: number, date?: string, sklad?: string, comment?: string }` (все поля опциональны)

**Ответ:**
- 200: `Pos`
- 400: `{ message: string, errors?: array }` - ошибка валидации
- 404: `{ message: string }` - позиция, паллета или ряд не найдены
- 500: `{ message: string, error?: any }` - ошибка сервера

**Доступ:** Требует роль ADMIN

### DELETE `/api/poses/:id`

Удаление позиции.

**Запрос:**
- Path параметры: `id` (MongoDB ObjectId)

**Ответ:**
- 200: `Pos`
- 400: `{ message: string, errors?: array }` - неверный формат ID
- 404: `{ message: string }` - позиция не найдена
- 500: `{ message: string, error?: any }` - ошибка сервера

**Доступ:** Требует роль ADMIN

## Форматы данных

### Pos

```typescript
{
  _id: string;                    // MongoDB ObjectId
  pallet: string;                  // ObjectId паллеты
  row: string;                     // ObjectId ряда
  palletData: {                    // Кэшированные данные паллеты
    _id: string;
    title: string;
    sector?: string;
    isDef: boolean;
  };
  rowData: {                       // Кэшированные данные ряда
    _id: string;
    title: string;
  };
  palletTitle: string;             // Кэшированное название паллеты
  rowTitle: string;                // Кэшированное название ряда
  artikul: string;                  // Артикул товара
  nameukr?: string;                // Название товара на украинском
  quant: number;                   // Количество товара
  boxes: number;                   // Количество коробок
  date?: string;                   // Дата
  sklad?: string;                  // Склад
  comment: string;                 // Комментарий
  createdAt?: Date;                 // Дата создания
  updatedAt?: Date;                 // Дата обновления
}
```

