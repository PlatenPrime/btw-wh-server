# browser/grabo

Парсинг каталога и карточек производителя Grabo (grabo-balloons.com) для модуля `grabo-skus`. Хранение в Mongo, cron и Excel живут в `grabo-skus`.

## Задача

- из HTML sitemap взять URL категорий дерева Products;
- обойти листинги категорий с пагинацией и собрать URL карточек;
- по URL карточки получить HTML и извлечь поля сущности GraboSku.

## Сущность GraboSkuData

Контракт полей карточки. Имена **строго camelCase**. В Mongo/Excel тот же набор, кроме: парсер `isNew` → модель `isNewProduct`; парсер `tag` → модель `tags`.

| Поле | Тип | Смысл | Источник на странице |
|------|-----|--------|----------------------|
| title | string | Название | `h1.title` |
| productId | string | Артикул производителя (например G72274) | `.product-code` |
| isNew | boolean | Новинка на сайте | наличие `.link-novita` / `.novita` |
| color | string | Цвет | `.attribute-color` (`.selected` или первый `li span`) |
| size | string | Размер | `.attribute-size` |
| material | string | Материал | `.attribute-material` |
| gas | string | Газ для наполнения | `.attribute-gas` |
| language | string | Язык надписи | `.attribute-language` |
| gasCapacity | string | Ёмкость / ограничения по газу | `.attribute-gascapacity` |
| tag | string[] | Теги товара (набор вариативен) | `.attribute-tag1 .selected` |
| images | string[] | Абсолютные URL больших изображений | `ul.product-gallery a[href]`, base `https://www.grabo-balloons.com` |

Правила пустых значений: отсутствующая строка → `""`, отсутствующий список → `[]`.

Блок Variations (соседние артикулы) не учитывается.

## Функции

**parseGraboSitemapCategoryUrls** — из HTML sitemap берёт абсолютные URL только из `.site-map li.nav900` (дерево Products). About Us, catalogues, premioloon не входят.

**parseGraboListingPage** — из HTML листинга категории: URL карточек (`section.archive article.allclick h2.title a`) и next page (`nav.archive-links.pages a[rel="next"]`). `rel="last"` не используется: на сайте он может указывать не на фактическую последнюю страницу.

**getGraboListingProducts** — crawl одной категории через `crawlHtmlGroupListingPages` и `fetchGraboPageHtml`.

**collectGraboCatalogProductUrls** — sitemap + все категории, дедуп URL карточек. Ошибка одной категории попадает в `failedCategoryUrls`, остальные категории продолжаются. Ошибка sitemap пробрасывается.

**fetchGraboPageHtml** — GET HTML с `konkName: grabo`. При ETIMEDOUT и родственных сетевых сбоях повторяет **тот же URL** (три попытки, паузы 8 / 20 / 45 с). HTTP 404 и прочие прикладные ошибки не ретраятся.

**getGraboSkuData** — принимает link страницы товара, загружает HTML через `fetchGraboPageHtml`, затем парсит. Пустой или нестроковый link — ошибка. После исчерпания retry ошибки сети пробрасываются.

**parseGraboSkuHtml** — чистый парсинг HTML-строки в `GraboSkuData` без сети. Пробелы и переносы внутри текстов атрибутов нормализуются. Дубликаты URL изображений отбрасываются.
