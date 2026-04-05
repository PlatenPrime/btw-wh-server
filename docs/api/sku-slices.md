# API срезов SKU (Sku Slices)

Эндпоинты чтения ежедневных срезов остатков и цен по SKU конкурентов. Для большинства маршрутов данные Btrade не используются; исключение — **konk-prod chart data** (сравнение агрегата SKU с Btrade по производителю или, при `prod=all`, по всему конкуренту и всем артикулам из Art). Доступ: checkAuth + checkRoles(USER), кроме случаев, если в коде роутера указано иное.

Для **графиков konk-prod**, **daily-summary по skugr**, **Excel продаж/остатков** и **JSON продаж по диапазону/дате** значения `-1` в остатке и цене в ряду дат перед расчётом заменяются на последнее валидное значение слева (см. модуль [sku-slices](../modules/sku-slices.md)); документы в коллекции срезов не изменяются. Листинг `GET /api/sku-slices` и сырые ряды без этой нормализации — по правилам конкретного маршрута.

## Общие правила валидации

- Во всех запросах, где есть пара `dateFrom` и `dateTo` в query, требуется **`dateFrom` ≤ `dateTo`**; иначе **400** (ошибка валидации).
- Параметры пути **`skuId`** и **`skugrId`** — строка валидного MongoDB ObjectId; иначе **400**.
- Для маршрутов с query-параметрами **`konk`** и **`prod`**: значения **trim** по краям, после trim непустые; иначе **400**.

## Эндпоинты

### GET `/api/sku-slices`

Срез по конкуренту и дате: постраничная выдача записей из поля `data` документа среза. Каждая запись сопоставляется с документом **Sku** по `productId` (ключ в `data` среза совпадает с `Sku.productId`). Порядок строк на всех страницах — лексикографическая сортировка по `productId`.

**Query:**

- `konkName` (string, обязательно)
- `date` (string, YYYY-MM-DD, обязательно)
- `page` (string в query, опционально) — номер страницы, по умолчанию `1`, после разбора целое число > 0
- `limit` (string в query, опционально) — размер страницы, по умолчанию `10`, после разбора целое от 1 до 100 включительно (как у `GET /api/skus`)
- `isInvalid` (string в query, опционально) — только `"true"` или `"false"`. При **`isInvalid=true`** в `items` попадают только позиции, которые по тем же правилам, что и компенсирующие срезы, считаются нуждающимися в повторном опросе: полный `-1` в остатке и цене или цена не является конечным неотрицательным числом. Если параметр не передан или **`false`**, выдаётся весь `data` (как раньше).

**Ответ 200:**

```text
{
  message: string,
  data: {
    konkName: string,
    date: Date (ISO в JSON),
    items: Array<{
      productId: string,
      stock: number,
      price: number,
      sku: Sku | null   // lean-документ из коллекции skus или null, если SKU с таким productId нет
    }>
  },
  pagination: {
    page: number,
    limit: number,
    total: number,       // число ключей в data среза; при isInvalid=true — только число «невалидных» позиций (см. query isInvalid)
    totalPages: number,
    hasNext: boolean,
    hasPrev: boolean
  }
}
```

**Ошибки:** 400 (невалидные query, в т.ч. `page`/`limit`), 401, 403, 404 (срез не найден), 500.

---

### GET `/api/sku-slices/sku/:skuId`

Одна точка остатка и цены по SKU на дату.

**Path:** `skuId` — валидный ObjectId (см. раздел «Общие правила валидации»).

**Query:** `date` (YYYY-MM-DD, обязательно).

**Ответ 200:** `{ message: string, data: { stock: number, price: number } }`.

**Ошибки:** 400, 401, 403, 404 (SKU не найден, нет `productId` или нет записи в срезе), 500.

---

### GET `/api/sku-slices/sku/:skuId/range`

Массив точек среза по SKU за период (включительно по границам). Только даты, где есть срез и запись для `productId` этого SKU.

**Path:** `skuId` — валидный ObjectId.

**Query:** `dateFrom`, `dateTo` (YYYY-MM-DD, обязательно), `dateFrom` ≤ `dateTo`.

**Ответ 200:** `{ message: string, data: Array<{ date: string (ISO), stock: number, price: number }> }` — сортировка по дате по возрастанию.

**Ошибки:** 400, 401, 403, 404 (SKU не найден или нет `productId`), 500.

---

### GET `/api/sku-slices/sku/:skuId/sales-by-date`

Продажи и выручка по SKU на одну дату (логика как у analog-slices: разница остатка с предыдущим днём, выручка = продажи × цена, признак дня поставки).

**Path:** `skuId` — валидный ObjectId.

**Query:** `date` (YYYY-MM-DD, обязательно).

**Ответ 200:** `{ message: string, data: { sales: number, revenue: number, price: number, isDeliveryDay: boolean } }`.

**Ошибки:** 400, 401, 403, 404, 500.

---

### GET `/api/sku-slices/sku/:skuId/sales-range`

Продажи и выручка по SKU за период; формат элементов как в analog sales-range.

**Path:** `skuId` — валидный ObjectId.

**Query:** `dateFrom`, `dateTo` (YYYY-MM-DD, обязательно), `dateFrom` ≤ `dateTo`.

**Ответ 200:** `{ message: string, data: Array<{ date: string (ISO), sales, revenue, price, isDeliveryDay }> }`.

**Ошибки:** 400, 401, 403, 404, 500.

---

### GET `/api/sku-slices/sku/:skuId/slice-excel`

Excel-файл остатков по одному SKU за период: украинские заголовки колонок метаданных (Назва, Посилання, Ідентифікатор товару, Конкурент, Виробник), колонки по датам, а также `Різниця` и `Різниця, %` для каждой строки метрики. В блоке SKU только две строки данных — `Залишок` и `Ціна` (строка `Виручка` отсутствует). Без данных Btrade.

**Path:** `skuId` — валидный ObjectId.

**Query:** `dateFrom`, `dateTo` (YYYY-MM-DD, обязательно), `dateFrom` ≤ `dateTo`.

**Ответ 200:** тело — бинарный XLSX. Заголовки: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `Content-Disposition: attachment; filename="sku_slice_<productId>_<dateFrom>_<dateTo>.xlsx"` (в имени файла недопустимые символы заменены).

**Ошибки:** 400, 401, 403, 404, 500.

---

### GET `/api/sku-slices/sku/:skuId/sales-excel`

Excel-файл продаж по одному SKU конкурента за период. В блоке SKU три строки метрик: `Продажі`, `Ціна`, `Виручка`. После блока добавляется компактная секция итогов по этому товару:
- `Продажі конкурента (всього), шт`
- `Виручка конкурента (всього), грн`

Файл не содержит сравнения с Btrade.

**Path:** `skuId` — валидный ObjectId.

**Query:** `dateFrom`, `dateTo` (YYYY-MM-DD, обязательно), `dateFrom` ≤ `dateTo`.

**Ответ 200:** бинарный XLSX. Заголовки: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `Content-Disposition: attachment; filename="sku_sales_<productId>_<dateFrom>_<dateTo>.xlsx"`.

**Ошибки:** 400, 401, 403, 404, 500.

---

### GET `/api/sku-slices/konk/excel`

Excel остатков по всем SKU с заданными `konkName` и `prodName` за период; сортировка по `productId`. SKU без непустого `productId` в выгрузку не попадают; если после отбора строк нет — 404.

Формат блока SKU такой же, как в `/sku/:skuId/slice-excel`: только строки `Залишок` и `Ціна` (без `Виручка`), с колонками `Різниця` и `Різниця, %`.

После всех товарных блоков добавляется итоговая строка `Підсумок`:
- в колонке `Різниця` — сумма разниц по всем SKU;
- в колонке `Різниця, %` — доля этой суммы от суммарного остатка на первую дату (в процентах).

**Query:** `konk`, `prod` (string, обязательно, trim и непустые после trim), `dateFrom`, `dateTo` (YYYY-MM-DD, обязательно), `dateFrom` ≤ `dateTo`.

**Ответ 200:** бинарный XLSX; имя файла вида `sku_slice_konk_<konk>_<prod>_<dateFrom>_<dateTo>.xlsx` с нормализацией символов в имени.

**Ошибки:** 400, 401, 403, 404 (нет подходящих SKU / нет строк с `productId`), 500.

---

### GET `/api/sku-slices/konk/sales-excel`

Excel-файл продаж по всем SKU с заданными `konkName` и `prodName` за период. Для каждого SKU строится блок из трех строк: `Продажі`, `Ціна`, `Виручка`.

Внизу листа добавляется общий итог по всем товарам этой группы (конкурент + производитель):
- `Загальні продажі, шт`
- `Загальна виручка, грн`

Файл не содержит сравнения с Btrade.

**Query:** `konk`, `prod` (string, обязательно, trim и непустые после trim), `dateFrom`, `dateTo` (YYYY-MM-DD, обязательно), `dateFrom` ≤ `dateTo`.

**Ответ 200:** бинарный XLSX; имя файла вида `sku_sales_konk_<konk>_<prod>_<dateFrom>_<dateTo>.xlsx` с нормализацией символов в имени.

**Ошибки:** 400, 401, 403, 404 (нет подходящих SKU / нет строк с `productId`), 500.

---

### GET `/api/sku-slices/konk-prod/stock-chart-data`

JSON для графика **остатков** (обычный режим): конкурент — сумма по всем SKU с **`konkName` и `prodName`, точно совпадающими** с query `konk` и `prod` после trim (регистр и полное совпадение строк важны); учитываются только SKU с непустым `productId`, данные остатков из `SkuSlice`. Btrade — сумма `quantity` по **всем артикулам**, у которых в справочнике **Art** поле `prodName` после trim совпадает с query `prod` **без учёта регистра** (в запросе к БД то же условие). Поле `Sku.btradeAnalog` в расчёте **не участвует**. Для каждого такого артикула берётся ряд из `BtradeSlice`; по артикулам суммируется остаток и (для sales-эндпоинта) продажи/выручка. Один элемент `days` на **каждый** календарный день периода (UTC-день, как у `daily-summary`). Форма `data` совпадает по полям с ответом `GET /api/analog-slices/konk-btrade/stock-comparison`: `days[]` с `date` (ISO string), `competitorStock`, `btradeStock`; `summary` — первый/последний день и дельты по обеим сериям.

**Режим `prod=all`:** если после trim `prod` **строго** равен строке `all` (другой регистр, например `ALL`, не считается этим режимом), конкурент — сумма по **всем** SKU с данным `konkName` и непустым `productId` (без фильтра по производителю); Btrade — сумма по **всем** уникальным непустым `artikul` из коллекции **Art** (без фильтра по `prodName`). Правила нормализации `-1` и расчёта рядов те же.

**Query:** `konk`, `prod` (string, обязательно, trim и непустые после trim), `dateFrom`, `dateTo` (YYYY-MM-DD, обязательно), `dateFrom` ≤ `dateTo`.

**Ответ 200:** `{ message: string, data: { days: [...], summary: { firstDayCompetitorStock, lastDayCompetitorStock, firstDayBtradeStock, lastDayBtradeStock, diffCompetitorStock, diffBtradeStock, diffCompetitorStockPct, diffBtradeStockPct } } }` — числа в summary как у analog; проценты могут быть `null`.

**Ошибки:** 400, 401, 403, 404 (нет ни одного SKU с `productId` для данного `konk` в обычном режиме — для пары `konk`/`prod`; в режиме `prod=all` — нет SKU с `productId` у этого конкурента), 500.

**Примечание:** в обычном режиме, если ни у одного **Art** нет `prodName`, совпадающего с query `prod`, серия Btrade в `days` — нули (в т.ч. при наличии строк в `BtradeSlice` по артикулам без подходящего Art); ответ остаётся 200.

**Примечание:** значение `prod=all` **только** для эндпоинтов `konk-prod/*-chart-data`. В **Excel** по `konk` + `prod` (`/api/sku-slices/konk/excel`, `/api/sku-slices/konk/sales-excel`) параметр `prod` всегда трактуется как имя производителя; строка `all` не включает описанный здесь агрегат.

---

### GET `/api/sku-slices/konk-prod/sales-chart-data`

JSON для графика **продаж и выручки**: та же выборка SKU и тот же набор артикулов Btrade, что у `stock-chart-data`. Продажи и выручка считаются по тем же правилам, что у analog-slices и `skugr/daily-summary` (изменение остатка между соседними днями периода, выручка × цена дня), затем суммируются по SKU (конкурент) и по уникальным артикулам (Btrade). Форма `data` как у `GET /api/analog-slices/konk-btrade/sales-comparison`: `days[]` — `date`, `competitorSales`, `competitorRevenue`, `btradeSales`, `btradeRevenue`; `summary` — итоги и дельты Btrade минус конкурент, проценты.

**Query:** как у `konk-prod/stock-chart-data`.

**Ответ 200:** `{ message: string, data: { days: [...], summary: { totalCompetitorSales, totalBtradeSales, totalCompetitorRevenue, totalBtradeRevenue, diffSalesPcs, diffRevenueUah, diffSalesPct, diffRevenuePct } } }`.

**Ошибки:** 400, 401, 403, 404 — как у `stock-chart-data`, 500.

---

### GET `/api/sku-slices/skugr/:skugrId/daily-summary`

Дневные **агрегаты по товарной группе** (Skugr): список SKU берётся из `skugr.skus` (только записи с непустым `productId`). Конкурент и производитель в query не передаются — для выборки срезов используются фактические `konkName` и `productId` каждого SKU.

По каждому календарному дню диапазона (включительно): сумма остатков по всем SKU группы; сумма продаж (шт.) и сумма выручки (грн) — продажи считаются по той же логике, что у одного SKU (последовательность остатков по дням и цена дня), затем суммируются по SKU.

**Path:** `skugrId` — валидный ObjectId.

**Query:** `dateFrom`, `dateTo` (YYYY-MM-DD, обязательно), `dateFrom` ≤ `dateTo`.

**Ответ 200:** `{ message: string, data: Array<{ date: string (ISO), stock: number, sales: number, revenue: number }> }` — по одному элементу на каждый день периода, по возрастанию даты.

**Ошибки:** 400, 401, 403, 404 (группа не найдена или нет ни одного SKU с `productId` в `skugr.skus`), 500.

---

### GET `/api/sku-slices/skugr/:skugrId/slice-excel`

Excel остатков по SKU из **товарной группы** (`skugr.skus`) за период. Порядок строк соответствует порядку `skugr.skus`. Подписи конкурента и производителя в шапке — из справочников по `skugr.konkName` и `skugr.prodName`; значения в ячейках дат читаются по `konkName` каждого SKU.

Формат как у `/konk/excel`: строки `Залишок` и `Ціна`, колонки `Різниця` / `Різниця, %`, в конце строка `Підсумок`.

**Path:** `skugrId` — валидный ObjectId.

**Query:** `dateFrom`, `dateTo` (YYYY-MM-DD, обязательно), `dateFrom` ≤ `dateTo`.

**Ответ 200:** бинарный XLSX; имя файла вида `sku_slice_skugr_<skugrId>_<dateFrom>_<dateTo>.xlsx` (в идентификаторе и датах недопустимые символы нормализуются).

**Ошибки:** 400, 401, 403, 404 (нет skugr / нет строк с `productId`), 500.

---

### GET `/api/sku-slices/skugr/:skugrId/sales-excel`

Excel продаж по SKU из товарной группы за период. Логика блоков и итогов как у `/konk/sales-excel`: для каждого SKU три строки метрик, внизу листа `Загальні продажі, шт` и `Загальна виручка, грн`.

**Path:** `skugrId` — валидный ObjectId.

**Query:** `dateFrom`, `dateTo` (YYYY-MM-DD, обязательно), `dateFrom` ≤ `dateTo`.

**Ответ 200:** бинарный XLSX; имя файла вида `sku_sales_skugr_<skugrId>_<dateFrom>_<dateTo>.xlsx`.

**Ошибки:** 400, 401, 403, 404 (нет skugr / нет строк с `productId`), 500.
