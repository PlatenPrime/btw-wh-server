# Фронтенд: мониторинг дневного среза SKU

## Задача

Показать админу, как прошёл дневной scrape конкурента и какие позиции invalid — без дампа всего Mixed-дня.

## API

- `GET /api/sku-slices/day-status?konkName=&date=` — meta/stats прогона + `pointsTotal` / `pointsInvalid`
- `GET /api/sku-slices/day-invalid?konkName=&date=&page=&limit=` — пагинация проблемных точек + join Sku
- Legacy `GET /api/sku-slices` → **410**; не вызывать

Auth: JWT, роль ≥ ADMIN. Контракт: [`docs/api/sku-slices.md`](../api/sku-slices.md).

## UX

1. Выбор konk + дата (по умолчанию сегодня Kyiv/slice-date).
2. Блок статуса: filled/invalid/errorCount, abortReason, rotationMeta, updatedAt.
3. Таблица invalid: productId, stock, price, ссылка на карточку Sku; пагинация.
4. Из строки invalid — переход к PATCH точки / air pending при необходимости.
