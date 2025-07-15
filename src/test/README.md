# Документация по тестированию проекта `btw-wh-server`

## Оглавление

- [Общие сведения](#общие-сведения)
- [Тестовая инфраструктура](#тестовая-инфраструктура)
- [Структура и типы тестов](#структура-и-типы-тестов)
- [Паттерны и best practices](#паттерны-и-best-practices)
- [Интеграционные тесты](#интеграционные-тесты)
- [Валидация и обработка ошибок](#валидация-и-обработка-ошибок)
- [Расширение и добавление тестов](#расширение-и-добавление-тестов)
- [Покрытие и требования](#покрытие-и-требования)
- [Типичные ошибки и FAQ](#типичные-ошибки-и-faq)
- [Примеры и шаблоны](#примеры-и-шаблоны)
- [Ссылки и ресурсы](#ссылки-и-ресурсы)

---

## Общие сведения

В проекте используется **Vitest** для юнит- и интеграционного тестирования. Все тесты располагаются в папке `src/test` и в подкаталогах `__tests__` внутри модулей. Для изоляции данных применяется **MongoDB Memory Server** (реплика-сет).

## Тестовая инфраструктура

- **Vitest** — основной тестовый раннер.
- **MongoDB Memory Server** — in-memory база для изоляции данных.
- **Supertest** — для HTTP-интеграционных тестов.
- **Zod** — для валидации входных данных.
- **.env.test** — переменные окружения для тестов.
- **Express** — для интеграционных тестов роутеров.
- **Вспомогательные утилиты** — `src/test/utils/testHelpers.ts` (JWT, заголовки, моки Express, генерация данных).

### Инициализация и очистка

- В `src/test/setup.ts` происходит запуск MongoDB Memory Server, подключение mongoose, регистрация моделей, очистка коллекций между тестами (`beforeEach`).
- Все тесты запускаются в изолированной среде, данные не сохраняются между тестами.

## Структура и типы тестов

- **Юнит-тесты**: тестируют отдельные функции, утилиты, валидацию.
- **Модульные тесты**: покрывают бизнес-логику контроллеров, моделей, сервисов.
- **Интеграционные тесты**: тестируют роутеры, взаимодействие с БД, HTTP endpoints.
- **Тестовые утилиты**: фабрики, генераторы данных, моки Express, JWT.

### Пример структуры:

```
src/test/
  database.test.ts         # Тесты работы с БД и фабрики
  example.test.ts          # Пример юнит-теста
  setup.ts                 # Глобальный setup для тестов
  unit.test.ts             # Общие юнит-тесты
  utils/testHelpers.ts     # Вспомогательные функции и моки
src/modules/arts/__tests__/
  router.integration.test.ts
  controllers/__tests__/*.test.ts
  models/__tests__/*.test.ts
```

## Паттерны и best practices

- Каждый тест изолирован: данные очищаются между тестами (`beforeEach`).
- Для Express-контроллеров используются мок-объекты Request/Response (см. testHelpers).
- Для мокинга БД и внешних сервисов — `vi.spyOn`, `vi.mockRejectedValueOnce`, `vi.mockResolvedValueOnce`.
- Проверяются не только успешные сценарии, но и ошибки, edge cases, валидация входных данных.
- Для асинхронных операций — async/await, мок-сессии mongoose.
- В тестах контроллеров используются фабрики для создания тестовых сущностей.
- Для интеграционных тестов — реальное express-приложение с in-memory MongoDB.
- Используйте JSDoc для сложных тестов и функций.

## Интеграционные тесты

- Используют Supertest и express-приложение, подключенное к in-memory MongoDB.
- Проверяется корректность HTTP-ответов, статусы, структура данных, сообщения об ошибках.
- Для тестирования внешних API (например, парсинг HTML) используются моки axios.
- Пример: `src/modules/arts/__tests__/router.integration.test.ts`.

## Валидация и обработка ошибок

- В контроллерах и тестах используется Zod для валидации схем.
- В тестах обязательно проверяется обработка невалидных данных, отсутствие обязательных параметров, ошибки БД.
- Проверяйте сообщения об ошибках и коды статусов.

## Расширение и добавление тестов

- Для новых модулей создавайте подкаталоги `__tests__` и следуйте структуре существующих модулей.
- Для новых тестов используйте суффиксы `.test.ts` (юнит/модульные) и `.integration.test.ts` (интеграционные).
- Используйте фабрики и утилиты из `testHelpers.ts` для генерации данных и моков.
- Для интеграционных тестов — используйте Supertest и express-приложение.
- Для мокинга внешних сервисов — используйте отдельные файлы с исправленными моками, если требуется.

## Покрытие и требования

- Покрытие кода анализируется через `npx vitest run --coverage`.
- Минимальное рекомендуемое покрытие: **80%** для бизнес-логики и контроллеров.
- В CI рекомендуется запускать все тесты и проверять покрытие.

## Типичные ошибки и FAQ

- **Неочищенные моки или данные** могут приводить к нестабильности тестов — всегда используйте `beforeEach`/`afterEach`.
- Для сложных моков (например, axios) используйте отдельные файлы с исправленными моками.
- Если тесты падают только в CI — проверьте переменные окружения и инициализацию in-memory MongoDB.
- Для отладки используйте `console.log`, запуск отдельных тестов, `--reporter verbose`.
- Если тесты "зависают" — проверьте, что все асинхронные операции завершаются корректно.

## Примеры и шаблоны

### Пример юнит-теста:

```ts
import { describe, it, expect } from "vitest";
import { add } from "../utils/math";

describe("add", () => {
  it("should add two numbers", () => {
    expect(add(2, 3)).toBe(5);
  });
});
```

### Пример интеграционного теста роутера:

```ts
import express from "express";
import request from "supertest";
import { beforeEach, describe, it, expect } from "vitest";
import artRouter from "../router";

describe("Arts Router Integration", () => {
  let app: express.Application;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/arts", artRouter);
  });

  it("should return all arts", async () => {
    const response = await request(app).get("/api/arts").expect(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
```

### Пример мок-объекта Express:

```ts
import {
  createMockRequest,
  createMockResponse,
} from "../../test/utils/testHelpers";

const req = createMockRequest({ body: { title: "Test" } });
const res = createMockResponse();
```

### Пример мокинга метода модели:

```ts
import { vi } from "vitest";
import { Pallet } from "../models/Pallet";

vi.spyOn(Pallet, "find").mockResolvedValueOnce([]);
```

## Ссылки и ресурсы

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Best Practices for Unit Testing](https://martinfowler.com/bliki/UnitTest.html)
- [Supertest](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [Zod](https://zod.dev/)

---

> **Важно:**
>
> - Соблюдайте последовательность и структуру при добавлении новых тестов.
> - Перед коммитом убедитесь, что все тесты проходят успешно.
> - Регулярно обновляйте этот файл при изменении подходов к тестированию или структуры тестов.
