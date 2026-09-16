# API Excel Jobs

Базовый путь: `/api/excel-jobs`. Единственный способ получить XLSX. Старые Excel-URL отвечают 410 — см. таблицу `kind` ниже и [контракт для фронтенда](excel-jobs-frontend.md).

Доступ: checkAuth + checkRoles(ADMIN), кроме скачивания файла.

Поллинг: `pollIntervalMs` в ответе POST, рекомендуется 1000 мс.

TTL готового файла: 30 минут после `ready`. Download-token живёт 5 минут, при каждом GET job в статусе `ready` выдаётся новый.

---

## POST `/api/excel-jobs`

Постановка задачи.

**Тело:**

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| kind | string | да | Один из kind в таблице |
| params | object | нет, default `{}` | Параметры отчёта (бывший query/path/body) |

**Ответ 202:**

```
{
  "message": "Excel job accepted",
  "data": {
    "jobId": "string",
    "kind": "string",
    "status": "queued",
    "phase": "queued",
    "progress": 0,
    "queuePosition": 0,
    "expiresAt": "ISO-8601",
    "createdAt": "ISO-8601",
    "pollIntervalMs": 1000
  }
}
```

**Ошибки:** 400 валидация kind/params; 401; 403 роль ниже ADMIN; 429 уже есть 2 активных job у пользователя (`queued` или `running`).

---

## GET `/api/excel-jobs`

Список своих job, новые сверху, лимит 50.

**Query:** `status` — необязательно, через запятую: `queued`, `running`, `ready`, `failed`, `cancelled`, `expired`.

**Ответ 200:** `{ "message": "Excel jobs retrieved successfully", "data": [ ...как GET :id... ] }`

Для `ready` в каждом элементе может быть `downloadToken`.

---

## GET `/api/excel-jobs/:id`

Свой job. Чужой — 403, нет — 404.

**Ответ 200 `data`:**

| Поле | Когда |
|------|--------|
| jobId, kind, status, phase, progress | всегда |
| queuePosition | `0` если running, `1+` если в очереди, иначе `null` |
| fileName, sizeBytes | `ready` |
| downloadToken | только `status=ready` |
| error | `failed` |
| expiresAt, createdAt | всегда |

`phase`: `queued` \| `loading` \| `building` \| `finalizing`.

---

## DELETE `/api/excel-jobs/:id`

Отмена `queued` или `running`. Иначе 409.

**Ответ 200:** `{ "message": "Excel job cancelled", "data": { ...job } }`

---

## GET `/api/excel-jobs/:id/file?token=`

Стрим готового `.xlsx`. Без Bearer. `token` — `downloadToken` с GET job.

**Заголовки 200:** `Content-Type` spreadsheetml.sheet, `Content-Disposition: attachment`, `Content-Length`.

**Ошибки:** 400 нет token; 401 невалидный/просроченный token; 403 token от другого job/пользователя; 409 ещё не `ready`; 410 файл истёк или отсутствует на диске.

---

## kind и params

| kind | Старый URL | params |
|------|------------|--------|
| sku-catalog-new-since | GET `/api/sku-excel-reports/catalog/new-since` | `konk` string (`all` допустим), `since` YYYY-MM-DD |
| sku-catalog-invalid | GET `/api/sku-excel-reports/catalog/invalid` | `konk` string (`all` допустим) |
| sku-konk-stock | GET `/api/sku-excel-reports/konk/stock` | `konk`, `prod`, `dateFrom`, `dateTo`; опционально `skugrIds` |
| sku-konk-sales | GET `/api/sku-excel-reports/konk/sales` | как stock; опционально `sortBy`: `sales` \| `revenue` |
| sku-skugr-stock | GET `/api/sku-excel-reports/skugr/:skugrId/stock` | `skugrId`, `dateFrom`, `dateTo` |
| sku-skugr-sales | GET `/api/sku-excel-reports/skugr/:skugrId/sales` | `skugrId`, `dateFrom`, `dateTo` |
| sku-one-stock | GET `/api/sku-excel-reports/sku/:skuId/stock` | `skuId`, `dateFrom`, `dateTo` |
| sku-one-sales | GET `/api/sku-excel-reports/sku/:skuId/sales` | `skuId`, `dateFrom`, `dateTo` |
| art-stock | GET `/api/art-excel-reports/artikul/:artikul/stock` | `artikul`, `dateFrom`, `dateTo` |
| art-sales | GET `/api/art-excel-reports/artikul/:artikul/sales` | `artikul`, `dateFrom`, `dateTo` |
| analog-comparison | GET `/api/analog-slices/analog/:analogId/comparison-excel` | `analogId`, `dateFrom`, `dateTo` |
| analog-sales-comparison | GET `/api/analog-slices/analog/:analogId/sales-comparison-excel` | `analogId`, `dateFrom`, `dateTo` |
| konk-btrade-comparison | GET `/api/analog-slices/konk-btrade/comparison-excel` | `konk`, `prod`, `dateFrom`, `dateTo`; опционально `abc`, `sortBy=abc` |
| konk-btrade-sales-comparison | GET `/api/analog-slices/konk-btrade/sales-comparison-excel` | как konk-btrade-comparison |
| arts-export | GET `/api/arts/export` | `{}` |
| arts-export-with-stocks | GET `/api/arts/export-with-stocks` | `{}` |
| arts-export-keys | GET `/api/arts/export-keys` | `{}` |
| poses-export-stocks | POST `/api/poses/export-stocks` | опционально `sklad`: `merezhi` \| `pogrebi` |
| zones-export | GET `/api/zones/export` | `{}` |
| grabo-skus | GET `/api/grabo-skus/excel` | `{}` |

Даты — строки `YYYY-MM-DD`. Path-параметры старых URL входят в `params`.

Неуспех генерации (нет SKU/артикула/данных) — job `failed`, поле `error`, HTTP создания при этом был 202.

---

## Старые Excel-роуты

Те же пути и роли. Ответ **410**:

```
{
  "message": "Excel downloads moved to POST /api/excel-jobs",
  "code": "EXCEL_JOBS_MIGRATED",
  "kind": "<kind из таблицы>",
  "docsPath": "docs/api/excel-jobs.md",
  "frontendDocsPath": "docs/api/excel-jobs-frontend.md"
}
```
