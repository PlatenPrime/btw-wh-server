# Целевая раскладка нового репозитория

Логическая карта директорий. Scaffold репо — отдельный этап; здесь только ориентир для фундамента.

## Верхний уровень

```
apps/web          TanStack Start: UI + createServerFn / server routes (closed)
apps/worker       cron, scrapers, excel — код есть, ENABLE_CRONS=false до дня Д
packages/db       Mongoose-модели = контракт FROZEN_MODELS
packages/auth     JWT, roles, login — поведение как в старом auth
packages/scrape-kit   shared transport/cookies/listing helpers (опционально)
```

«Модуль» = граница директорий внутри apps или packages, не Express-модуль 1:1.

## Доменные директории (пример внутри apps/web server + apps/worker)

| Директория                                 | Назначение                                                        |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `skus`                                     | карточки Sku: CRUD, фильтры, live stock orchestration             |
| `skugrs`                                   | группы, fill/clear/purge newsku                                   |
| `konks`                                    | справочник конкурентов                                            |
| `prods`                                    | shared производители (схема синхронна со складом)                 |
| `slices`                                   | запись/чтение SkuSliceMonth, DayMeta, materialize rollups         |
| `reporting`                                | агрегаты sales/chart (бывшие sku-reporting + sales/chart reports) |
| `grabo`                                    | GraboSku — не конкурент                                           |
| `excel`                                    | новый excel-пайплайн с нуля                                       |
| `competitors/air` … `competitors/dojdevik` | scrapers/парсеры по конкуренту                                    |
| `competitors/btrade`                       | btrade как peer-конкурент: срезы + будущие scrapers               |
| `competitors/_shared`                      | переиспользуемые функции (или `packages/scrape-kit`)              |

## Btrade

В legacy срезы живут в `btrade-slices`, а stock Btrade часто через arts/sharik. В successor: директория `competitors/btrade` наравне с air/balun; коллекции `btrade_slice_months` / rollups остаются frozen.

## Grabo

Отдельная директория `grabo`, не под `competitors/`.

## Worker vs web

- **web:** UI, auth middleware на server fn, read/write через domain utils только там, где dual-run позволяет (до дня Д — предпочтительно read + UI против данных, которые пишет старый cron; мутации каталога согласовать, чтобы не плодить двух writers на одни операции).
- **worker:** все schedule-задачи из CRONS_AND_CUTOVER; до дня Д schedule выключен.

## Excel

Не копировать `exceljobs` kinds 1:1. Новый дизайн jobs/файлов; до дня Д не писать в продовую коллекцию `exceljobs`.
