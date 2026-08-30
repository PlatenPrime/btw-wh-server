# Модуль Browser (Скрапинг витрин конкурентов)

## Описание модуля

Модуль `browser` — HTTP-слой для получения остатков и цен с сайтов конкурентов. Он не хранит собственных сущностей в MongoDB, а предоставляет:

- **прямые API-эндпоинты** для запроса stock/price по URL или артикулу;
- **библиотеки парсинга**, которые вызывают cron-задачи срезов, модули `analogs`, `skus`, `arts`, `skugrs` и компенсирующие срезы.

Организация кода — **по конкуренту** (`air/`, `balun/`, `perfect/`, …), плюс производитель Grabo в `browser/grabo/` и общие утилиты в `browser/utils/`.

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
- **sku-slices / skus:** опрос SKU (air, balun, yumi, yumin, sharte, perfect); для Air — client-ingestion HTML как канал дозаполнения после abort/`-1` (server compensation для Air выключена).
- **btrade-slices / arts / dels / defs:** остатки sharik через bulk `product_rests` (`actualQuantity` для live, `sliceQuantity` для daily btrade-slice).
- **skugrs:** обход страниц групп для наполнения SKU (`group-products`), в т.ч. Air listing.
- **grabo-skus:** полный обход каталога производителя Grabo (sitemap → категории → карточки) через `browser/grabo`.
- **slice-compensation:** повторный опрос через stock-утилиты analog/sku; Air из compensation исключён.

## Концепции и принятые решения

### Общий HTTP-клиент

[`browserRequest.ts`](../../src/modules/browser/utils/browserRequest.ts) — singleton axios с browser-like заголовками и таймаутом 30 с. Большинство конкурентных парсеров (кроме Air stock и сложных потоков вроде Perfect) вызывают его напрямую.

### Air: dual-path (server + client)

**Primary:** серверный scrape через `getAirStockData` → `fetchPageHtml` с transport `impit` (Chrome TLS/HTTP fingerprint + `tough-cookie` jar), origin warm-up и Referer на product GET; при ответе WAF adm.tools («Захищена сторінка», в т.ч. HTTP 200 с HTML-заглушкой) Impit сам POST’ит ack — актуальный JSON `__ack` или legacy FormData `___ack` — и повторяет GET. HTTP-прокси для Air сейчас выключен (`AIR_HTTP_PROXY_ENABLED = false`): egress прямой с хоста; env `AIR_HTTP_PROXY_URL` игнорируется, пока флаг снова не включат. Cloudflare origin-error **520–526** → `ORIGIN_BLOCKED` (не глотается в `-1/-1`): warm-up с таким статусом не продолжает к product; основной SKU/analog срез обрывается, хвост не пишется. Origin warm-up на одном Impit-клиенте (тот же proxy-key) выполняется один раз на origin — повторные product GET того же origin skip’ают warm-up. **Ночной Air SKU-срез** между чанками (после каждых 1000 fetch) вызывает `resetImpitClientCache()` — сброс in-memory Impit-клиента и warmed origins, новая cookie-сессия на следующем чанке; между запросами — паузы каждые 10 и 100 fetch. Публичный `GET /api/browser/air/stock`, live stock sku/analog и cron первичных срезов используют этот путь; server compensation для Air выключена (см. [slice-compensation](slice-compensation.md)). Парсер HTML — [`readAirProductFromHtml`](../../src/modules/browser/air/utils/air-product-page-from-html/readAirProductFromHtml.ts).

**Secondary:** client-ingestion в [sku-slices](sku-slices.md) — расширение/браузер открывает first-party страницу, frontend шлёт HTML на backend; тот же парсер. Канал — основной способ дозаполнить хвост после `ORIGIN_BLOCKED` или missing/`-1`, без повторного серверного молотка.

Air **group listing** (наполнение SKU) идёт через тот же Impit-путь (`fetchPageHtml` + cookie jar + adm.tools ack solver): один origin warm-up, затем страницы листинга с Referer; прокси выключен тем же флагом. Warm-up с `ORIGIN_BLOCKED` прерывает crawl.

### Sharik: product_rests через HTTP-прокси

Единый источник остатков/цен sharik.ua — страница `product_rests/{seed}/` (формат строки `artikul = actualQuantity; sliceQuantity; price`). Парсинг, fetch и in-memory cache TTL ~1ч — в `browser/sharik/utils/product-rests`. `getSharikStockData` читает `actualQuantity` из кэша; `nameukr` для single lookup — из Art. Запросы идут через `SHARIK_HTTP_PROXY_URL` при `SHARIK_HTTP_PROXY_ENABLED = true`; без env — прямой egress.

Результаты stock-scrape пишутся в info-лог (`browser stock result`: konk, link, stock, price, ok) с лимитом ≤20 сообщений в минуту на process; ошибки fetch — отдельно через `logBrowserError`.

### Multi-transport (`http` | `impit` | `playwright`)

Общая точка входа — [`fetchPageHtml`](../../src/modules/browser/utils/fetchPageHtml.ts):

- транспорт `http` — axios (`browserGet`);
- транспорт `impit` — HTTP-клиент с browser TLS/HTTP fingerprint (`impitGet`), cookie jar между запросами одного клиента, без Chromium; при challenge adm.tools — solver ack (`__ack` JSON / legacy `___ack` FormData) + retry; статусы Cloudflare 520–526 → типизированный `ORIGIN_BLOCKED`;
- транспорт `playwright` — headless Chromium (`page.goto` → HTML), lazy singleton, лимит параллелизма.

Приоритет выбора транспорта: явный параметр вызова → карта env `BROWSER_TRANSPORT_BY_KONK` по `konkName` → `http`. Формат карты: пары `konk:transport` через запятую (например `air:impit,balun:http`). Невалидные значения игнорируются с предупреждением в лог. Лимит параллельных Playwright-страниц — `BROWSER_PLAYWRIGHT_CONCURRENCY` (по умолчанию 2). Режим headless — `BROWSER_PLAYWRIGHT_HEADLESS` (`true` / `false` / `shell`).

На машине/сервере, где реально используется transport `playwright`, нужен установленный Chromium: `npx playwright install chromium`. Обычный boot и тесты без вызова Playwright-пути браузер не поднимают. Пакет `impit` тянет prebuilt native binary под платформу.

Air stock явно задаёт `transport: "impit"`, origin warm-up и Referer/`Sec-Fetch-Site` (session soft-block WAF). Остальные `get*StockData` и default crawl листингов по-прежнему идут через `browserGet`; env на них **не влияет**, пока getter не переведён на `fetchPageHtml`. Cron срезов и контракт `{ stock, price }` / `-1` не меняются.

### Сентинельные значения

При недоступности данных парсеры возвращают `stock: -1`, `price: -1`. Это общий контракт срезов (см. модуль [`slices`](slices.md)): `-1` означает «данных нет». Компенсирующий cron пытается перезапросить такие позиции у конкурентов, не исключённых из compensation (Air — нет; хвост через client-ingest). Cloudflare `ORIGIN_BLOCKED` при сборе среза не превращается в массовые `-1` по хвосту — цикл обрывается.

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

Per-competitor обёртки: `get*GroupPagesProducts` + Zod-схема (`groupUrl`, `maxPages`). Grabo listing — `getGraboListingProducts`: пагинация только по `rel="next"` в `nav.archive-links.pages` (`rel="last"` на сайте врёт). Категории каталога — `parseGraboSitemapCategoryUrls` из `.site-map li.nav900`. Сбор URL карточек — `collectGraboCatalogProductUrls`.

### Group products (диспетчер)

[`group-products/fetchGroupProductsByKonkName`](../../src/modules/browser/group-products/fetchGroupProductsByKonkName.ts) маршрутизирует запрос к нужному конкуренту. Поддерживаются: yumi, yumin, air, sharte, balun, perfect. Sharik не поддерживается для group-products.

Возвращает `GroupBrowserProduct[]`: `{ title, url, imageUrl, productId }` — для создания SKU в `skugrs`.

## HTTP

Базовый путь: `/api/browser`. Публичные GET-маршруты (без JWT) — см. [матрицу доступа](../api/access-matrix.md).

Подробные форматы запросов и ответов — в [API документации](../api/browser.md).
