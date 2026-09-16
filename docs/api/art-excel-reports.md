# API Art Excel Reports

Базовый путь: `/api/art-excel-reports`. GET больше не отдают XLSX: **410** `EXCEL_JOBS_MIGRATED`.

Доступ: checkAuth + checkRoles(ADMIN).

| Путь | kind |
|------|------|
| GET `/artikul/:artikul/stock` | `art-stock` |
| GET `/artikul/:artikul/sales` | `art-sales` |

Новый контракт: [excel-jobs](excel-jobs.md), [excel-jobs-frontend](excel-jobs-frontend.md).
