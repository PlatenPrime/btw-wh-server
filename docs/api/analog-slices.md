# API срезов аналогов (Analog Slices)

Эндпоинты для чтения ежедневных срезов остатков и цен аналогов по конкурентам. Все эндпоинты доступны роли USER (checkAuth + checkRoles(USER)).

## Эндпоинты

### GET `/api/analog-slices`

Получение среза по конкуренту и дате: весь документ среза (все артикулы конкурента за день).

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** query-параметры:

- `konkName`: string (обязательно)
- `date`: string (обязательно), формат YYYY-MM-DD

**Ответ 200:** `{ message: string, data: { konkName: string, date: Date, data: Record<string, IAnalogSliceDataItem> } }`, где ключи в `data` — артикулы, значения — `{ stock: number, price: number, artikul?: string }`.

**Ошибки:** 400 (невалидные параметры), 401, 403, 404 (срез не найден), 500.

---

### GET `/api/analog-slices/analog/:analogId`

Получение данных среза по конкретному аналогу на одну дату: одна точка (stock, price).

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path-параметр `analogId` — MongoDB ObjectId аналога. Query: `date` — string, формат YYYY-MM-DD (обязательно).

**Ответ 200:** `{ message: string, data: { stock: number, price: number } }`.

**Ошибки:** 400 (невалидный analogId или date), 401, 403, 404 (аналог не найден, у аналога пустой artikul или нет среза/записи на эту дату), 500.

---

### GET `/api/analog-slices/analog/:analogId/range`

Получение массива данных среза по аналогу за период дат (для графиков). Обе границы периода включительно.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path-параметр `analogId` — MongoDB ObjectId аналога. Query:

- `dateFrom`: string, YYYY-MM-DD (обязательно)
- `dateTo`: string, YYYY-MM-DD (обязательно), должна быть не раньше dateFrom

**Ответ 200:** `{ message: string, data: Array<{ date: string, stock: number, price: number }> }`. Поле `date` — строка в формате ISO (например `2026-03-01T00:00:00.000Z`). Массив отсортирован по дате по возрастанию. В массив попадают только те даты, по которым есть срез и запись для артикула данного аналога.

**Ошибки:** 400 (невалидный analogId, даты или dateFrom > dateTo), 401, 403, 404 (аналог не найден или у аналога пустой artikul), 500.

---

### GET `/api/analog-slices/analog/:analogId/comparison-excel`

Скачивание Excel-файла с таблицей сравнения срезов по аналогу (остаток/цена аналога) и по Btrade (остаток/цена Btrade) за указанный период. Колонки: Артикул, Назва (укр), Виробник, подписи рядов, даты, «Різниця», «Різниця, %».

**Доступ:** в текущей реализации без проверки авторизации (checkAuth/checkRoles закомментированы в роутере). При включении — USER.

**Запрос:** path-параметр `analogId` — MongoDB ObjectId аналога. Query:

- `dateFrom`: string, YYYY-MM-DD (обязательно)
- `dateTo`: string, YYYY-MM-DD (обязательно), должно быть ≥ dateFrom

**Ответ 200:** бинарное тело (Excel). Заголовки:

- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition: attachment; filename="analog_btrade_comparison_{artikul}_{dateFrom}_{dateTo}.xlsx"`

**Ошибки:** 400 (невалидный analogId, даты или dateFrom > dateTo; тело JSON: `{ message: "Validation error", errors: [...] }`), 404 (аналог не найден или у аналога пустой artikul; JSON: `{ message: "Analog not found or analog has no artikul" }`), 500.

---

## Формат данных

- **IAnalogSliceDataItem:** `{ stock: number, price: number, artikul?: string }`.
- **Элемент массива range:** `{ date: string (ISO), stock: number, price: number }` — подходит для использования в компонентах графиков (Recharts, shadcn/ui Chart).
