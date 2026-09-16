# API Excel-отчётов SKU

Базовый путь: `/api/sku-excel-reports`. Старые GET больше не отдают XLSX.

Доступ: checkAuth + checkRoles(ADMIN).

Все маршруты отвечают **410** с `code: EXCEL_JOBS_MIGRATED` и полем `kind`. Выгрузка: [excel-jobs](excel-jobs.md), UX: [excel-jobs-frontend](excel-jobs-frontend.md).

| Путь | kind |
|------|------|
| GET `/catalog/new-since` | `sku-catalog-new-since` |
| GET `/catalog/invalid` | `sku-catalog-invalid` |
| GET `/sku/:skuId/stock` | `sku-one-stock` |
| GET `/sku/:skuId/sales` | `sku-one-sales` |
| GET `/konk/stock` | `sku-konk-stock` |
| GET `/konk/sales` | `sku-konk-sales` |
| GET `/skugr/:skugrId/stock` | `sku-skugr-stock` |
| GET `/skugr/:skugrId/sales` | `sku-skugr-sales` |
