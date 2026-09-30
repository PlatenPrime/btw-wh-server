# ApiTasks для фронтенда

## Поток

1. Кнопка действия вызывает `POST /api/apitasks` с `{ kind, params }` — без ожидания окончания работы.
2. Ответ **202** с `taskId` и `pollIntervalMs`.
3. Редирект/ссылка на страницу списка задач или детали задачи.
4. Поллинг `GET /api/apitasks/:id` (или список) пока статус не финальный: `completed` | `failed` | `cancelled` | `expired`.
5. На детали показать `progress`, `phase`, `message`; при `completed` — `result`; при `failed` — `error`.
6. Кнопка «Отменить» — `DELETE /api/apitasks/:id` только для `queued`/`running`.

## 410 на старых URL

Любой клик по старому action-URL (run-today, compensating run, fill-skus, grabo sync, update-all, recalc, populate, batch delete) получает 410 с `kind`. Фронт подставляет этот `kind` в `POST /api/apitasks` и переносит path/body в `params` по таблице в [apitasks.md](apitasks.md).

## Что не переводить на ApiTasks

Live GET stock, browser stock, charts/sales JSON, обычный CRUD, set-pallets/unlink, быстрые reset/updateMany one-shot.

## Excel отдельно

XLSX — модуль excel-jobs, не apitasks.
