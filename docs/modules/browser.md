# Модуль Browser (Скрапинг витрин конкурентов)

## Описание модуля

Модуль `browser` — HTTP-слой для получения остатков и цен с сайтов конкурентов. Он не хранит собственных сущностей в MongoDB, а предоставляет:

- **прямые API-эндпоинты** для запроса stock/price по URL или артикулу;
- **библиотеки парсинга**, которые вызывают cron-задачи срезов, модули `analogs`, `skus`, `arts`, `skugrs` и компенсирующие срезы.

Организация кода — **по конкуренту** (`air/`, `balun/`, `perfect/`, …) плюс общие утилиты в `browser/utils/`.

## Поддерживаемые конкуренты

| Конкурент | Путь | HTTP-эндпоинт |
|-----------|------|---------------|
| air | [`src/modules/browser/air/`](../../src/modules/browser/air/) | `GET /api/browser/air/stock` |
| balun | [`src/modules/browser/balun/`](../../src/modules/browser/balun/) | `GET /api/browser/balun/stock` |
| perfect | [`src/modules/browser/perfect/`](../../src/modules/browser/perfect/) | `GET /api/browser/perfect/stock` |
| sharte | [`src/modules/browser/sharte/`](../../src/modules/browser/sharte/) | `GET /api/browser/sharte/stock` |
| sharik (Btrade) | [`src/modules/browser/sharik/`](../../src/modules/browser/sharik/) | `GET /api/browser/sharik/stock/:artikul` |
| yumi | [`src/modules/browser/yumi/`](../../src/modules/browser/yumi/) | `GET /api/browser/yumi/stock` |
| yumin | [`src/modules/browser/yumin/`](../../src/modules/browser/yumin/) | `GET /api/browser/yumin/stock` |

Каждая папка конкурента содержит `controllers/` и `utils/get*StockData.ts` с логикой разбора HTML/DOM/JSON конкретного сайта.

## Связи между модулями

- **analog-slices / analogs:** опрос остатков аналогов (air, balun, yumi, yumin, sharte).
- **sku-slices / skus:** опрос SKU (+ perfect); используется в cron срезов и компенсации.
- **btrade-slices:** bulk и search через sharik-парсеры.
- **skugrs:** обход страниц групп для наполнения SKU (`group-products`).
- **slice-compensation:** повторный опрос через stock-утилиты analog/sku.

## Концепции и принятые решения

### Общий HTTP-клиент

[`browserRequest.ts`](../../src/modules/browser/utils/browserRequest.ts) — singleton axios с browser-like заголовками и таймаутом 30 с. Текущие конкурентные парсеры вызывают его напрямую.

### Dual-transport (`http` | `playwright`)

Для конкурентов, которым нужен рендер JS или headless Chromium, общая точка входа — [`fetchPageHtml`](../../src/modules/browser/utils/fetchPageHtml.ts):

- транспорт `http` — axios (`browserGet`);
- транспорт `playwright` — headless Chromium (`page.goto` → HTML), lazy singleton, лимит параллелизма.

Приоритет выбора транспорта: явный параметр вызова → карта env `BROWSER_TRANSPORT_BY_KONK` по `konkName` → `http`. Формат карты: пары `konk:transport` через запятую (например `air:playwright,balun:http`). Невалидные значения игнорируются с предупреждением в лог. Лимит параллельных Playwright-страниц — `BROWSER_PLAYWRIGHT_CONCURRENCY` (по умолчанию 2).

На машине/сервере, где реально используется transport `playwright`, нужен установленный Chromium: `npx playwright install chromium`. Обычный boot и тесты без вызова Playwright-пути браузер не поднимают.

Существующие `get*StockData` и default crawl листингов по-прежнему идут через `browserGet`; env на них **не влияет**, пока getter не переведён на `fetchPageHtml`. Cron срезов и контракт `{ stock, price }` / `-1` не меняются.

### Сентинельные значения

При недоступности данных парсеры возвращают `stock: -1`, `price: -1`. Это общий контракт срезов (см. модуль [`slices`](slices.md)): `-1` означает «данных нет», компенсирующий cron пытается перезапросить такие позиции.

### Shared utils

Переиспользуемые примитивы в [`browser/utils/`](../../src/modules/browser/utils/):

- разбор HTML-сущностей, относительных ссылок;
- безопасный парсинг JSON из атрибутов;
- извлечение чисел из «грязных» строк (`parseStrippedDecimal`);
- `sleep`, merge cookies, resolve href;
- dual-transport: `resolveBrowserTransport`, `fetchPageHtml`, `playwrightGet`.

### Group pages (обход листингов)

[`group-pages/`](../../src/modules/browser/group-pages/) — инфраструктура постраничного crawl HTML-листингов:

- `crawlHtmlGroupListingPages` — pagination, dedupe по productId, `link[rel=next]`;
- `parsePromUaGroupListingProducts` — Prom.ua-совместимый парсер;
- throttle 800–1600 мс между страницами.

Per-competitor обёртки: `get*GroupPagesProducts` + Zod-схема (`groupUrl`, `maxPages`).

### Group products (диспетчер)

[`group-products/fetchGroupProductsByKonkName`](../../src/modules/browser/group-products/fetchGroupProductsByKonkName.ts) маршрутизирует запрос к нужному конкуренту. Поддерживаются: yumi, yumin, air, sharte, balun, perfect. Sharik не поддерживается для group-products.

Возвращает `GroupBrowserProduct[]`: `{ title, url, imageUrl, productId }` — для создания SKU в `skugrs`.

## HTTP

Базовый путь: `/api/browser`. Публичные GET-маршруты (без JWT) — см. [матрицу доступа](../api/access-matrix.md).

Подробные форматы запросов и ответов — в [API документации](../api/browser.md).
