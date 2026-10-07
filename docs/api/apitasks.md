# API ApiTasks

Базовый путь: `/api/apitasks`. Способ запуска долгих action-задач. Старые доменные URL отвечают 410 — см. таблицу `kind` ниже и [контракт для фронтенда](apitasks-frontend.md).

Доступ: checkAuth + checkRoles(EDITOR) на роутере; внутри create дополнительно проверяется `minRole` kind (ADMIN / PRIME / EDITOR).

Поллинг: `pollIntervalMs` в ответе POST, рекомендуется 1000 мс.

TTL результата: 24 часа после `completed`.

---

## POST `/api/apitasks`

Постановка задачи.

**Тело:**

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| kind | string | да | Один из kind в таблице |
| params | object | нет, default `{}` | Параметры задачи |

**Ответ 202:**

```
{
  "message": "Api task accepted",
  "data": {
    "taskId": "string",
    "kind": "string",
    "status": "queued",
    "phase": "queued",
    "progress": 0,
    "queuePosition": 0,
    "expiresAt": "ISO-8601",
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601",
    "pollIntervalMs": 1000
  }
}
```

**Ошибки:** 400 валидация kind/params; 401; 403 роль ниже minRole kind; 409 уже есть активная задача с тем же resourceKey; 429 уже есть 3 активных задачи у пользователя.

---

## GET `/api/apitasks`

Список своих задач, новые сверху, лимит 50.

**Query:** `status` — необязательно, через запятую: `queued`, `running`, `completed`, `failed`, `cancelled`, `expired`.

**Ответ 200:** `{ "message": "Api tasks retrieved successfully", "data": [ ...как GET :id... ] }`

---

## GET `/api/apitasks/:id`

Своя задача. Чужой — 403, нет — 404.

**Ответ 200 `data`:**

| Поле | Когда |
|------|--------|
| taskId, kind, status, phase, progress | всегда |
| queuePosition | `0` если running, `1+` если в очереди, иначе `null` |
| message | при наличии |
| result | `completed` |
| error | `failed` |
| expiresAt, createdAt, updatedAt | всегда |

`phase`: `queued` \| `preparing` \| `running` \| `finalizing`.

---

## DELETE `/api/apitasks/:id`

Отмена `queued` или `running`. Иначе 409.

**Ответ 200:** `{ "message": "Api task cancelled", "data": { ...task } }`

---

## kind и params

| kind | Старый URL | params | minRole |
|------|------------|--------|---------|
| sku-slices.skugr-run-today | POST `/api/sku-slices/skugr/:skugrId/run-today` | `skugrId` ObjectId string | ADMIN |
| sku-slices.post-corrections.run | POST `/api/sku-slices/post-corrections/run` | `dateFrom`, `dateTo` string YYYY-MM-DD (inclusive, max 31 days); `apply?` boolean default false | ADMIN |
| slice-compensation.run | POST `/api/slice-compensation/run` | `konkName` string | ADMIN |
| skugrs.fill-skus | POST `/api/skugrs/id/:id/fill-skus` | `skugrId` string, `maxPages?` 1–200 | ADMIN |
| grabo-skus.sync | POST `/api/grabo-skus/sync` | `{}` | ADMIN |
| arts.btrade-stock-update-all | POST `/api/arts/btrade-stock/update-all` | `{}` | ADMIN |
| dels.artikuls-update-all | POST `/api/dels/:id/artikuls/update-all` | `delId` ObjectId string | ADMIN |
| pallet-groups.recalculate-pallets-sectors | POST `/api/pallet-groups/recalculate-pallets-sectors` | `{}` | ADMIN |
| blocks.recalculate-zones-sectors | POST `/api/blocks/recalculate-zones-sectors` | `{}` | ADMIN |
| poses.populate-missing-data | POST `/api/poses/populate-missing-data` | `{}` | EDITOR |
| skus.fix-incorrect-sku-data | POST `/api/skus/fix-incorrect-sku-data` | `filter`, `updates` (как раньше в body) | ADMIN |
| skus.delete-konk-invalid | DELETE `/api/skus/konk/:konkName/invalid` | `konkName` string или `all` | PRIME |
| skus.delete-not-in-any-skugr | DELETE `/api/skus/not-in-any-skugr` | опциональные фильтры списка SKU без page/limit | PRIME |
| arts.delete-without-latest-marker | DELETE `/api/arts/without-latest-marker` | `{}` | PRIME |

Старые URL: **410** `{ code: "API_TASKS_MIGRATED", kind, docsPath, frontendDocsPath, message }`.
