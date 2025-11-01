# Инструкция по декомпозиции модулей в стиле модуля `asks`

## Введение

Данная инструкция описывает процесс рефакторинга модулей проекта `btw-wh-server` для приведения их к единой архитектуре с чётким разделением ответственности, улучшенной тестируемостью и поддержкой кода.

## Анализ паттерна модуля `asks`

### Финальная структура после рефакторинга

```
asks/
├── controllers/
│   ├── __tests__/                          # Интеграционные тесты контроллеров
│   │   ├── createAskController.test.ts     # Тестирует только HTTP интерфейс
│   │   ├── completeAskById.test.ts
│   │   └── ...
│   ├── create-ask/                         # kebab-case директории
│   │   ├── createAskController.ts          # camelCase файлы контроллеров
│   │   ├── schemas/
│   │   │   └── createAskSchema.ts          # Zod схемы валидации
│   │   └── utils/
│   │       ├── __tests__/                   # Unit-тесты утилит
│   │       │   ├── createAskUtil.test.ts   # Тестирует только бизнес-логику
│   │       │   ├── getCreateAskActionsUtil.test.ts
│   │       │   └── getCreateAskMesUtil.test.ts
│   │       ├── createAskUtil.ts             # Чистая бизнес-логика
│   │       ├── getCreateAskActionsUtil.ts   # Формирование действий
│   │       ├── getCreateAskMesUtil.ts       # Формирование сообщений
│   │       └── sendCreateAskMesUtil.ts      # Отправка уведомлений
│   ├── complete-ask-by-id/
│   ├── delete-ask-by-id/
│   └── index.ts                             # Экспорт всех контроллеров
├── models/
│   └── Ask.ts                               # Mongoose модель с _id в интерфейсе
└── router.ts
```

## Ключевые принципы разделения ответственности

### 1. Контроллер (Orchestrator)

**Обязанности:**

- Валидация входных данных через Zod схемы
- Управление транзакциями MongoDB
- Вызов утилит в правильной последовательности
- Формирование HTTP ответов (статус-коды, JSON)
- Обработка ошибок и отправка соответствующих статусов
- Разделение транзакционных операций и побочных эффектов

**НЕ должен:**

- Содержать бизнес-логику
- Напрямую работать с моделями (кроме простых find для валидации)
- Формировать сложные данные
- Возвращать `Response` объект (использовать `return;` после `res.status().json()`)

**Пример контроллера:**

```typescript
export const createAskController = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const { artikul, nameukr, quant, com, askerId } = req.body;

    // 1. Валидация
    const parseResult = createAskSchema.safeParse({ ... });
    if (!parseResult.success) {
      res.status(400).json({ ... });
      return;  // ВАЖНО: не return res.status().json()
    }

    // 2. Оркестрация в транзакции
    let createdAsk: any = null;
    await session.withTransaction(async () => {
      askerData = await User.findById(askerId).session(session);
      if (!askerData) throw new Error("User not found");

      const actions = getCreateAskActionsUtil({ ... });
      createdAsk = await createAskUtil({ ..., session });
    });

    // 3. HTTP ответ
    res.status(201).json(createdAsk);

    // 4. Побочные эффекты (не в транзакции)
    const message = getCreateAskMessageUtil({ ... });
    await sendCreateAskMesUtil({ ... });

  } catch (error) {
    // 5. Обработка ошибок с правильными статусами
    if (!res.headersSent) {
      if (error instanceof Error && error.message === "User not found") {
        res.status(404).json({ message: "User not found" });
      } else {
        res.status(500).json({ message: "Server error", error });
      }
    }
  } finally {
    await session.endSession();
  }
};
```

### 2. Утилиты (Pure business logic)

**Обязанности:**

- Чистая бизнес-логика без зависимостей от Express
- Работа с моделями MongoDB
- Формирование данных, расчёты, трансформации
- Могут принимать session для транзакций
- Возвращают типизированные данные, не Response объекты

**Типы утилит:**

- `[action]Util` - основная бизнес-логика (создание/обновление/удаление)
- `get[Something]Util` - получение/формирование данных
- `send[Something]Util` - отправка уведомлений/внешние вызовы
- Вспомогательные функции для вычислений и форматирования

**Пример утилиты:**

```typescript
type CreateAskInput = {
  artikul: string;
  nameukr?: string;
  quant?: number;
  com?: string;
  askerData: IUser;
  actions: string[];
  session: ClientSession;
};

export const createAskUtil = async ({
  artikul,
  nameukr,
  quant,
  com,
  askerData,
  actions,
  session,
}: CreateAskInput): Promise<IAsk> => {
  const ask: IAsk = new Ask({
    artikul,
    nameukr,
    quant,
    com,
    asker: askerData?._id,
    askerData,
    actions,
    status: "new",
  });

  await ask.save({ session });
  return ask as IAsk;
};
```

### 3. Схемы валидации (Zod)

**Обязанности:**

- Определение типов входных данных
- Валидация форматов (ObjectId, строки, числа, паттерны)
- Экспорт TypeScript типов через `z.infer`
- Централизация валидационной логики

**Пример:**

```typescript
import mongoose from "mongoose";
import { z } from "zod";

export const createAskSchema = z.object({
  artikul: z.string().min(1, "Artikul is required"),
  nameukr: z.string().optional(),
  quant: z.number().optional(),
  com: z.string().optional(),
  askerId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid asker ID format",
  }),
});

export type CreateAskInput = z.infer<typeof createAskSchema>;
```

### 4. Модели

**ВАЖНО:** Все модели должны явно объявлять `_id` в интерфейсе:

```typescript
export interface IRow extends Document {
  _id: Types.ObjectId; // ОБЯЗАТЕЛЬНО!
  title: string;
  pallets: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}
```

Это устраняет ошибки типизации в тестах.

## Тестирование

### Unit-тесты утилит (`utils/__tests__/`)

**Цель:** Протестировать ТОЛЬКО логику функции

**Особенности:**

- Тестируют изолированную логику без зависимостей от Express
- Используют реальную MongoDB (Memory Server)
- Проверяют корректность данных, вычислений, трансформаций
- Могут мокать внешние зависимости
- Тестируют edge cases и граничные условия

**Пример:**

```typescript
describe("createAskUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("создаёт Ask в транзакции и возвращает сохранённый документ", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const asker = await createTestUser({ fullname: "Creator One" });

      const result = await createAskUtil({
        artikul: "ART-001",
        nameukr: "Папір А4",
        quant: 3,
        com: "терміново",
        askerData: asker,
        actions: ["2025-01-01 12:00 Creator One: створив запит"],
        session,
      });

      expect(result).toBeTruthy();
      expect(result.artikul).toBe("ART-001");
      expect(result.status).toBe("new");
      expect(Array.isArray(result.actions)).toBe(true);

      const found = await Ask.findById(result._id).session(session);
      expect(found).not.toBeNull();
    });
    await session.endSession();
  });
});
```

### Интеграционные тесты контроллеров (`controllers/__tests__/`)

**Цель:** Протестировать ТОЛЬКО HTTP интерфейс

**Особенности:**

- Тестируют поведение endpoints
- Проверяют статус-коды (200, 201, 400, 404, 500)
- Проверяют структуру JSON ответов
- Минимально проверяют побочные эффекты в БД
- Мокают Request/Response объекты Express
- Тестируют валидацию входных данных
- Тестируют обработку ошибок

**Пример:**

```typescript
describe("createAskController", () => {
  let res: Response;
  let responseJson: any;
  let responseStatus: any;

  beforeEach(() => {
    responseJson = {};
    responseStatus = {};
    res = {
      status: function (code: number) {
        responseStatus.code = code;
        return this;
      },
      json: function (data: any) {
        responseJson = data;
        return this;
      },
    } as unknown as Response;
  });

  it("201: создаёт заявку", async () => {
    const user = await createTestUser({ fullname: "Asker" });
    const req = { body: { artikul: "ART-NEW", ... } } as Request;

    await createAskController(req, res);

    expect(responseStatus.code).toBe(201);
    expect(responseJson.artikul).toBe("ART-NEW");
    expect(responseJson._id).toBeDefined();
  });

  it("400: ошибка валидации при отсутствии artikul", async () => {
    const req = { body: { /* artikul пропущен */ } } as Request;
    await createAskController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });

  it("404: если пользователь не найден", async () => {
    const req = {
      body: {
        artikul: "ART-NEW",
        askerId: new mongoose.Types.ObjectId().toString(),
      },
    } as Request;

    await createAskController(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("User not found");
  });
});
```

## Пошаговый процесс рефакторинга модуля

### Шаг 1: Анализ модуля

1. Изучить все контроллеры модуля
2. Выделить основные действия (actions): create, update, delete, get, etc.
3. Определить сложную бизнес-логику для вынесения в утилиты
4. Проверить существующие утилиты в `module/utils/`:
   - Общие (используются в нескольких контроллерах) → оставить в `module/utils/`
   - Специфичные (для одного контроллера) → переместить в `controller/[action]/utils/`
5. Проверить существующие схемы валидации

### Шаг 2: Подготовка модели

1. Добавить явное объявление `_id` в интерфейс:

```typescript
export interface IModel extends Document {
  _id: Types.ObjectId; // Добавить!
  // ... остальные поля
}
```

### Шаг 3: Создание структуры директорий

Для каждого контроллера создать:

```
controllers/
├── [action-name]/              # kebab-case: create-row, delete-row, get-row-by-id
│   ├── [actionName]Controller.ts  # Контроллер (без .ts суффикса для старых)
│   ├── schemas/
│   │   └── [actionName]Schema.ts  # Если схемы ещё нет
│   └── utils/
│       ├── __tests__/
│       │   └── [specific utils].test.ts
│       └── [specific utils].ts
```

### Шаг 4: Создание/перемещение Zod схем

1. Если схема уже существует в `schemas/`, переместить в `controller/[action]/schemas/`
2. Если схемы нет, создать `controller/[action]/schemas/[actionName]Schema.ts`
3. Определить входные параметры (body, params, query)
4. Добавить валидацию ObjectId где нужно
5. Экспортировать типы через `z.infer`

### Шаг 5: Выделение утилит

**Критерии для выделения в отдельную утилиту:**

- Любая работа с моделями (create, update, delete, find с условиями)
- Формирование сложных данных (actions, messages, расчёты)
- Внешние вызовы (API, Telegram, email)
- Бизнес-логика с условиями
- Трансформации и маппинги

**Именование утилит:**

- `createXUtil`, `updateXUtil`, `deleteXUtil` - основные операции
- `getXActionsUtil`, `getXMessageUtil` - формирование данных
- `sendXMessageUtil` - отправка уведомлений
- `calculateXUtil` - расчёты

### Шаг 6: Рефакторинг контроллера

1. Оставить только оркестрацию
2. Добавить валидацию через Zod схему в начале
3. Вынести всю бизнес-логику в утилиты
4. Управлять транзакциями на уровне контроллера
5. Исправить возвращаемые значения - убрать `return res.status().json()`
6. Обработать все возможные ошибки с правильными статусами

**ВАЖНО:** Всегда использовать `res.status().json(); return;` вместо `return res.status().json();`

### Шаг 7: Написание тестов

**Unit-тесты утилит:**

1. Создать `utils/__tests__/[utilName].test.ts`
2. Тестировать каждую утилиту изолированно
3. Использовать реальные модели и MongoDB Memory Server
4. Проверять корректность данных и побочных эффектов
5. Тестировать edge cases

**Интеграционные тесты контроллера:**

1. Создать `controllers/__tests__/[controllerName]Controller.test.ts`
2. Мокать Request/Response
3. Тестировать все сценарии: успех, валидация, ошибки
4. Проверять статус-коды и структуру ответов
5. Тестировать обработку ошибок

### Шаг 8: Обновление экспортов

1. Обновить `controllers/index.ts` с новыми путями
2. Убедиться что `router.ts` импортирует корректно
3. Проверить что все старые импорты удалены

### Шаг 9: Удаление старых файлов

**ВАЖНО:** Старые контроллеры и старые тесты - это балласт, который нужно удалить безжалостно. Они дали дорогу молодым и должны уйти.

1. Удалить старые контроллеры из `controllers/` (корневые файлы, которые были перемещены в поддиректории)
2. Удалить старые тесты из `controllers/__tests__/`:
   - Длинные дубликаты тестов (старый стиль)
   - Тесты, которые импортируют старые контроллеры
   - Оставить только короткие интеграционные тесты по образцу из документации
3. Проверить что ничего не сломалось

### Шаг 10: Финальная проверка

1. Запустить `npm run build` - должны быть 0 ошибок TypeScript
2. Запустить `npm test -- src/modules/[module]` - все тесты должны проходить
3. Проверить покрытие кода тестами
4. Убедиться что HTTP интерфейс не изменился

## Общие утилиты vs специфичные утилиты

### Оставить в `module/utils/`:

- Используются в нескольких контроллерах
- Общая логика модуля (сортировка, фильтрация, парсинг)
- Независимые вспомогательные функции
- Функции работы с внешними API

### Переместить в `controller/[action]/utils/`:

- Используются только в одном контроллере
- Специфичная логика конкретного действия
- Формирование данных для конкретного endpoint
- Отправка уведомлений для конкретного события

## Чек-лист рефакторинга модуля

- [ ] Проанализирован модуль и выделены actions
- [ ] Добавлен `_id` в интерфейс модели
- [ ] Создана структура директорий для каждого action
- [ ] Созданы/перемещены Zod схемы валидации
- [ ] Выделены утилиты из контроллеров
- [ ] Определены общие vs специфичные утилиты
- [ ] Написаны unit-тесты для всех утилит
- [ ] Написаны интеграционные тесты для контроллеров
- [ ] Обновлены экспорты в index.ts
- [ ] Проверена работа router.ts
- [ ] Удалены старые файлы контроллеров (из корня controllers/)
- [ ] Удалены старые тесты (дубликаты, длинные старые тесты)
- [ ] Оставлены только интеграционные тесты контроллеров в стиле документации
- [ ] `npm run build` проходит без ошибок
- [ ] Все тесты проходят успешно
- [ ] Покрытие кода тестами не ухудшилось

## Модули для рефакторинга

**Приоритет:**

1. ✅ **rows** - простой CRUD, completed
2. ✅ **zones** - простой CRUD с bulk операциями, completed
3. ✅ **arts** - средняя сложность, есть внешние API, completed
4. ⏳ **pallets** - сложный, много связей
5. ⏳ **poses** - сложный, много бизнес-логики
6. ⏳ **defs** - сложный, расчёты и cron
7. ⏳ **auth** - специфичный, аутентификация

**НЕ трогать:** `pulls` - в разработке, логика нестабильна

## Особенности для разных типов модулей

### Простые CRUD модули (rows, zones)

- Минимальная декомпозиция
- Утилиты только если есть сложная логика (сортировка, фильтрация)
- Схемы валидации обязательны

### Модули с бизнес-логикой (poses, pallets, defs)

- Полная декомпозиция
- Выделение всех операций с моделями
- Отдельные утилиты для расчётов и трансформаций

### Модуль auth

- Схемы для регистрации/логина
- Утилиты для генерации токенов
- Утилиты для проверки паролей

### Модули с внешними API (arts, defs)

- Утилиты для внешних вызовов
- Моки в тестах для внешних зависимостей
- Отдельные утилиты для парсинга ответов

## Правила для GET запросов по ID/уникальному полю

**ВАЖНО:** Для всех GET запросов, которые ищут запись по ID или уникальному полю, НЕ использовать статус 404.

**Вместо этого:**

- Возвращать **200** с полем `exists: false` если запись не найдена
- Возвращать **200** с полем `exists: true` если запись найдена

**Пример ответа при отсутствии записи:**

```typescript
res.status(200).json({
  exists: false,
  message: "Zone not found",
  data: null,
});
```

**Пример ответа при наличии записи:**

```typescript
res.status(200).json({
  exists: true,
  message: "Zone retrieved successfully",
  data: zone,
});
```

**Применяется ко всем модулям проекта** - это стандарт API для всех GET запросов по идентификатору.

## Важные замечания

1. **Не ломать существующий функционал** - тесты должны проходить на каждом шаге
2. **Сохранять совместимость API** - HTTP интерфейс не меняется
3. **Постепенный подход** - рефакторить по одному контроллеру
4. **Тесты обязательны** - нельзя считать рефакторинг завершённым без тестов
5. **Мокать Telegram API** - не отправлять реальные сообщения в тестах
6. **Исправлять типизацию** - всегда добавлять `_id` в интерфейсы моделей
7. **Исправлять возвращаемые значения** - всегда использовать `res.status().json(); return;`
8. **ЖЁСТКО удалять старые файлы** - старые контроллеры и длинные дубликаты тестов - это балласт, который мешает молодым
9. **GET запросы с exists** - всегда возвращать 200 с полем `exists` вместо 404

## Примеры типичных ошибок и решений

### Ошибка: `'row._id' is of type 'unknown'`

**Решение:** Добавить `_id: Types.ObjectId;` в интерфейс модели

### Ошибка: `Type 'Response' is not assignable to type 'void'`

**Решение:** Заменить `return res.status().json()` на `res.status().json(); return;`

### Ошибка: Утилита импортирует Express

**Решение:** Передавать только данные, не Request/Response объекты

### Ошибка: Тесты падают из-за дубликатов в БД

**Решение:** Проверить that `beforeEach` очищает коллекции

### Ошибка: Схема валидации не применяется

**Решение:** Проверить импорты и использование `safeParse`

## Заключение

Эта инструкция должна использоваться как руководство для рефакторинга всех модулей проекта. Каждый модуль имеет свои особенности, но общие принципы остаются неизменными: чёткое разделение ответственности, изолированные тесты, типобезопасность.

При возникновении вопросов или неоднозначностей, обращайтесь к модулю `asks` как к эталону рефакторинга.
