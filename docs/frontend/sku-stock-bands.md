# Фронтенд: диапазоны остатков (sku-stock-bands)

Две страницы рядом со старой «Корегування» (band-spike). Старую страницу не менять — сравнивать UX.

## 1. Список / редактирование диапазонов

- `GET /api/sku-stock-bands` (фильтр `?konkName=` по желанию).
- Создание: `POST /api/sku-stock-bands` с `{ konkName, stockMin, stockMax, normalMax }`.
- Правка: `PATCH /api/sku-stock-bands/:id`.
- Удаление: `DELETE /api/sku-stock-bands/:id`.
- В карточке показывать `konk.name` / `konk.title` и три числа. `title` приходит с сервера.

## 2. Карточка диапазона → аномалии → batch

1. Открыть диапазон (`GET .../:id` или из списка).
2. Выбрать `dateFrom` / `dateTo` (лимит discover ≤ 93 дня).
3. `POST /api/sku-slices/stock-bands/:bandId/discover` с `{ dateFrom, dateTo }`.
4. Таблица как у старого discover: товар (`title`, `imageUrl`), runs, чекбоксы по `productId`.
5. Подтверждение: `POST /api/sku-slices/stock-bands/:bandId/batch-correct` с `{ dateFrom, dateTo, productIds }` → **202** ApiTask.
6. Поллинг задачи: [apitasks-frontend](../api/apitasks-frontend.md). Kind: `sku-slices.stock-band.batch-correct`. Прогресс растёт по обработанным `productIds` (message = productId), в конце шаг rematerialize sales; cancel running сразу отпускает очередь.
7. В `result` смотреть `patched` / `skipped` / `band.normalMax`.

Discover и batch используют один sandwich: right `stock ≤ normalMax`; left — если день с данными есть, тоже `≤ normalMax`; если left нет (товар только появился в полосе) — кандидат/патч допустимы. Выход «высокий, но ниже band» (`> normalMax`) в discover не попадает; в batch — `not-sandwich-right`.

## Роли

ADMIN.
