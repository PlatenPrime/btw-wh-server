# API срезов SKU (Sku Slices)

Эндпоинты чтения ежедневных срезов остатков и цен по SKU конкурентов. Данные Btrade не используются. Доступ: checkAuth + checkRoles(USER), кроме случаев, если в коде роутера указано иное.

## Эндпоинты

### GET `/api/sku-slices`

Срез по конкуренту и дате: весь документ (`konkName`, `date`, `data`). Ключи в `data` — `Sku.productId`, значения — `{ stock: number, price: number }`.

**Query:** `konkName` (string, обязательно), `date` (string, YYYY-MM-DD, обязательно).

**Ответ 200:** `{ message: string, data: { konkName, date, data: Record<string, { stock, price }> } }`.

**Ошибки:** 400, 401, 403, 404 (срез не найден), 500.

---

### GET `/api/sku-slices/sku/:skuId`

Одна точка остатка и цены по SKU на дату.

**Query:** `date` (YYYY-MM-DD, обязательно).

**Ответ 200:** `{ message: string, data: { stock: number, price: number } }`.

**Ошибки:** 400, 401, 403, 404 (SKU не найден, нет `productId` или нет записи в срезе), 500.

---

### GET `/api/sku-slices/sku/:skuId/range`

Массив точек среза по SKU за период (включительно по границам). Только даты, где есть срез и запись для `productId` этого SKU.

**Query:** `dateFrom`, `dateTo` (YYYY-MM-DD, обязательно), `dateFrom` ≤ `dateTo`.

**Ответ 200:** `{ message: string, data: Array<{ date: string (ISO), stock: number, price: number }> }` — сортировка по дате по возрастанию.

**Ошибки:** 400, 401, 403, 404 (SKU не найден или нет `productId`), 500.

---

### GET `/api/sku-slices/sku/:skuId/sales-by-date`

Продажи и выручка по SKU на одну дату (логика как у analog-slices: разница остатка с предыдущим днём, выручка = продажи × цена, признак дня поставки).

**Query:** `date` (YYYY-MM-DD, обязательно).

**Ответ 200:** `{ message: string, data: { sales: number, revenue: number, price: number, isDeliveryDay: boolean } }`.

**Ошибки:** 400, 401, 403, 404, 500.

---

### GET `/api/sku-slices/sku/:skuId/sales-range`

Продажи и выручка по SKU за период; формат элементов как в analog sales-range.

**Query:** `dateFrom`, `dateTo` (YYYY-MM-DD, обязательно).

**Ответ 200:** `{ message: string, data: Array<{ date: string (ISO), sales, revenue, price, isDeliveryDay }> }`.

**Ошибки:** 400, 401, 403, 404, 500.

---

### GET `/api/sku-slices/sku/:skuId/slice-excel`

Excel-файл по одному SKU за период: украинские заголовки колонок метаданных (Назва, Посилання, Ідентифікатор товару, Конкурент, Виробник) и колонки по датам; две строки данных — залишок и ціна. Без данных Btrade.

**Query:** `dateFrom`, `dateTo` (YYYY-MM-DD, обязательно).

**Ответ 200:** тело — бинарный XLSX. Заголовки: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `Content-Disposition: attachment; filename="sku_slice_<productId>_<dateFrom>_<dateTo>.xlsx"` (в имени файла недопустимые символы заменены).

**Ошибки:** 400, 401, 403, 404, 500.

---

### GET `/api/sku-slices/konk/excel`

Excel по всем SKU с заданными `konkName` и `prodName` за период; сортировка по `productId`. SKU без непустого `productId` в выгрузку не попадают; если после отбора строк нет — 404.

**Query:** `konk`, `prod` (string, обязательно), `dateFrom`, `dateTo` (YYYY-MM-DD, обязательно).

**Ответ 200:** бинарный XLSX; имя файла вида `sku_slice_konk_<konk>_<prod>_<dateFrom>_<dateTo>.xlsx` с нормализацией символов в имени.

**Ошибки:** 400, 401, 403, 404 (нет подходящих SKU / нет строк с `productId`), 500.
