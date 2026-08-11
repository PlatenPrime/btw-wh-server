# Модуль Media (публичный image-proxy)

## Описание модуля

Модуль `media` отдаёт клиентам (web/mobile) бинарные медиа-ресурсы через API сервера, когда прямой egress с устройства/браузера к источнику недоступен или нестабилен. Собственных сущностей в MongoDB нет: модуль — тонкий HTTP-proxy с in-memory кешем.

Первый сценарий — JPEG артикулов с `sharik.ua`: UI раньше грузил картинки напрямую, но часто получал блок, таймаут или HTML вместо изображения. `<img>` и `expo-image` не умеют передавать JWT, поэтому эндпоинт публичный.

## Сущности и связи

| Сущность | Смысл |
|----------|--------|
| Artikul image request | Запрос картинки по артикулу и размеру (`prev` / `big`) |
| Upstream URL | Канонический JPEG на sharik (`elements_big` / `elements_big_prev`) |
| Cache entry | In-memory запись: байты, Content-Type, ETag, время выборки |

Связи:

- **Клиенты btw-wh (web/mobile)** — строят URL `/api/media/sharik/{artikul}?size=...` и показывают картинку без auth.
- **Browser utilities** — переиспользуется только HTTP-прокси стек (`getSharikHttpProxyUrl`, binary GET через `browserGetBuffer`). HTML scrape `product_rests` и парсеры stock не задействованы.
- **`SHARIK_HTTP_PROXY_URL`** — тот же env, что для sharik scrape: без него возможен прямой egress сервера.

## Принятые решения

- Отдельный модуль, не расширение `browser`: контракт публичного медиа и scrape остатков — разные задачи и разные ответы (байты vs JSON).
- Успех upstream только при HTTP 200, `Content-Type` семейства `image/*` и непустом теле; HTML/пустое тело клиенту не прокидываются (`404` или `502`).
- In-memory LRU + TTL (~1 ч), ключ `size:artikul`, inflight-dedupe параллельных miss; клиенту дополнительно `Cache-Control` и `ETag`/`304`.
- Валидация артикула ограничивает path traversal и небезопасные символы; секреты прокси не логируются и не попадают в ответы.
