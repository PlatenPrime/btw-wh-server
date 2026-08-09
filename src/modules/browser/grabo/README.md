# browser/grabo

Парсинг карточек товаров производителя Grabo (grabo-balloons.com) для последующего модуля `grabo-skus`.

## Задача

По URL страницы товара получить HTML и извлечь структурированные поля будущей сущности GraboSku. Листинг каталога, хранение и API здесь не решаются.

## Сущность GraboSkuData

Контракт полей. Имена **строго camelCase** — тот же набор должен использоваться в модели MongoDB и Excel-экспорте, чтобы поля не разъезжались.

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

**getGraboSkuData** — принимает link страницы товара, загружает HTML через `fetchPageHtml` с `konkName: grabo`, затем парсит. Пустой или нестроковый link — ошибка. Ошибки сети пробрасываются вызывающему коду.

**parseGraboSkuHtml** — чистый парсинг HTML-строки в `GraboSkuData` без сети. Пробелы и переносы внутри текстов атрибутов нормализуются. Дубликаты URL изображений отбрасываются.
