# Экспорт Excel сравнения аналога и Btrade

Документация для фронтенда по эндпоинту скачивания Excel-отчёта сравнения срезов аналога (конкурент) и Btrade за период.

## Назначение

Эндпоинт возвращает файл .xlsx с таблицей: остатки и цены аналога и Btrade по датам выбранного периода, колонки «Різниця» и «Різниця, %». Используется для выгрузки отчёта из карточки аналога или списка аналогов (выбор периода и кнопка «Скачать Excel»).

## Маршрут и метод

- **Метод:** GET  
- **URL:** `/api/analog-slices/analog/:analogId/comparison-excel`

Базовый путь API (например `https://api.example.com`) добавляется на фронте в зависимости от конфигурации.

## Параметры

- **Path:** `analogId` — ID аналога (MongoDB ObjectId, строка).
- **Query:**
  - `dateFrom` — строка, формат YYYY-MM-DD (обязательно).
  - `dateTo` — строка, формат YYYY-MM-DD (обязательно). Должна быть не раньше `dateFrom`.

Пример URL:  
`/api/analog-slices/analog/507f1f77bcf86cd799439011/comparison-excel?dateFrom=2026-03-01&dateTo=2026-03-31`

## Ответ при успехе

- **Статус:** 200.
- **Тело:** бинарный файл (Excel .xlsx). Не JSON.
- **Заголовки:**
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="analog_btrade_comparison_{artikul}_{dateFrom}_{dateTo}.xlsx"`

Имя файла можно взять из `Content-Disposition` для сохранения под правильным именем или сформировать на фронте по шаблону.

## Как использовать на фронте

### Вариант 1: Ссылка для скачивания

Подставить `analogId`, `dateFrom`, `dateTo` в URL и использовать как `href` кнопки/ссылки или `window.open(url)`. Браузер предложит сохранить файл. Учесть: если позже на бэкенде включат проверку авторизации (checkAuth), для GET-запроса со ссылкой передать токен будет сложнее — тогда предпочтителен вариант с `fetch`.

### Вариант 2: fetch + программное скачивание

Удобно для единообразной обработки ошибок (400, 404) и передачи заголовка авторизации. Пример:

```ts
const API_BASE = ""; // или конфиг вашего API

async function downloadComparisonExcel(
  analogId: string,
  dateFrom: string,
  dateTo: string,
  token?: string
): Promise<void> {
  const params = new URLSearchParams({ dateFrom, dateTo });
  const url = `${API_BASE}/api/analog-slices/analog/${analogId}/comparison-excel?${params}`;
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

  let fileName = `analog_btrade_comparison_${dateFrom}_${dateTo}.xlsx`;
  const disposition = res.headers.get("Content-Disposition");
  if (disposition) {
    const match = /filename="?([^";\n]+)"?/.exec(disposition);
    if (match) fileName = match[1].trim();
  }

  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}
```

При 400/404 сервер возвращает JSON — в примере выше обрабатывается только `message`; при необходимости можно разбирать `errors` для подсветки полей формы.

## Обработка ошибок

- **400** — неверные параметры (невалидный `analogId`, даты или `dateFrom` > `dateTo`).  
  Тело: JSON `{ message: "Validation error", errors: [...] }`.  
  Рекомендация: показать сообщение пользователю, подсветить поля (dateFrom, dateTo, при необходимости analogId).

- **404** — аналог не найден или у аналога пустой артикул.  
  Тело: JSON `{ message: "Analog not found or analog has no artikul" }`.  
  Рекомендация: показать сообщение, что выгрузка для этого аналога недоступна.

- **500** — внутренняя ошибка сервера. Обработать как общую ошибку запроса.

При использовании `fetch` проверяйте `res.ok` и при `!res.ok` читать тело как JSON только если `Content-Type` — `application/json`, иначе не парсить ответ в JSON (при 200 тело — бинарный Excel).
