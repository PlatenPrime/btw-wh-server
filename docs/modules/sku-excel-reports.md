# Модуль Sku Excel Reports

HTTP-модуль-заглушка: бывшие XLSX-маршруты SKU отвечают 410 и указывают `kind` для [excel-jobs](../api/excel-jobs.md). Сборка файлов по-прежнему в [sku-reporting](sku-reporting.md) и каталоге [skus](skus.md), но запускается worker'ом excel-jobs.

Роли: ADMIN.
