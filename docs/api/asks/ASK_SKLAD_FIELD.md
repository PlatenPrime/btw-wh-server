# Изменения в модели Ask: Поле sklad

## Описание

В модель Ask добавлено поле `sklad` для указания склада, с которого нужно снять товар. Это позволяет избежать путаницы между складами `pogrebi` и `merezhi`.

## Изменения в модели Ask

### Новое поле

```typescript
interface IAsk {
  // ... существующие поля ...
  sklad?: string; // Склад для снятия товара ("pogrebi" или "merezhi")
  // ... остальные поля ...
}
```

- **Тип:** `string | undefined`
- **Значение по умолчанию:** `"pogrebi"`
- **Допустимые значения:** `"pogrebi"` или `"merezhi"`
- **Опциональность:** Поле опциональное, но всегда будет иметь значение (либо из запроса, либо дефолт)

## Изменения в создании Ask

### Эндпоинт

```
POST /api/asks
```

### Обновленная схема запроса

```typescript
{
  artikul: string;        // Обязательное
  nameukr?: string;       // Опциональное
  quant?: number;         // Опциональное
  com?: string;          // Опциональное
  sklad?: "pogrebi" | "merezhi"; // Опциональное, по умолчанию "pogrebi"
  askerId: string;       // Обязательное
}
```

### Параметры

| Параметр | Тип                      | Обязательный | Описание                                                        |
| -------- | ------------------------ | ------------ | --------------------------------------------------------------- |
| `sklad`  | `"pogrebi" \| "merezhi"` | Нет          | Склад для снятия товара. Если не указан, используется "pogrebi" |

### Валидация

- Поле `sklad` опциональное
- Если указано, должно быть одним из значений: `"pogrebi"` или `"merezhi"`
- Если не указано, автоматически устанавливается `"pogrebi"`

## Примеры запросов

### Пример 1: Создание Ask с указанием склада "pogrebi"

```http
POST /api/asks
Authorization: Bearer <token>
Content-Type: application/json

{
  "artikul": "ART-123",
  "nameukr": "Товар",
  "quant": 50,
  "com": "Комментарий",
  "sklad": "pogrebi",
  "askerId": "507f1f77bcf86cd799439011"
}
```

### Пример 2: Создание Ask с указанием склада "merezhi"

```http
POST /api/asks
Authorization: Bearer <token>
Content-Type: application/json

{
  "artikul": "ART-456",
  "nameukr": "Другой товар",
  "quant": 30,
  "sklad": "merezhi",
  "askerId": "507f1f77bcf86cd799439011"
}
```

### Пример 3: Создание Ask без указания склада (будет использован дефолт "pogrebi")

```http
POST /api/asks
Authorization: Bearer <token>
Content-Type: application/json

{
  "artikul": "ART-789",
  "nameukr": "Третий товар",
  "askerId": "507f1f77bcf86cd799439011"
}
```

В этом случае в базе данных поле `sklad` будет автоматически установлено в `"pogrebi"`.

## Влияние на другие эндпоинты

### GET /api/asks/:id/pull

Контроллер `getAskPull` теперь фильтрует позиции по складу из `ask.sklad`:

- Если `ask.sklad` указан, возвращаются только позиции с этого склада
- Если `ask.sklad` не указан, используется дефолт `"pogrebi"`
- Это гарантирует, что пользователь получает позиции только с нужного склада

Подробнее см. документацию [GET_ASK_PULL.md](./GET_ASK_PULL.md).

## Обратная совместимость

- **Старые Ask:** Ask, созданные до добавления поля `sklad`, не будут иметь это поле в базе данных. При получении позиций для таких Ask будет использоваться дефолтное значение `"pogrebi"`.
- **Создание новых Ask:** Если поле `sklad` не указано при создании, автоматически устанавливается `"pogrebi"`.
- **API совместимость:** Все существующие запросы на создание Ask продолжат работать без изменений, склад будет установлен в `"pogrebi"` по умолчанию.

## Рекомендации для фронтенда

1. **Форма создания Ask:** Добавить поле выбора склада (dropdown/select) с опциями:

   - `pogrebi` (по умолчанию)
   - `merezhi`

2. **Отображение Ask:** Показывать склад в списке/детальной информации об Ask, чтобы пользователь понимал, с какого склада нужно снимать товар.

3. **Валидация на фронтенде:** При создании Ask проверять, что выбранный склад соответствует одному из допустимых значений.

4. **Миграция UI:** При обновлении фронтенда убедиться, что старые Ask без указания склада корректно обрабатываются (используется дефолт "pogrebi").

## Типы TypeScript для фронтенда

```typescript
// Модель Ask
interface Ask {
  _id: string;
  artikul: string;
  nameukr?: string;
  quant?: number;
  com?: string;
  sklad?: string; // "pogrebi" | "merezhi", по умолчанию "pogrebi"
  asker: string;
  askerData: AskUserData;
  solver?: string;
  solverData?: AskUserData;
  status: "new" | "processing" | "completed" | "rejected";
  actions: string[];
  pullQuant: number;
  pullBox: number;
  events: AskEvent[];
  createdAt: Date;
  updatedAt: Date;
}

// Схема создания Ask
interface CreateAskInput {
  artikul: string;
  nameukr?: string;
  quant?: number;
  com?: string;
  sklad?: "pogrebi" | "merezhi";
  askerId: string;
}

// Константы складов
const WAREHOUSES = {
  POGREBI: "pogrebi",
  MEREZHI: "merezhi",
} as const;

type Warehouse = (typeof WAREHOUSES)[keyof typeof WAREHOUSES];
```
