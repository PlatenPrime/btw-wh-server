# Модуль Sku Excel Reports

HTTP-модуль-заглушка: бывшие XLSX-маршруты SKU отвечают 410 и указывают `kind` для [excel-jobs](../api/excel-jobs.md). Сборка файлов по-прежнему в util’ах этого модуля и [sku-reporting](sku-reporting.md) / [skus](skus.md), запускается worker'ом excel-jobs.

Sales/slice excel читают `SkuSliceMonth` точечно по нужным `productId` (`loadExcelSliceMapsForSkus` → `loadSkuSliceRowsForKonksProducts`), без full-konk day maps. Catalog (invalid / new-since) срезы не трогает.

Sales Excel (one / skugr / konk / selection) собирает блок строк метрик на SKU: Продажі, Ціна, Виручка. Клиент может сузить набор через param `metrics` (`sales` / `price` / `revenue`); без param остаются все три строки в каноническом порядке. Итоговые summary-строки продаж и выручки пишутся только для выбранных соответствующих метрик.

Stock Excel (one / skugr / konk / selection) — блок Залишок / Ціна; param `metrics` (`stock` / `price`), без param — обе строки. Підсумок по остаткам пишется только если выбран `stock`.

**Selection** (`sku-selection-stock` / `sku-selection-sales`): произвольный список `skuIds` (1..100), в том числе с разных конкурентов. Resolve через `resolveSkusByIds` в sku-reporting. Sales selection дополнительно пишет блок «Частки за період» (шт / % / виручка / %) и применяет `recountDays` per `konkName`. Старых GET-stub’ов для selection нет — только excel-jobs kinds.

Роли: ADMIN.
