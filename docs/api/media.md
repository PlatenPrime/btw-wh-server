# API Media

Базовый путь: `/api/media`.

Эндпоинты и условия доступа: [Матрица доступа](access-matrix.md) — раздел «/api/media».

---

### GET `/api/media/sharik/:artikul`

Публичный proxy JPEG артикула с sharik.ua (`prev` / `big`).

**Запрос**

| Параметр | Где | Тип | Описание |
|----------|-----|-----|----------|
| `artikul` | path | string | Артикул (URL-decoded); безопасный набор символов, max 64 |
| `size` | query | `"prev"` \| `"big"` | Размер; по умолчанию `"prev"` |

Auth: нет.

**Ответ 200:** тело — байты изображения.

Заголовки:

| Header | Значение |
|--------|----------|
| `Content-Type` | из upstream (обычно `image/jpeg`) |
| `Cache-Control` | `public, max-age=86400` |
| `ETag` | opaque tag записи кеша |

**Ответ 304:** без тела — при совпадении `If-None-Match` с текущим `ETag`. Заголовки `ETag`, `Cache-Control` сохраняются.

**Ответ 400:** `{ message: string, errors: ... }` — ошибка валидации `artikul` / `size`.

**Ответ 404:** `{ message: string }` — картинка отсутствует или upstream отдал не-image / пустое тело.

**Ответ 502:** `{ message: string }` — ошибка прокси или upstream.

**Ответ 500:** `{ message: string }` — неожиданная ошибка сервера.
