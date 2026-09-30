# Фронтенд: ручной compensating slice

Операция перенесена в ApiTasks.

1. `POST /api/apitasks` с `{ "kind": "slice-compensation.run", "params": { "konkName": "<konk>" } }` → **202**.
2. Не ждать минуты на одном HTTP. Страница задач + поллинг.
3. В `result`: `konkName`, `sliceDate`, `analog`, `sku` counters.
4. Дубль по konk → **409**.
5. Старый `POST /api/slice-compensation/run` → **410** `API_TASKS_MIGRATED`.

См. [apitasks.md](../api/apitasks.md), [apitasks-frontend.md](../api/apitasks-frontend.md).
