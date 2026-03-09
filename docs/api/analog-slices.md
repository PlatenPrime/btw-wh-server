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

Скачивание Excel-файла с таблицей сравнения срезов по аналогу (остаток/цена аналога) и по Btrade (остаток/цена Btrade) за указанный период. Колонки: Артикул, Назва (укр), Виробник, подписи рядов, даты, «Різниця», «Різниця, %», «Δ Btrade vs конкурент, шт», «Δ Btrade vs конкурент, %». После блока данных — итоговый блок из 2 строк «ВСЬОГО» с суммами разниц в колонке «Різниця», суммарной разницей в «Δ Btrade vs конкурент, шт» и процентом в «Δ Btrade vs конкурент, %» по формуле (сумма Btrade / сумма аналога − 1).

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
- После всех блоков аналогов — итоговый блок из 2 строк «ВСЬОГО»: в колонке «Різниця» — суммы разниц по аналогу и по Btrade по всем блокам, в колонке «Δ Btrade vs конкурент, шт» — суммарная разница, в колонке «Δ Btrade vs конкурент, %» — процент по той же формуле (сумма изменений Btrade / сумма изменений аналога − 1).

Особенности вычисления процентов:

- Если для строки «Різниця, %» процент посчитать нельзя (деление на 0), ячейка остаётся пустой, но подсвечивается бледно-розовым фоном.
- В обобщающей колонке «Δ Btrade vs конкурент, %» значение считается по формуле (изменение Btrade / изменение аналога − 1) в процентах. При нулевой динамике аналога ячейка пустая и подсвечивается бледно-розовым фоном.

**Ошибки:**

- `400` — невалидные параметры (`konk`, `prod`, даты или dateFrom > dateTo); тело JSON: `{ message: "Validation error", errors: [...] }`.
- `404` — для заданной пары `konk`/`prod` не найдено ни одного аналога с непустым artikul; тело JSON: `{ message: "Analogs not found for provided konk/prod" }`.
- `500` — внутренняя ошибка сервера.

---

### GET `/api/analog-slices/analog/:analogId/sales-comparison-excel`

Скачивание Excel-файла с таблицей сравнения **продаж и выручки** по аналогу (конкурент) и Btrade за указанный период. В ячейках по датам — не остатки, а продажи (разница остатка с предыдущим днём; при отсутствии предыдущего или при росте остатка — 0, в день поставки 0 подсвечивается красным), цены и выручка (продажи × цена). Блок на аналог — 6 строк: Продажі аналога, Ціна аналога, Виручка аналога, Продажі Btrade, Ціна Btrade, Виручка Btrade. Колонка «Всього» — суммы по датам (для продаж и выручки; ячейки цен пустые). Четыре колонки дельт: Δ Продажі Btrade vs конкурент (шт и %), Δ Виручка Btrade vs конкурент (грн и %); логика как для отчёта по остаткам (разница Btrade − конкурент, процент от (Btrade/конкурент − 1)); при нуле знаменателя — пусто и бледно-розовая заливка. Внизу — итоговая секция в две колонки (ключ–значение): суммы продаж и выручки конкурента и Btrade, общая разница продаж (шт), разница выручки (грн), разница продаж (%), разница выручки (%).

**Доступ:** в текущей реализации без проверки авторизации (checkAuth/checkRoles закомментированы в роутере). При включении — USER.

**Запрос:** path-параметр `analogId` — MongoDB ObjectId аналога. Query: `dateFrom`, `dateTo` — string, YYYY-MM-DD (обязательно), dateTo ≥ dateFrom.

**Ответ 200:** бинарное тело (Excel). Заголовки: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `Content-Disposition: attachment; filename="analog_sales_comparison_{artikul}_{dateFrom}_{dateTo}.xlsx"`.

**Ошибки:** 400 (невалидный analogId или даты; JSON: `{ message: "Validation error", errors: [...] }`), 404 (аналог не найден или пустой artikul; JSON: `{ message: "Analog not found or analog has no artikul" }`), 500.

---

### GET `/api/analog-slices/konk-btrade/sales-comparison-excel`

Скачивание Excel-файла с таблицей сравнения **продаж и выручки** по группе аналогов (фильтр по конкуренту и производителю) за период. Структура та же, что у одиночного отчёта продаж: первые 4 колонки (Артикул, Назва, Конкурент, Виробник), 5-я — подписи 6 строк, далее колонки дат (продажи/ціна/виручка аналога и Btrade), колонка «Всього», четыре колонки дельт (Δ Продажі шт, Δ Продажі %, Δ Виручка грн, Δ Виручка %). Значения дельт записываются в первую строку каждого 6-строчного блока и отображаются в объединённых ячейках. После всех блоков — итоговая секция ключ–значение (суммы продаж/выручки, разницы в шт, грн и в %).

**Доступ:** в текущей реализации без проверки авторизации. При включении — USER.

**Запрос:** только query: `konk`, `prod` (string, обязательно), `dateFrom`, `dateTo` (string, YYYY-MM-DD, обязательно), dateTo ≥ dateFrom.

**Ответ 200:** бинарное тело (Excel). Заголовки: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `Content-Disposition: attachment; filename="sales_comparison_{konk}_{prod}_{dateFrom}_{dateTo}.xlsx"`.

**Ошибки:** 400 (невалидные параметры; JSON: `{ message: "Validation error", errors: [...] }`), 404 (нет аналогов для konk/prod; JSON: `{ message: "Analogs not found for provided konk/prod" }`), 500.

## Формат данных

- **IAnalogSliceDataItem:** `{ stock: number, price: number, artikul?: string }`.
- **Элемент массива range:** `{ date: string (ISO), stock: number, price: number }` — подходит для использования в компонентах графиков (Recharts, shadcn/ui Chart).
