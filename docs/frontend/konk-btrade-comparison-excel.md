# Экспорт Excel сравнения Btrade и конкурента по группе аналогов

Документация для фронтенда по эндпоинту скачивания Excel-отчёта сравнения срезов Btrade и конкурента сразу по группе аналогов (фильтр по конкуренту и производителю) за период.

См. также [экспорт по одному аналогу](./analog-btrade-comparison-excel.md). Отчёты по **продажам и выручке** (а не по остаткам) — [sales-comparison-excel.md](./sales-comparison-excel.md).

## Назначение

Эндпоинт возвращает файл `.xlsx` с таблицей, в которой:

- по горизонтали — даты выбранного периода, а также колонки «Різниця», «Різниця, %», «Δ Btrade vs конкурент, шт», «Δ Btrade vs конкурент, %»;
- по вертикали — блоки по 4 строки для каждого аналога:
  - `Залишок аналога`;
  - `Ціна аналога`;
  - `Залишок Btrade`;
  - `Ціна Btrade`.

Блоки для аналогов идут подряд и **отсортированы по артикулу по возрастанию**. Отчёт удобно использовать для аналитики по конкуренту в разрезе одного производителя.

## Маршрут и метод

- **Метод:** GET  
- **URL:** `/api/analog-slices/konk-btrade/comparison-excel`

Базовый путь API (например `https://api.example.com`) добавляется на фронте в зависимости от конфигурации.

## Параметры

У эндпоинта нет path-параметров, только query:

- `konk` — строка, **обязательно**. Ключ конкурента (`Konk.name`).
- `prod` — строка, **обязательно**. Ключ производителя (`Prod.name`).
- `dateFrom` — строка, формат `YYYY-MM-DD`, **обязательно**.
- `dateTo` — строка, формат `YYYY-MM-DD`, **обязательно**. Должна быть не раньше `dateFrom`.

Пример URL:  
`/api/analog-slices/konk-btrade/comparison-excel?konk=air&prod=gemar&dateFrom=2026-03-01&dateTo=2026-03-31`

Обычно `konk` и `prod` берутся из выбранных фильтров (дропдауны конкурента и производителя), а `dateFrom`/`dateTo` — из виджета выбора периода.

## Ответ при успехе

- **Статус:** 200.
- **Тело:** бинарный файл (Excel `.xlsx`). Не JSON.
- **Заголовки:**
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="konk_btrade_comparison_{konk}_{prod}_{dateFrom}_{dateTo}.xlsx"`

Имя файла можно взять из `Content-Disposition` для сохранения под правильным именем или сформировать на фронте по тому же шаблону.

## Как использовать на фронте

### Вариант 1: Ссылка или `window.open`

Формируем URL с учётом фильтров и подставляем его как `href` ссылки/кнопки или вызываем `window.open(url)`:

```ts
const API_BASE = ""; // базовый URL API из конфига

function getKonkExcelUrl(params: {
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
  return `${API_BASE}/api/analog-slices/konk-btrade/comparison-excel?${search.toString()}`;
}
```

Если позже на бэкенде будет включена проверка авторизации (`checkAuth`), для ссылок/`window.open` передавать токен сложнее, поэтому для защищённых эндпоинтов лучше использовать `fetch`.

### Вариант 2: `fetch` + программное скачивание

Подходит, если нужно:

- передать `Authorization` заголовок;
- единообразно обрабатывать ошибки (400/404) и показывать сообщения пользователю.

```ts
const API_BASE = ""; // или конфиг вашего API

export async function downloadKonkBtradeComparisonExcel(params: {
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

  const url = `${API_BASE}/api/analog-slices/konk-btrade/comparison-excel?${search.toString()}`;

  const headers: HeadersInit = {};
  if (params.token) {
    headers["Authorization"] = `Bearer ${params.token}`;
  }

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    const contentType = res.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await res.json();
      throw new Error(body.message ?? "Request failed");
    }
    throw new Error(`Request failed: ${res.status}`);
  }

  let fileName = `konk_btrade_comparison_${params.konk}_${params.prod}_${params.dateFrom}_${params.dateTo}.xlsx`;
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

> Рекомендация: оборачивайте вызов `downloadKonkBtradeComparisonExcel` в обработчик кнопки и показывайте `toast`/уведомление при ошибках.

## Обработка ошибок

- **400** — неверные параметры (`konk`, `prod`, даты или `dateFrom` > `dateTo`).  
  Тело: JSON `{ message: "Validation error", errors: [...] }`.  
  Рекомендация: подсветить поля фильтров/даты и показать текст `message`.

- **404** — для указанной пары `konk`/`prod` нет ни одного аналога с непустым `artikul`.  
  Тело: JSON `{ message: "Analogs not found for provided konk/prod" }`.  
  Рекомендация: показать пользователю, что для выбранной комбинации конкурента и производителя отчёт недоступен (например, \"нет данных для выгрузки\").

- **500** — внутренняя ошибка сервера. Обработать как общую ошибку запроса (общий алерт \"что-то пошло не так\", логирование и т.д.).

При использовании `fetch` проверяйте `res.ok` и при `!res.ok` читайте тело как JSON **только** если `Content-Type` содержит `application/json`; при 200 тело всегда бинарное (Excel).

