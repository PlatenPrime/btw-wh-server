# Модуль Pulls (Зняття товарів)

## Содержание

1. [Введение](#введение)
2. [Что такое Pulls?](#что-такое-pulls)
3. [Связи с другими модулями](#связи-с-другими-модулями)
4. [Архитектура модуля](#архитектура-модуля)
5. [API Endpoints](#api-endpoints)
6. [Бизнес-логика](#бизнес-логика)
7. [Использование с TanStack Query](#использование-с-tanstack-query)
8. [Примеры использования](#примеры-использования)

## Введение

Модуль **Pulls** (Зняття товарів) предназначен для автоматического расчёта и обработки задач по извлечению товаров со склада на основе заявок (asks). Модуль вычисляет оптимальные маршруты для сборщиков, группируя позиции по паллетам и сортируя их по секторам для эффективной обработки.

## Что такое Pulls?

**Pull** - это виртуальная структура данных, которая представляет собой набор позиций на конкретной паллете, которые нужно обработать (извлечь товар) для выполнения одной или нескольких заявок (asks).

### Ключевые характеристики:

- **Динамический расчёт**: Pulls не хранятся в базе данных, а вычисляются на лету на основе всех активных заявок со статусом "new"
- **Группировка по паллетам**: Все позиции для обработки группируются по паллетам для оптимизации маршрута сборщика
- **Сортировка по секторам**: Pulls сортируются по номеру сектора (по возрастанию) для последовательной обработки
- **Приоритизация**: Позиции обрабатываются в порядке минимизации перемещений по складу

### Структура данных

```typescript
interface IPull {
  palletId: Types.ObjectId; // ID паллеты
  palletTitle: string; // Название паллеты
  sector: number; // Номер сектора (0 если не указан)
  rowTitle: string; // Название ряда
  positions: IPullPosition[]; // Позиции для обработки
  totalAsks: number; // Количество уникальных asks
}

interface IPullPosition {
  posId: Types.ObjectId; // ID позиции
  artikul: string; // Артикул товара
  nameukr?: string; // Украинское название
  currentQuant: number; // Текущее количество на позиции
  currentBoxes: number; // Текущее количество коробок на позиции
  requestedQuant: number; // Запрошенное количество (0 для asks без quant)
  askId: Types.ObjectId; // ID заявки
  askerData: AskUserData; // Данные заказчика
}
```

## Связи с другими модулями

### Модуль Asks (Заявки)

- **Зависимость**: Pulls вычисляются на основе asks со статусом `"new"`
- **Взаимодействие**:
  - При обработке позиции pull обновляются actions в ask
  - При полном выполнении ask автоматически переводится в статус `"completed"`
  - Отправляются уведомления заказчику при завершении ask

### Модуль Poses (Позиции)

- **Зависимость**: Pulls используют позиции из склада `"pogrebi"` с `quant > 0`
- **Взаимодействие**: При обработке pull позиции обновляется количество товара на позиции

### Модуль Pallets (Паллеты)

- **Зависимость**: Pulls группируются по паллетам
- **Взаимодействие**: Используется информация о секторах паллет для сортировки

### Модуль Auth (Аутентификация)

- **Зависимость**: Для обработки позиций требуется информация о пользователе (solver)

## Архитектура модуля

Модуль следует архитектуре проекта с чётким разделением ответственности:

```
pulls/
├── controllers/
│   ├── __tests__/                          # Интеграционные тесты
│   │   ├── getPullsController.test.ts
│   │   ├── getPullByPalletIdController.test.ts
│   │   └── processPullPositionController.test.ts
│   ├── get-pulls/
│   │   ├── getPullsController.ts
│   │   └── schemas/
│   │       └── getPullsSchema.ts
│   ├── get-pull-by-pallet-id/
│   │   ├── getPullByPalletIdController.ts
│   │   └── schemas/
│   │       └── getPullByPalletIdSchema.ts
│   ├── process-pull-position/
│   │   ├── processPullPositionController.ts
│   │   ├── processPullPositionSchema.ts
│   │   └── utils/
│   │       ├── __tests__/
│   │       │   ├── getProcessedQuantFromActionsUtil.test.ts
│   │       │   └── checkAskCompletionUtil.test.ts
│   │       ├── updatePosQuantUtil.ts          # Обновляет quant и boxes позиции
│   │       ├── addPullActionToAskUtil.ts
│   │       ├── getProcessedQuantFromActionsUtil.ts
│   │       ├── checkAskCompletionUtil.ts
│   │       ├── completeAskFromPullUtil.ts
│   │       └── sendAskCompletionNotificationUtil.ts
│   └── index.ts
├── models/
│   └── Pull.ts                              # Интерфейсы данных
├── router.ts
└── utils/
    ├── __tests__/
    │   ├── getPositionSector.test.ts
    │   └── sortPositionsBySector.test.ts
    ├── calculatePullsUtil.ts                # Основная логика расчёта
    ├── getNewAsksUtil.ts
    ├── groupAsksByArtikulUtil.ts
    ├── getAvailablePositionsUtil.ts
    ├── distributeAsksToPositionsUtil.ts
    ├── createPullPositionUtil.ts
    ├── groupPullPositionsByPalletUtil.ts
    ├── buildPullObjectUtil.ts
    ├── getPositionSector.ts
    └── sortPositionsBySector.ts
```

## API Endpoints

### GET /api/pulls

Получить все вычисленные pulls.

**Доступ**: ADMIN, PRIME

**Ответ**:

```json
{
  "success": true,
  "message": "Pulls calculated successfully",
  "data": {
    "pulls": [
      {
        "palletId": "...",
        "palletTitle": "Pallet-1",
        "sector": 5,
        "rowTitle": "Row-A",
        "positions": [...],
        "totalAsks": 3
      }
    ],
    "totalPulls": 10,
    "totalAsks": 15
  }
}
```

### GET /api/pulls/:palletId

Получить pull для конкретной паллеты.

**Доступ**: ADMIN, PRIME

**Параметры**:

- `palletId` (path) - ID паллеты

**Ответ при наличии**:

```json
{
  "success": true,
  "exists": true,
  "message": "Pull retrieved successfully",
  "data": {
    "palletId": "...",
    "palletTitle": "Pallet-1",
    "sector": 5,
    "rowTitle": "Row-A",
    "positions": [...],
    "totalAsks": 3
  }
}
```

**Ответ при отсутствии**:

```json
{
  "success": true,
  "exists": false,
  "message": "Pull not found for the specified pallet",
  "data": null
}
```

### PATCH /api/pulls/:palletId/positions/:posId

Обработать позицию pull (извлечь товар).

**Доступ**: ADMIN, PRIME

**Параметры**:

- `palletId` (path) - ID паллеты
- `posId` (path) - ID позиции

**Тело запроса**:

```json
{
  "askId": "...",
  "actualQuant": 5,
  "actualBoxes": 2,
  "solverId": "..."
}
```

**Ответ**:

```json
{
  "success": true,
  "message": "Position processed successfully",
  "data": {
    "positionId": "...",
    "palletId": "...",
    "actualQuant": 5,
    "remainingQuant": 5,
    "askProgress": 5,
    "askFullyProcessed": false,
    "askRequestedQuant": 10,
    "remainingAsksInPull": 2,
    "solverName": "John Doe"
  }
}
```

**Коды ответов**:

- `200` - Успешно обработано
- `400` - Ошибка валидации
- `404` - Позиция, ask или пользователь не найдены
- `422` - Невозможно взять больше товара/коробок чем есть на позиции
- `500` - Внутренняя ошибка сервера

## Бизнес-логика

### Алгоритм расчёта Pulls

1. **Получение активных заявок**: Находятся все asks со статусом `"new"`
2. **Группировка по артикулам**: Asks группируются по `artikul`
3. **Поиск доступных позиций**: Для каждого артикула находятся позиции:
   - `quant > 0` (не пустые)
   - `sklad = "pogrebi"` (только из подвала)
4. **Сортировка позиций**: Позиции сортируются по сектору (по возрастанию)
5. **Распределение asks по позициям**:
   - **Для asks с указанным количеством**: Используется жадный алгоритм - asks распределяются по позициям последовательно, пока не будет выполнена вся заявка
   - **Для asks без количества**: Используется первая позиция (с минимальным сектором) - количество решает сборщик
6. **Группировка по паллетам**: Все позиции группируются по паллетам
7. **Создание объектов Pull**: Для каждой паллеты создаётся объект Pull с метаданными
8. **Сортировка Pulls**: Pulls сортируются по сектору (по возрастанию)

### Обработка позиции

При обработке позиции происходит:

1. **Валидация**: Проверка корректности данных и существования сущностей
2. **Валидация количества**: Проверка что `actualQuant <= position.quant` и `actualBoxes <= position.boxes`
3. **Обновление позиции**: Уменьшение `quant` на `actualQuant` и `boxes` на `actualBoxes`
4. **Добавление action**: Добавление записи в массив `actions` ask с информацией об изъятии (формат: `"знято X шт. (Y кор.) з паллети ..."`)
5. **Проверка завершённости**: Проверка, выполнена ли ask полностью (суммируются все `actualQuant` из actions)
6. **Автоматическое завершение**: Если ask выполнен, он автоматически переводится в статус `"completed"`
7. **Уведомление**: Отправка уведомления заказчику через Telegram (если указан telegram)

### Отслеживание прогресса

Модуль отслеживает прогресс обработки каждой ask:

- **Извлечение из actions**: Количество обработанного товара извлекается из строк actions по паттерну `"знято X шт. (Y кор.) з паллети ..."`
- **Расчёт прогресса**: Суммируются все количества из всех actions для конкретного ask
- **Автоматическое завершение**: Ask считается выполненным если `processedQuant >= requestedQuant`

### Обработка коробок

Каждая позиция содержит информацию о количестве товара (`quant`) и количестве коробок (`boxes`). При обработке позиции:

- **Фронтенд передаёт**: `actualQuant` (количество снятого товара) и `actualBoxes` (количество снятых коробок)
- **Бэкенд валидирует**: что оба значения не превышают текущие значения на позиции
- **Бэкенд обновляет**: оба поля атомарно в рамках транзакции MongoDB
- **Бэкенд записывает**: в action информацию о товаре и коробках: `"знято X шт. (Y кор.) з паллети ..."`

## Использование с TanStack Query

### Примеры использования на клиенте

#### Получение всех pulls

```typescript
import { useQuery } from "@tanstack/react-query";

const usePulls = () => {
  return useQuery({
    queryKey: ["pulls"],
    queryFn: async () => {
      const response = await fetch("/api/pulls", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      return data.data;
    },
    refetchInterval: 30000, // Обновление каждые 30 секунд
  });
};
```

#### Получение pull для паллеты

```typescript
const usePullByPalletId = (palletId: string) => {
  return useQuery({
    queryKey: ["pulls", palletId],
    queryFn: async () => {
      const response = await fetch(`/api/pulls/${palletId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      return data.data;
    },
    enabled: !!palletId,
  });
};
```

#### Обработка позиции

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

const useProcessPullPosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      palletId,
      posId,
      askId,
      actualQuant,
      actualBoxes,
      solverId,
    }: {
      palletId: string;
      posId: string;
      askId: string;
      actualQuant: number;
      actualBoxes: number;
      solverId: string;
    }) => {
      const response = await fetch(
        `/api/pulls/${palletId}/positions/${posId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            askId,
            actualQuant,
            actualBoxes,
            solverId,
          }),
        }
      );
      const data = await response.json();
      return data.data;
    },
    onSuccess: (data, variables) => {
      // Инвалидируем кэш для обновления данных
      queryClient.invalidateQueries({ queryKey: ["pulls"] });
      queryClient.invalidateQueries({
        queryKey: ["pulls", variables.palletId],
      });
      queryClient.invalidateQueries({ queryKey: ["asks"] });

      // Если ask завершён, обновляем список asks
      if (data.askFullyProcessed) {
        queryClient.invalidateQueries({ queryKey: ["asks"] });
      }
    },
  });
};
```

### Рекомендации по использованию

1. **Polling**: Используйте `refetchInterval` для автоматического обновления списка pulls во время работы сборщика
2. **Optimistic Updates**: Можно использовать optimistic updates для мгновенного отображения изменений
3. **Invalidation**: После обработки позиции обязательно инвалидируйте кэш для обновления данных
4. **Прогресс**: Используйте поле `askProgress` из ответа для отображения прогресса выполнения ask

## Примеры использования

### Workflow обработки pulls

1. **Получение списка pulls**:

   ```typescript
   const { data: pullsData } = usePulls();
   // pullsData.pulls - массив pulls, отсортированных по сектору
   ```

2. **Выбор паллеты для обработки**:

   ```typescript
   const { data: pull } = usePullByPalletId(palletId);
   // pull.positions - позиции для обработки на этой паллете
   ```

3. **Обработка позиций последовательно**:

   ```typescript
   const processPosition = useProcessPullPosition();

   for (const position of pull.positions) {
     await processPosition.mutateAsync({
       palletId: pull.palletId,
       posId: position.posId,
       askId: position.askId,
       actualQuant: position.requestedQuant || actualCount,
       actualBoxes: calculatedBoxes,
       solverId: currentUser.id,
     });

     // Отслеживание прогресса
     const progress = processPosition.data?.askProgress;
     const fullyProcessed = processPosition.data?.askFullyProcessed;
   }
   ```

4. **Автоматическое обновление**: После каждой обработки данные автоматически обновляются через invalidation

### Отображение прогресса

```typescript
const PullProgress = ({ pull }) => {
  const totalPositions = pull.positions.length;
  const processedPositions = pull.positions.filter(
    (p) => p.ask.status === "completed"
  ).length;

  return (
    <div>
      <p>
        Обработано: {processedPositions} / {totalPositions}
      </p>
      <p>Asks: {pull.totalAsks}</p>
      <ProgressBar value={processedPositions} max={totalPositions} />
    </div>
  );
};
```

## Технические детали

### Валидация

Все endpoints используют Zod схемы для валидации:

- `getPullsSchema` - для GET /api/pulls (текущая версия пустая, может быть расширена)
- `getPullByPalletIdSchema` - для GET /api/pulls/:palletId
- `processPullPositionSchema` - для PATCH /api/pulls/:palletId/positions/:posId

### Транзакции

Обработка позиции выполняется в транзакции MongoDB для обеспечения атомарности:

- Обновление позиции
- Добавление action в ask
- Завершение ask (если требуется)

### Уведомления

Уведомления отправляются **вне транзакции** чтобы не блокировать основной процесс. Используется модуль `asks` для отправки Telegram сообщений.

### Производительность

- Pulls вычисляются динамически при каждом запросе
- Для оптимизации используются индексы MongoDB на полях `artikul`, `quant`, `sklad`
- Группировка и сортировка выполняются в памяти после получения данных из БД

## Тестирование

Модуль покрыт тестами:

### Unit-тесты утилит

- `getPositionSector.test.ts` - тестирование извлечения сектора
- `sortPositionsBySector.test.ts` - тестирование сортировки
- `getProcessedQuantFromActionsUtil.test.ts` - тестирование парсинга actions
- `checkAskCompletionUtil.test.ts` - тестирование проверки завершённости

### Интеграционные тесты контроллеров

- `getPullsController.test.ts` - тестирование получения всех pulls
- `getPullByPalletIdController.test.ts` - тестирование получения pull по ID
- `processPullPositionController.test.ts` - тестирование обработки позиции

Запуск тестов:

```bash
npm test -- src/modules/pulls
```

## Заключение

Модуль Pulls обеспечивает эффективную систему управления извлечением товаров со склада, автоматизируя расчёт оптимальных маршрутов и отслеживание прогресса выполнения заявок. Интеграция с TanStack Query позволяет создавать отзывчивые интерфейсы с автоматическим обновлением данных.
