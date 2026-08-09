# Модуль Sku Sales Reports

## Назначение

JSON-отчёты: продажи и выручка по одному SKU, дневные агрегаты по Skugr, итоги по каждому SKU внутри Skugr за период, итоги по группам пары konk+prod. Для drill-down по SKU группы ответ включает отдельное поле `skugrTitle` (название Skugr), а `all.title` остаётся подписью строки итога. Расчёты используют нормализацию `-1` и `Konk.recountDays` через [sku-reporting](sku-reporting.md) и [slices](slices.md).

## Эндпоинты

Базовый путь `/api/sku-sales-reports`. См. [API sku-sales-reports](../api/sku-sales-reports.md).

## Роли

ADMIN.
