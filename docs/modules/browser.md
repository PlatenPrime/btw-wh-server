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
- **sku-slices / skus:** опрос SKU (air, balun, yumi, yumin, sharte, perfect); для Air дополнительно доступен параллельный client-ingestion HTML как ручной/компенсирующий канал.
- **btrade-slices / arts / dels / defs:** остатки sharik через bulk `product_rests` (`actualQuantity` для live, `sliceQuantity` для daily btrade-slice).
- **skugrs:** обход страниц групп для наполнения SKU (`group-products`), в т.ч. Air listing.
- **slice-compensation:** повторный опрос через stock-утилиты analog/sku (Air включён в server scrape).

## Концепции и принятые решения

### Общий HTTP-клиент

[`browserRequest.ts`](../../src/modules/browser/utils/browserRequest.ts) — singleton axios с browser-like заголовками и таймаутом 30 с. Большинство конкурентных парсеров (кроме Air stock и сложных потоков вроде Perfect) вызывают его напрямую.

### Air: dual-path (server + client)

**Primary:** серверный scrape через `getAirStockData` → `fetchPageHtml` с transport `impit` (Chrome TLS/HTTP fingerprint + `tough-cookie` jar), origin warm-up и Referer на product GET; при ответе WAF adm.tools («Захищена сторінка», в т.ч. HTTP 200 с HTML-заглушкой) Impit сам POST’ит ack — актуальный JSON `__ack` или legacy FormData `___ack` — и повторяет GET. Опциональный `AIR_HTTP_PROXY_URL`. Публичный `GET /api/browser/air/stock`, live stock sku/analog, cron срезов и compensation используют этот путь. Парсер HTML — [`readAirProductFromHtml`](../../src/modules/browser/air/utils/air-product-page-from-html/readAirProductFromHtml.ts).

**Secondary:** client-ingestion в [sku-slices](sku-slices.md) — расширение/браузер открывает first-party страницу, frontend шлёт HTML на backend; тот же парсер. Канал остаётся доступным всегда для ручного/компенсирующего дозаполнения, если серверный опрос не дал валидных данных.

Air **group listing** (наполнение SKU) идёт через тот же Impit-путь (`fetchPageHtml` + cookie jar + adm.tools ack solver): один origin warm-up, затем страницы листинга с Referer; опциональный `AIR_HTTP_PROXY_URL`.

### Sharik: product_rests через HTTP-прокси

Единый источник остатков/цен sharik.ua — страница `product_rests/{seed}/` (формат строки `artikul = actualQuantity; sliceQuantity; price`). Парсинг, fetch и in-memory cache TTL ~1ч — в `browser/sharik/utils/product-rests`. `getSharikStockData` читает `actualQuantity` из кэша; `nameukr` для single lookup — из Art. Запросы идут через `SHARIK_HTTP_PROXY_URL` при `SHARIK_HTTP_PROXY_ENABLED = true`; без env — прямой egress.

Результаты stock-scrape пишутся в info-лог (`browser stock result`: konk, link, stock, price, ok) с лимитом ≤20 сообщений в минуту на process; ошибки fetch — отдельно через `logBrowserError`.

### Multi-transport (`http` | `impit` | `playwright`)

Общая точка входа — [`fetchPageHtml`](../../src/modules/browser/utils/fetchPageHtml.ts):

- транспорт `http` — axios (`browserGet`);
- транспорт `impit` — HTTP-клиент с browser TLS/HTTP fingerprint (`impitGet`), cookie jar между запросами одного клиента, без Chromium; при challenge adm.tools — solver ack (`__ack` JSON / legacy `___ack` FormData) + retry;
- транспорт `playwright` — headless Chromium (`page.goto` → HTML), lazy singleton, лимит параллелизма.

Приоритет выбора транспорта: явный параметр вызова → карта env `BROWSER_TRANSPORT_BY_KONK` по `konkName` → `http`. Формат карты: пары `konk:transport` через запятую (например `air:impit,balun:http`). Невалидные значения игнорируются с предупреждением в лог. Лимит параллельных Playwright-страниц — `BROWSER_PLAYWRIGHT_CONCURRENCY` (по умолчанию 2). Режим headless — `BROWSER_PLAYWRIGHT_HEADLESS` (`true` / `false` / `shell`).

На машине/сервере, где реально используется transport `playwright`, нужен установленный Chromium: `npx playwright install chromium`. Обычный boot и тесты без вызова Playwright-пути браузер не поднимают. Пакет `impit` тянет prebuilt native binary под платформу.

Air stock явно задаёт `transport: "impit"`, origin warm-up и Referer/`Sec-Fetch-Site` (session soft-block WAF). Остальные `get*StockData` и default crawl листингов по-прежнему идут через `browserGet`; env на них **не влияет**, пока getter не переведён на `fetchPageHtml`. Cron срезов и контракт `{ stock, price }` / `-1` не меняются.

### Сентинельные значения

При недоступности данных парсеры возвращают `stock: -1`, `price: -1`. Это общий контракт срезов (см. модуль [`slices`](slices.md)): `-1` означает «данных нет», компенсирующий cron пытается перезапросить такие позиции.

### Shared utils

Переиспользуемые примитивы в [`browser/utils/`](../../src/modules/browser/utils/):

- разбор HTML-сущностей, относительных ссылок;
- безопасный парсинг JSON из атрибутов;
- извлечение чисел из «грязных» строк (`parseStrippedDecimal`);
- `sleep`, merge cookies, resolve href, `HttpsProxyAgent` для HTTP(S) proxy;
- multi-transport: `resolveBrowserTransport`, `fetchPageHtml`, `impitGet`, `playwrightGet`;
- rate-limited `logBrowserStockResult`.

### Group pages (обход листингов)

[`group-pages/`](../../src/modules/browser/group-pages/) — инфраструктура постраничного crawl HTML-листингов:

- `crawlHtmlGroupListingPages` — pagination, dedupe по productId, `link[rel=next]`; опциональная подмена GET через `getHtml`;
- `parsePromUaGroupListingProducts` — Prom.ua-совместимый парсер;
- throttle 800–1600 мс между страницами.

Per-competitor обёртки: `get*GroupPagesProducts` + Zod-схема (`groupUrl`, `maxPages`).

### Group products (диспетчер)

[`group-products/fetchGroupProductsByKonkName`](../../src/modules/browser/group-products/fetchGroupProductsByKonkName.ts) маршрутизирует запрос к нужному конкуренту. Поддерживаются: yumi, yumin, air, sharte, balun, perfect. Sharik не поддерживается для group-products.

Возвращает `GroupBrowserProduct[]`: `{ title, url, imageUrl, productId }` — для создания SKU в `skugrs`.

## HTTP

Базовый путь: `/api/browser`. Публичные GET-маршруты (без JWT) — см. [матрицу доступа](../api/access-matrix.md).

Подробные форматы запросов и ответов — в [API документации](../api/browser.md).
