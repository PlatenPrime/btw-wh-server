# Промпт: excel-job `sku-skugr-skus-share`

Реализуй новый kind excel-jobs на бэкенде. Фронт уже шлёт `POST /api/excel-jobs` с этим kind со страницы `/sku/statistics/skugr` (меню хедера «Скачати Excel з фото»).

## Kind

**`sku-skugr-skus-share`**

Не путать с `sku-skugr-sales`: там дневные метрики по SKU группы. Здесь — **агрегированная share-таблица** за период (как JSON `GET /api/sku-sales-reports/skugr/:skugrId/skus-sales`) **плюс встроенные превью картинок**.

## Params (Zod)

| Поле       | Тип                      | Обязательно | Описание                                                       |
| ---------- | ------------------------ | ----------- | -------------------------------------------------------------- |
| `skugrId`  | string (Mongo ObjectId)  | да          | Id товарной группы                                             |
| `dateFrom` | `YYYY-MM-DD`             | да          | Начало периода (inclusive)                                     |
| `dateTo`   | `YYYY-MM-DD`             | да          | Конец периода (inclusive), `dateFrom ≤ dateTo`                 |
| `sortBy`   | `"sales"` \| `"revenue"` | нет         | Без param — порядок как у текущего JSON `skus-sales` (default) |

Пример body:

```json
{
  "kind": "sku-skugr-skus-share",
  "params": {
    "skugrId": "69c90438a8a83ad44ff99915",
    "dateFrom": "2026-10-26",
    "dateTo": "2026-11-03",
    "sortBy": "revenue"
  }
}
```

## Данные

Тот же агрегат, что эндпоинт `GET sku-sales-reports/skugr/:skugrId/skus-sales?dateFrom&dateTo` (см. `docs/backend/api/sku-sales-reports.md`):

- строки: `{ skuId, title, productId?, imageUrl?, salesPcs, salesUah }`
- `all`: `{ title, salesPcs, salesUah }` — итог для долей

Сортировка строк SKU (после строки «Усього»):

- `sortBy: "sales"` → по `salesPcs` desc
- `sortBy: "revenue"` → по `salesUah` desc
- без `sortBy` → как в текущем JSON-ответе

Доли:

- sharePcs = `salesPcs / all.salesPcs * 100` (если all.salesPcs === 0 → 0)
- shareUah = `salesUah / all.salesUah * 100` (если all.salesUah === 0 → 0)
- у строки «Усього»: оба share = 100 (или 0, если итог нулевой — как принято в соседних отчётах; предпочтительно 100 при ненулевом all)

Формат чисел в Excel для %: `0.00`.

## Лист XLSX (ExcelJS в worker)

Один лист, например «Дані».

| Col | Заголовок              | Содержимое                        |
| --- | ---------------------- | --------------------------------- |
| A   | (пусто или «Фото»)     | Встроенное превью JPEG, или пусто |
| B   | Товар                  | `title`                           |
| C   | Продажі, шт            | number                            |
| D   | Виручка, грн           | number                            |
| E   | Частка за продажами, % | number                            |
| F   | Частка за виручкою, %  | number                            |

Порядок строк:

1. Header
2. **Усього** (`all`) — без картинки
3. SKU-строки (с картинками где удалось)

Имя файла: `sku_skugr_skus_share_{skugrId}_{dateFrom}_{dateTo}.xlsx`.

## Картинки (обязательный контракт)

1. Для каждой SKU-строки с непустым `imageUrl` — HTTP GET (разумный timeout, нормальный User-Agent), **concurrency ~8**.
2. Ресайз **max 200×200** (contain, **без апскейла**), выход **JPEG quality ~75** (`sharp` или уже принятый в проекте аналог).
3. ExcelJS `addImage` + подогнать `row.height` и ширину колонки A под отображение ~200 CSS-px.
4. Ошибка / таймаут / не-image / пустой body → ячейка A пустая, **job не падает**.
5. **Не** писать полные оригиналы в xlsx — только уменьшенные буферы.
6. Строка «Усього» — без картинки.

## Фазы прогресса

Как у остальных excel-jobs:

- `loading` — чтение агрегата (Mongo / существующий util `skus-sales`)
- `building` — строки + скачивание/ресайз картинок (прогресс по блокам строк)
- `finalizing` — запись файла на диск

## Регистрация

1. Добавить kind в реестр excel-jobs + Zod-схему params + builder util в worker.
2. Обновить таблицу kind в `docs/backend/api/excel-jobs.md` строкой для `sku-skugr-skus-share`.
3. Роль доступа — как у соседних SKU excel kinds (`sku-skugr-sales`).

## Вне скоупа

- Клиентский мгновенный xlsx на странице статистики (кнопка в таблице) — не трогать.
- Wizard «Замовлення Excel» / catalog — не обязателен для v1.
