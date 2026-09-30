# Фронтенд: scrape срезов группы на сегодня

Операция перенесена в ApiTasks.

1. `POST /api/apitasks` с `{ "kind": "sku-slices.skugr-run-today", "params": { "skugrId": "<id>" } }` → **202** + `taskId`.
2. Не держать loading на весь scrape. Показать задачу / перейти на страницу задач.
3. Поллинг `GET /api/apitasks/:id` до `completed`/`failed`/`cancelled`.
4. В `result`: `skugrId`, `konkName`, `sliceDate`, `total`, `count`, `invalid`, `errors`.
5. Дубль активной задачи по той же группе → **409**.
6. Старый `POST /api/sku-slices/skugr/:skugrId/run-today` → **410** `API_TASKS_MIGRATED`.

См. [apitasks.md](../api/apitasks.md), [apitasks-frontend.md](../api/apitasks-frontend.md).
