# Excel Jobs — контракт для фронтенда

Подготовка файла и скачивание — два разных прогресса. Не держать старый GET Excel открытым до конца: он больше не отдаёт xlsx (410).

## Поток

1. Клик «Excel» → `POST /api/excel-jobs` с `kind` + `params` (Bearer).
2. 202 → показать UI подготовки, сохранить `jobId`.
3. Поллить `GET /api/excel-jobs/:id` каждые `pollIntervalMs` (обычно 1000 мс). После F5 взять свои активные через `GET /api/excel-jobs?status=queued,running,ready`.
4. UI по `status`/`phase`/`progress`/`queuePosition`:
   - queued: «В черзі», позиция `queuePosition`
   - running + loading: «Завантаження даних»
   - running + building: «Формування Excel», `progress` 0–100
   - running + finalizing: «Збереження файлу»
   - failed: `error`, кнопка повтора = новый POST
   - cancelled: закрыть прогресс
5. Когда `status=ready`: взять `downloadToken`, `fileName`, `sizeBytes`. Запустить **навигационную** загрузку, не `fetch().blob()`:
   - `window.location.assign(apiOrigin + "/api/excel-jobs/" + jobId + "/file?token=" + encodeURIComponent(downloadToken))`
   - либо `<a href="...file?token=...">` без кастомных заголовков
6. Браузерный прогресс качает уже готовый файл (`Content-Length`). JWT в URL не ставить.

`fetch` + blob прячет файл в JS: нативная полка загрузок Chrome не появится, прогресс придётся рисовать самим. Для нативного прогресса нужен переход по URL с token.

## 410 со старых URL

Если ещё дергается старый GET/POST Excel: тело содержит `kind`. Подставить его в POST `/api/excel-jobs` и собрать `params` из бывшего query/path (path-id → поле в params, см. таблицу в [excel-jobs.md](excel-jobs.md)).

## Ограничения

- 429: у пользователя уже 2 активных job. Показать список и предложить отмену (`DELETE /api/excel-jobs/:id`).
- Token на файл живёт 5 минут. Если скачивание не начали — ещё раз GET job, взять новый token.
- Файл живёт 30 минут после ready, потом 410.
- Не парсить xlsx на клиенте, пока идёт подготовка.

## Selection SKU

Мультивыбор SKU (разные конкуренты): kinds `sku-selection-stock` / `sku-selection-sales`.

- Режим A: `skuIds` (≥1 ObjectId, без upper bound) + период.
- Режим B: `selectAll: true` + опциональные `search` / `konkName` / `prodName` (как `GET /skus`) + период; `skuIds` не слать.
- XOR: оба или ни одного → 400.

Pie — синхронный `POST /api/sku-chart-reports/selection/skus-pie` с теми же режимами A/B, не excel-job. UX: [sku-selection-reports](../frontend/sku-selection-reports.md). Полный контракт: [frontend prompt](../prompts/frontend-sku-selection-select-all-and-images.md).

## Колонка «Фото» (`includeImages`)

Для kinds с набором SKU: `sku-konk-stock` / `sku-konk-sales`, `sku-skugr-stock` / `sku-skugr-sales`, `sku-skugr-skus-share`, `sku-selection-stock` / `sku-selection-sales`.

- В `params` слать `includeImages: true`, если нужна колонка с картинками.
- Без поля или `false` — колонки «Фото» нет (default). Для `sku-skugr-skus-share` это breaking: раньше превью были всегда.
- Размер превью на бекенде (150×150) фронту не конфигурируется.

## Не трогать

JSON графиков и sales-reports (`/api/sku-chart-reports`, `/api/sku-sales-reports`, analog comparison без `-excel`) без изменений контракта ответа; body selection pie расширен режимом `selectAll`.
