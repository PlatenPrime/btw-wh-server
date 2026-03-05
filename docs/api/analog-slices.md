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

### GET `/api/analog-slices/konk-btrade/comparison-excel`

Скачивание Excel-файла с таблицей сравнения срезов Btrade и конкурента сразу по группе аналогов, отфильтрованных по конкуренту и производителю за указанный период. Для каждого аналога формируется блок из 4 строк (остаток/цена аналога и остаток/цена Btrade), блоки идут подряд и отсортированы по артикулу по возрастанию.

**Доступ:** в текущей реализации без проверки авторизации (checkAuth/checkRoles закомментированы в роутере). При включении — USER.

**Запрос:** только query-параметры:

- `konk`: string (обязательно) — ключ конкурента (`Konk.name`).
- `prod`: string (обязательно) — ключ производителя (`Prod.name`).
- `dateFrom`: string, YYYY-MM-DD (обязательно).
- `dateTo`: string, YYYY-MM-DD (обязательно), должно быть ≥ dateFrom.

**Ответ 200:** бинарное тело (Excel). Заголовки:

- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition: attachment; filename="konk_btrade_comparison_{konk}_{prod}_{dateFrom}_{dateTo}.xlsx"`

Структура таблицы аналогична одиночному отчёту по аналогу:

- Служебные колонки: `Артикул`, `Назва (укр)`, `Конкурент`, `Виробник`, подписи рядов.
- Далее по горизонтали — даты периода.
- Колонки «Різниця» и «Різниця, %» для каждой строки данных.
- Колонки «Δ Btrade vs конкурент, шт» и «Δ Btrade vs конкурент, %» для обобщающей динамики остатков Btrade против конкурента.

Особенности вычисления процентов:

- Если для строки «Різниця, %» процент посчитать нельзя (деление на 0), ячейка остаётся пустой, но подсвечивается бледно-розовым фоном.
- В обобщающей колонке «Δ Btrade vs конкурент, %» при нулевой динамике Btrade отображается `0` (не пустая ячейка).

**Ошибки:**

- `400` — невалидные параметры (`konk`, `prod`, даты или dateFrom > dateTo); тело JSON: `{ message: "Validation error", errors: [...] }`.
- `404` — для заданной пары `konk`/`prod` не найдено ни одного аналога с непустым artikul; тело JSON: `{ message: "Analogs not found for provided konk/prod" }`.
- `500` — внутренняя ошибка сервера.

## Формат данных

- **IAnalogSliceDataItem:** `{ stock: number, price: number, artikul?: string }`.
- **Элемент массива range:** `{ date: string (ISO), stock: number, price: number }` — подходит для использования в компонентах графиков (Recharts, shadcn/ui Chart).
