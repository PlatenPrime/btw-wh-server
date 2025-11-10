# Модуль `pulls`

## Оглавление
1. [Введение](#введение)
2. [Структура проекта](#структура-проекта)
3. [Формат ответа API](#формат-ответа-api)
4. [Правила расчёта](#правила-расчёта)
5. [HTTP API](#http-api)
6. [Гайд для фронтенда](#гайд-для-фронтенда)
7. [Краевые случаи и защита](#краевые-случаи-и-защита)
8. [Тестовое покрытие](#тестовое-покрытие)
9. [Чеклист интеграции](#чеклист-интеграции)

## Введение

Модуль `pulls` рассчитывает список паллет, с которых нужно снять товар, исходя из активных заявок (`asks`) и текущих остатков (`poses`). Никаких мутаций складских данных больше нет: контроллер отдаёт только вычисленный список, после чего фронтенд решает, как отображать прогресс и организовывать снятие.

Ключевые изменения по сравнению с прежней версией:
- убраны эндпоинты `GET /api/pulls/:palletId` и `PATCH /api/pulls/:palletId/positions/:posId`;
- расчёт учитывает поля `pullQuant` и `pullBox` из заявки;
- заявки без требуемого количества исключаются из расчёта, если по ним уже зафиксирован любой факт снятия;
- весь функционал сфокусирован на одном маршруте `GET /api/pulls`.

## Структура проекта

```
src/modules/pulls/
├── controllers/
│   ├── __tests__/
│   │   └── getPullsController.test.ts
│   └── get-pulls/
│       ├── getPullsController.ts
│       └── schemas/
│           └── getPullsSchema.ts
├── models/
│   └── Pull.ts
├── router.ts
└── utils/
    ├── __tests__/
    │   ├── distributeAsksToPositionsUtil.test.ts
    │   ├── getNewAsksUtil.test.ts
    │   ├── getPositionSector.test.ts
    │   └── sortPositionsBySector.test.ts
    ├── buildPullObjectUtil.ts
    ├── calculatePullsUtil.ts
    ├── createPullPositionUtil.ts
    ├── distributeAsksToPositionsUtil.ts
    ├── getAvailablePositionsUtil.ts
    ├── getNewAsksUtil.ts
    ├── getPositionSector.ts
    ├── groupAsksByArtikulUtil.ts
    └── groupPullPositionsByPalletUtil.ts
```

## Формат ответа API

```typescript
interface IPullsResponse {
  pulls: IPull[];
  totalPulls: number; // количество паллет с заданиями
  totalAsks: number;  // количество заявок, которые ещё ждут действия
}

interface IPull {
  palletId: Types.ObjectId;
  palletTitle: string;
  sector: number;   // 0 если сектор не задан
  rowTitle: string;
  positions: IPullPosition[];
  totalAsks: number; // уникальные заявки внутри паллеты
}

interface IPullPosition {
  posId: Types.ObjectId;
  artikul: string;
  nameukr?: string;
  currentQuant: number;
  currentBoxes: number;
  plannedQuant: number | null;       // сколько нужно снять именно с этой позиции (null => решает сборщик)
  totalRequestedQuant: number | null; // полное требуемое количество из заявки (null если не указано)
  alreadyPulledQuant: number;        // сколько уже снято по заявке (шт.)
  alreadyPulledBoxes: number;        // сколько уже снято по заявке (коробок)
  askId: Types.ObjectId;
  askerData: AskUserData;
}
```

### Пример ответа

```json
{
  "success": true,
  "message": "Pulls calculated successfully",
  "data": {
    "pulls": [
      {
        "palletId": "6568d4e0550102f4b6b2d001",
        "palletTitle": "Pallet A",
        "sector": 3,
        "rowTitle": "Row 5",
        "positions": [
          {
            "posId": "6568d4e0550102f4b6b2d101",
            "artikul": "ART-001",
            "nameukr": "Горіх волоський",
            "currentQuant": 42,
            "currentBoxes": 4,
            "plannedQuant": 7,
            "totalRequestedQuant": 10,
            "alreadyPulledQuant": 3,
            "alreadyPulledBoxes": 1,
            "askId": "6568d4e0550102f4b6b2d201",
            "askerData": {
              "_id": "6568d4e0550102f4b6b2d301",
              "fullname": "Оператор складу",
              "telegram": "@warehouse_operator",
              "photo": ""
            }
          }
        ],
        "totalAsks": 1
      }
    ],
    "totalPulls": 1,
    "totalAsks": 1
  }
}
```

## Правила расчёта

### 1. Отбор заявок
1. Берём только заявки со статусом `new`.
2. Если у заявки указано `quant > 0`, то она попадает в расчёт, только если `pullQuant < quant`.
3. Если `quant` не задан (или `<= 0`), заявка попадает в расчёт **только** если `pullQuant === 0` и `pullBox === 0`. Любой факт снятия переводит такую заявку в разряд удовлетворённых.

### 2. Распределение по позициям
1. Заявки группируются по `artikul`.
2. Для каждого артикула запрашиваются позиции на складе `"pogrebi"` с `quant > 0`.
3. Позиции сортируются по сектору (возрастающе).
4. Остаток количества (`quant - pullQuant`) раскладывается по позициям жадно (минимизируем перемещения, но не уменьшаем фактические остатки в базе).
5. Для заявок без `quant` формируется одна запись на позицию с минимальным сектором, `plannedQuant` устанавливается в `null`, сигнализируя фронтенду, что решение принимает человек.

### 3. Группировка по паллетам
1. Все расчётные позиции объединяются по `palletId`.
2. Метаданные паллеты и ряда подмешиваются через `groupPullPositionsByPalletUtil` за один проход по базе.
3. Pulls сортируются по секторам, `totalAsks` отражает число уникальных заявок на паллете.

### 4. Агрегаты ответа
- `totalAsks` в корне ответа — количество заявок, которые ещё требуют внимания (с учётом фильтра по `pullQuant`/`pullBox`).
- Если подходящих позиций нет, но заявки остались, то `pulls` будет пустым, а `totalAsks > 0` — фронтенд может подсветить дефицит.

## HTTP API

### GET `/api/pulls`

- **Доступ**: `ADMIN`, `PRIME`.
- **Тело запроса**: нет (параметры не требуются).
- **Ответы**:
  - `200 OK` — успешный расчёт, структура как в примере выше.
  - `500 Internal Server Error` — сбой во время расчёта (ошибка логируется, в ответе указывается текст исключения).

Пример запроса с TanStack Query:

```typescript
import { useQuery } from "@tanstack/react-query";

export const usePulls = () =>
  useQuery({
    queryKey: ["pulls"],
    queryFn: async () => {
      const response = await fetch("/api/pulls", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to load pulls");
      const payload = await response.json();
      return payload.data;
    },
    refetchInterval: 30_000,
  });
```

## Гайд для фронтенда

- **`plannedQuant`**:
  - > 0 — возьмите указанное количество (остатки уже скоррелированы с учётом `pullQuant`).
  - `null` — заявка без жёсткого количества, оператор сам решает, сколько снимать; показываем как «відкрита заявка».
- **`totalRequestedQuant`**:
  - Можно показывать как «заявлено / виконано»: `alreadyPulledQuant / totalRequestedQuant`.
  - `null` — у заявки нет целевого значения, показывать только факт снятия (`alreadyPulledQuant`).
- **`alreadyPulledQuant` / `alreadyPulledBoxes`**:
  - Фронтенд не должен обнулять прогресс локально. Эти значения приходят непосредственно из заявки.
- **`totalAsks` в ответе**:
  - Используйте для виджетов статуса (например, «Очікує виконання: X заявок»).
- **Обновление данных**:
  - После действий операторов (через модуль `asks`) достаточно инвалидировать кэш `["pulls"]`.

### UX-подсказки
- Сортировка уже идёт по сектору, фронтенд может группировать вывод по `rowTitle`.
- Если `totalRequestedQuant` есть, но `plannedQuant` меньше — значит часть заявки уже закрыта или остаток меньше запроса. Отмечайте карточку как частично выполненную.
- Если паллета пропала из списка, но `totalAsks` уменьшилось, заявка была удовлетворена.

## Краевые случаи и защита

- Позиции, удалённые между расчётом и выборкой, пропускаются с логом (`console.warn`) и не ломают расчёт.
- Отсутствие доступных позиций для артикула — текущая заявка не попадёт в `pulls`, но будет посчитана в `totalAsks`, чтобы фронтенд мог подсветить дефицит.
- Все обращения к базе выполняются в максимально «плоских» запросах: `Pos.findById` больше не вызывается в цикле, вместо этого используется батчевое чтение.

## Тестовое покрытие

- `controllers/__tests__/getPullsController.test.ts` — проверяем корректный HTTP-ответ и обработку ошибок.
- `utils/__tests__/getNewAsksUtil.test.ts` — фильтрация заявок с учётом `pullQuant/pullBox`.
- `utils/__tests__/distributeAsksToPositionsUtil.test.ts` — вычисление `plannedQuant` и работа с заявками без количества.
- Базовые юниты на сортировку и сектор (`getPositionSector`, `sortPositionsBySector`) сохранены.

## Чеклист интеграции

- [ ] Подтянуть `GET /api/pulls` и обновить клиентскую схему под новые поля.
- [ ] Вывести `plannedQuant`, `totalRequestedQuant`, `alreadyPulledQuant` и `alreadyPulledBoxes` в UI.
- [ ] Для заявок без количества использовать специальный сценарий (manual pick).
- [ ] Перестать обращаться к удалённым эндпоинтам (`GET /api/pulls/:palletId`, `PATCH /api/pulls/...`).
- [ ] При изменении заявки (через модуль `asks`) инвалидировать кэш `["pulls"]`.

