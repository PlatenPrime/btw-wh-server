# Модуль Sku Excel Reports

## Назначение

HTTP-модуль только для XLSX-выгрузок по SKU, товарным группам Skugr и каталогу Sku. Логика сборки файлов — в shared-модуле [sku-reporting](sku-reporting.md) и [skus](skus.md) (каталог).

## Эндпоинты

Базовый путь `/api/sku-excel-reports`. См. [API sku-excel-reports](../api/sku-excel-reports.md) и [миграцию](../api/sku-api-migration.md).

## Роли

ADMIN (checkAuth + checkRoles).
