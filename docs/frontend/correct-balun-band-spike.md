# Фронтенд: RTL-коррекция band-spike balun

## Задача

На карточке / в мониторе срезов админ видит sandwich-вспышку остатка balun (небольшое → ~9–11k → небольшое), в том числе near-miss вроде 9937, который nightly auto-sentinel (`9950–10050`) не трогает. Нужно починить период так, чтобы убрать фейковый уровень, но сохранить реальные продажи внутри полосы (−N/день).

Два входа:

1. **Bulk** — существующая кнопка post-corrections с выбором конкурента и дат.
2. **Per-SKU** — точечно с карточки одного товара.

## Bulk: post-corrections

- Метод/путь: `POST /api/sku-slices/post-corrections/run` → ApiTask `sku-slices.post-corrections.run`
- Auth: JWT, роль ≥ ADMIN
- Body: `{ konkName: "balun", dateFrom, dateTo, apply? }` (`apply` default `false`)

При `konkName=balun` задача делает:

1. обычный LTR fake-stock (`4990–5000` ∪ `9950–10050`) по дням окна;
2. **один** RTL-прогон `[9000,11000]` по всем balun productId за весь диапазон (bulk day-maps);
3. rollup только `balun`.

Без `konkName` (полный cron-like прогон) RTL **не** запускается.

Поллинг: как остальные ApiTask. В `result` смотри `balunManualBand` (`patched` / `skipped`).

Полный контракт: [`docs/api/sku-slices.md`](../api/sku-slices.md), [`docs/api/apitasks.md`](../api/apitasks.md).

### UX bulk

1. Выбор конкурента (обязателен для RTL) + `dateFrom`–`dateTo`.
2. Сначала `apply: false` (dry-run), потом `apply: true`.
3. После успеха — инвалидировать графики/range за период.

## Per-SKU

- Метод/путь: `POST /api/sku-slices/sku/:skuId/correct-balun-band-spike`
- Body: `{ dateFrom, dateTo, apply? }`
- Только SKU с `konkName === "balun"`

### UX per-SKU

Карточка balun SKU / график «Динаміка залишків». Подпись в духе «Виправити band-spike» рядом с «Виправити зріз».

1. Выделить период вспышки.
2. Preview (`apply: false`) → таблица `patches`.
3. Confirm → `apply: true`.

## Не путать с

- `PATCH /api/sku-slices/sku/:skuId` — один stock/price на весь диапазон;
- nightly post-pass без `konkName` — нет RTL.

## Ограничения

- «Небольшое» = stock `< 9000`, не `-1`.
- Нужны соседи слева/справа от band-run; иначе `skipped.reason`.
- Период выбирает человек.
