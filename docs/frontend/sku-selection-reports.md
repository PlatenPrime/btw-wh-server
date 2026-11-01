# Фронтенд: отчёты по выбранным SKU

## Задача

Дать пользователю мультивыбор карточек SKU (не обязательно одного конкурента) и за период получить:

1. Excel движения остатков;
2. Excel продаж с долями каждого SKU от суммы выбранных (шт и выручка);
3. JSON для двух круговых диаграмм (доля по штукам / доля по выручке).

Это не konk/skugr-отчёт и не single-SKU: scope = явный список `_id`.

## API

Auth: JWT, роль ≥ ADMIN.

### Excel (асинхронно)

Поток как в [`excel-jobs-frontend.md`](../api/excel-jobs-frontend.md): `POST /api/excel-jobs` → poll → download по token.

| Действие         | kind                  | params                                                                           |
| ---------------- | --------------------- | -------------------------------------------------------------------------------- |
| Остатки          | `sku-selection-stock` | `skuIds`, `dateFrom`, `dateTo`; опционально `metrics`: `stock`/`price`           |
| Продажи + частки | `sku-selection-sales` | `skuIds`, `dateFrom`, `dateTo`; опционально `metrics`: `sales`/`price`/`revenue` |

- `skuIds`: массив Mongo ObjectId, **1..100**, порядок = порядок в UI.
- Даты: `YYYY-MM-DD`, `dateFrom` ≤ `dateTo`.
- Полный контракт jobs: [`excel-jobs.md`](../api/excel-jobs.md).

В sales xlsx после итогов есть блок «Частки за період» — отдельные колонки % по продажам и выручке. Не парсить xlsx ради pie: для диаграмм есть JSON ниже.

### Pie (синхронно)

- Метод/путь: `POST /api/sku-chart-reports/selection/skus-pie`
- Body: `{ skuIds, dateFrom, dateTo }`
- Контракт: [`sku-chart-reports.md`](../api/sku-chart-reports.md)

Ответ: `data[skuId]` с `salesPcs`, `salesUah`, `sharePcs`, `shareUah` + `all` («Всі обрані»). Две pie на клиенте:

- сегменты по `sharePcs` (или `salesPcs` / `all.salesPcs`);
- сегменты по `shareUah` (или `salesUah` / `all.salesUah`);
- label: `title` (+ при желании `konkName` / `productId`).

## UX

### Точка входа

Экран/режим «сравнение выбранных» / multi-select в списке SKU: чекбоксы или корзина выбора. Кнопки: «Excel остатки», «Excel продажи», «Круговые диаграммы» (или сразу показать pie после выбора периода).

### Поведение

1. Пока `skuIds.length === 0` — кнопки отчётов disabled; при >100 — trim/toast «макс. 100».
2. Период обязателен (date range picker).
3. Excel: один job за клик; UI подготовки/polling как у остальных excel-jobs (лимит 2 активных job).
4. Pie: один POST; loading на блоке диаграмм; при повторном запросе отменять/игнорировать устаревший ответ.
5. Отсутствующие id бэкенд молча пропускает; если ни одного не найдено — 404 / failed job.

### После ответа

| Источник        | Статус  | UI                                                  |
| --------------- | ------- | --------------------------------------------------- |
| excel-jobs POST | 202     | Показать прогресс job                               |
| excel-jobs job  | failed  | Toast `error`; предложить новый POST                |
| excel-jobs file | ready   | Навигационное скачивание по `downloadToken`         |
| pie POST        | 200     | Две pie + опционально таблица долей из `data`/`all` |
| pie POST        | 400     | Toast валидации (даты / id / лимит)                 |
| pie POST        | 404     | Toast: выбранные SKU не найдены                     |
| любой           | 401/403 | Стандартная сессия/права                            |

### Не делать

- Не ходить на старые GET `/api/sku-excel-reports/...` — для selection их нет; для прочих kinds они отдают 410.
- Не строить pie из xlsx на клиенте.
- Не смешивать этот scope с `sku-konk-*` / `sku-skugr-*`: другой вход (`skuIds`), другой смысл «кучи» для долей.
- Не слать >100 id; не слать невалидные ObjectId (сразу 400).
