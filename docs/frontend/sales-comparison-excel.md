# Экспорт Excel сравнения продаж и выручки (аналог vs Btrade)

Документация для фронтенда по двум эндпоинтам скачивания Excel-отчётов **сравнения продаж и выручки** (а не остатков) по аналогу (конкуренту) и Btrade за период:

1. **По одному аналогу** — `GET /api/analog-slices/analog/:analogId/sales-comparison-excel`
2. **По группе аналогов** — `GET /api/analog-slices/konk-btrade/sales-comparison-excel`

Отчёты по остаткам (остаток/цена по датам) описаны в [konk-btrade-comparison-excel.md](./konk-btrade-comparison-excel.md) и [analog-btrade-comparison-excel.md](./analog-btrade-comparison-excel.md).

## Назначение

Эндпоинты возвращают файл `.xlsx`, в котором по датам выведены:

- **Продажі** — разница количества товара с предыдущим днём (если предыдущего нет или остаток вырос — 0; день поставки подсвечивается красным).
- **Ціна** — цена аналога / Btrade.
- **Виручка** — произведение продаж на цену (выручка за день).

Для каждого аналога блок из **6 строк**: Продажі аналога, Ціна аналога, Виручка аналога, Продажі Btrade, Ціна Btrade, Виручка Btrade. Далее колонка «Всього» (суммы по датам для продаж и выручки; ячейки цен пустые) и **четыре колонки дельт** (аналогично отчёту по остаткам, но для продаж и выручки):

- Δ Продажі Btrade vs конкурент, шт  
- Δ Продажі Btrade vs конкурент, %  
- Δ Виручка Btrade vs конкурент, грн  
- Δ Виручка Btrade vs конкурент, %

Внизу листа — итоговая секция в формате **ключ – значение** (две колонки): суммы продаж и выручки конкурента и Btrade, общая разница продаж (шт), разница выручки (грн), разница продаж (%), разница выручки (%).

---

## 1. Экспорт по одному аналогу

### Маршрут и метод

- **Метод:** GET  
- **URL:** `/api/analog-slices/analog/:analogId/sales-comparison-excel`

### Параметры

- **Path:** `analogId` — ID аналога (MongoDB ObjectId, строка).
- **Query:**
  - `dateFrom` — строка, формат `YYYY-MM-DD`, **обязательно**.
  - `dateTo` — строка, формат `YYYY-MM-DD`, **обязательно**. Должна быть не раньше `dateFrom`.

Пример URL:  
`/api/analog-slices/analog/507f1f77bcf86cd799439011/sales-comparison-excel?dateFrom=2026-03-01&dateTo=2026-03-31`

### Ответ при успехе

- **Статус:** 200.
- **Тело:** бинарный файл (Excel `.xlsx`). Не JSON.
- **Заголовки:**
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="analog_sales_comparison_{artikul}_{dateFrom}_{dateTo}.xlsx"`

### Ошибки

- **400** — невалидный `analogId`, даты или `dateFrom` > `dateTo`.  
  Тело: JSON `{ message: "Validation error", errors: [...] }`.
- **404** — аналог не найден или у аналога пустой артикул.  
  Тело: JSON `{ message: "Analog not found or analog has no artikul" }`.
- **500** — внутренняя ошибка сервера.

---

## 2. Экспорт по группе аналогов

### Маршрут и метод

- **Метод:** GET  
- **URL:** `/api/analog-slices/konk-btrade/sales-comparison-excel`

### Параметры

Только query-параметры (нет path):

- `konk` — строка, **обязательно**. Ключ конкурента (`Konk.name`).
- `prod` — строка, **обязательно**. Ключ производителя (`Prod.name`).
- `dateFrom` — строка, формат `YYYY-MM-DD`, **обязательно**.
- `dateTo` — строка, формат `YYYY-MM-DD`, **обязательно**. Должна быть не раньше `dateFrom`.

Пример URL:  
`/api/analog-slices/konk-btrade/sales-comparison-excel?konk=air&prod=gemar&dateFrom=2026-03-01&dateTo=2026-03-31`

### Ответ при успехе

- **Статус:** 200.
- **Тело:** бинарный файл (Excel `.xlsx`). Не JSON.
- **Заголовки:**
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="sales_comparison_{konk}_{prod}_{dateFrom}_{dateTo}.xlsx"`

### Ошибки

- **400** — невалидные параметры (`konk`, `prod`, даты или `dateFrom` > `dateTo`).  
  Тело: JSON `{ message: "Validation error", errors: [...] }`.
- **404** — для пары `konk`/`prod` не найдено ни одного аналога с непустым артикулом.  
  Тело: JSON `{ message: "Analogs not found for provided konk/prod" }`.
- **500** — внутренняя ошибка сервера.

---

## Как использовать на фронте

### Построение URL

```ts
const API_BASE = ""; // базовый URL API из конфига

// Один аналог
function getAnalogSalesExcelUrl(analogId: string, dateFrom: string, dateTo: string): string {
  const params = new URLSearchParams({ dateFrom, dateTo });
  return `${API_BASE}/api/analog-slices/analog/${analogId}/sales-comparison-excel?${params}`;
}

// Группа аналогов
function getKonkSalesExcelUrl(params: {
  konk: string;
  prod: string;
  dateFrom: string;
  dateTo: string;
}): string {
  const search = new URLSearchParams({
    konk: params.konk,
    prod: params.prod,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });
  return `${API_BASE}/api/analog-slices/konk-btrade/sales-comparison-excel?${search.toString()}`;
}
```

### Скачивание через fetch (один аналог)

Удобно для передачи `Authorization` и единообразной обработки ошибок:

```ts
async function downloadAnalogSalesComparisonExcel(
  analogId: string,
  dateFrom: string,
  dateTo: string,
  token?: string
): Promise<void> {
  const params = new URLSearchParams({ dateFrom, dateTo });
  const url = `${API_BASE}/api/analog-slices/analog/${analogId}/sales-comparison-excel?${params}`;
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    const contentType = res.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await res.json();
      throw new Error(body.message ?? "Request failed");
    }
    throw new Error(`Request failed: ${res.status}`);
  }

  let fileName = `analog_sales_comparison_${dateFrom}_${dateTo}.xlsx`;
  const disposition = res.headers.get("Content-Disposition");
  if (disposition) {
    const match = /filename="?([^";\n]+)"?/.exec(disposition);
    if (match) fileName = match[1]!.trim();
  }

  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}
```

### Скачивание через fetch (группа аналогов)

```ts
async function downloadKonkSalesComparisonExcel(params: {
  konk: string;
  prod: string;
  dateFrom: string;
  dateTo: string;
  token?: string;
}): Promise<void> {
  const search = new URLSearchParams({
    konk: params.konk,
    prod: params.prod,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });
  const url = `${API_BASE}/api/analog-slices/konk-btrade/sales-comparison-excel?${search.toString()}`;
  const headers: HeadersInit = {};
  if (params.token) headers["Authorization"] = `Bearer ${params.token}`;

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    const contentType = res.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await res.json();
      throw new Error(body.message ?? "Request failed");
    }
    throw new Error(`Request failed: ${res.status}`);
  }

  let fileName = `sales_comparison_${params.konk}_${params.prod}_${params.dateFrom}_${params.dateTo}.xlsx`;
  const disposition = res.headers.get("Content-Disposition");
  if (disposition) {
    const match = /filename="?([^";\n]+)"?/.exec(disposition);
    if (match) fileName = match[1]!.trim();
  }

  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}
```

Рекомендация: оборачивать вызовы в обработчик кнопки и показывать уведомление (toast) при ошибках.

### Общая обработка ошибок

При `!res.ok` проверяйте `Content-Type`: если в ответе `application/json`, парсите тело и показывайте `message` (и при необходимости `errors` для подсветки полей). При 200 тело всегда бинарное (Excel), не парсить как JSON.

---

## Краткая сводка эндпоинтов

| Сценарий           | Метод | URL                                                                 | Параметры |
|--------------------|-------|---------------------------------------------------------------------|-----------|
| Один аналог        | GET   | `/api/analog-slices/analog/:analogId/sales-comparison-excel`        | path: `analogId`; query: `dateFrom`, `dateTo` |
| Группа аналогов    | GET   | `/api/analog-slices/konk-btrade/sales-comparison-excel`             | query: `konk`, `prod`, `dateFrom`, `dateTo` |

Имена файлов: `analog_sales_comparison_{artikul}_{dateFrom}_{dateTo}.xlsx` и `sales_comparison_{konk}_{prod}_{dateFrom}_{dateTo}.xlsx` (можно взять из заголовка `Content-Disposition`).
