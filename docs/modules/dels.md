# Модуль Dels (Поставки)

## Описание модуля

Модуль `dels` решает задачи учёта поставок. Он обеспечивает хранение поставок с привязкой к артикулам и их количественным значениям, обновление этих значений из внешнего источника (sharik.ua), а также получение списка поставок без тяжёлых данных об артикулах для быстрого отображения на фронтенде.

## Сущности модуля

### Del (Поставка)

Поставка представляет собой документ с названием, датами создания и обновления, а также объектом `artikuls`: ключи — строки-артикулы (как в моделях Art, Def, Pos), значения — объекты `{ quantity: number, nameukr?: string }` (количество и опционально название на украинском). При создании поставки поле `nameukr` подставляется из коллекции arts по ключу артикула; если артикул в arts не найден — поле не задаётся. При обновлении артикулов из sharik.ua сохраняются количество и название из ответа getSharikData.

## Связи между сущностями

- **Del → Art / Def / Pos**: Косвенная связь по смыслу. Ключи в `artikuls` совпадают с полем `artikul` в артикулах, дефицитах и позициях. Явных ссылок в схеме нет.

## Концепции и принятые решения

### Обновление значений из sharik.ua

Значения артикулов в поставке можно обновлять данными с sharik.ua (getSharikData). Поддерживается обновление одного артикула по id поставки и артикулу, а также фоновое обновление всех артикулов поставки. При фоновом обновлении ответ возвращается сразу (202), процесс выполняется асинхронно.

### Список без artikuls

Эндпоинт получения списка поставок возвращает только `_id`, `title`, `createdAt`, `updatedAt`, без поля `artikuls`, чтобы уменьшить объём данных при отображении списка.

### Удаление только для PRIME

Удаление поставки разрешено только роли PRIME, остальные операции создания и обновления — ADMIN и выше, чтение — USER и выше.

## API эндпоинты

### GET `/api/dels`

Получение списка поставок (без поля artikuls).

**Запрос:**

- Query параметры отсутствуют

**Ответ:**

- 200: `{ message: string, data: Array<{ _id, title, createdAt, updatedAt }> }`
- 500: `{ message: string, error?: any }` - ошибка сервера

**Доступ:** Требует роль USER

### GET `/api/dels/id/:id`

Получение поставки по идентификатору (полный документ с artikuls).

**Запрос:**

- Path параметры: `id` (MongoDB ObjectId)

**Ответ:**

- 200: `{ message: string, data: Del }`
- 400: `{ message: string, errors?: array }` - ошибка валидации
- 404: `{ message: string }` - поставка не найдена
- 500: `{ message: string, error?: any }` - ошибка сервера

**Доступ:** Требует роль USER

### POST `/api/dels`

Создание поставки.

**Запрос:**

- Body: `{ title: string, artikuls?: Record<string, number> }`

**Ответ:**

- 201: `{ message: string, data: Del }`
- 400: `{ message: string, errors?: array }` - ошибка валидации
- 500: `{ message: string, error?: any }` - ошибка сервера

**Доступ:** Требует роль ADMIN

### DELETE `/api/dels/id/:id`

Удаление поставки по идентификатору.

**Запрос:**

- Path параметры: `id` (MongoDB ObjectId)

**Ответ:**

- 200: `{ message: string }`
- 400: `{ message: string, errors?: array }` - ошибка валидации
- 404: `{ message: string }` - поставка не найдена
- 500: `{ message: string, error?: any }` - ошибка сервера

**Доступ:** Требует роль PRIME

### PATCH `/api/dels/:id/title`

Обновление названия поставки.

**Запрос:**

- Path параметры: `id` (MongoDB ObjectId)
- Body: `{ title: string }`

**Ответ:**

- 200: `{ message: string, data: Del }`
- 400: `{ message: string, errors?: array }` - ошибка валидации
- 404: `{ message: string }` - поставка не найдена
- 500: `{ message: string, error?: any }` - ошибка сервера

**Доступ:** Требует роль ADMIN

### PATCH `/api/dels/:id/artikuls/:artikul`

Обновление значения указанного артикула в поставке данными с sharik.ua. Если артикула нет в поставке — он добавляется.

**Запрос:**

- Path параметры: `id` (MongoDB ObjectId), `artikul` (string)

**Ответ:**

- 200: `{ message: string, data: Del }`
- 400: `{ message: string, errors?: array }` - ошибка валидации
- 404: `{ message: string }` - поставка не найдена или товар не найден на sharik.ua
- 500: `{ message: string, error?: any }` - ошибка сервера

**Доступ:** Требует роль ADMIN

### POST `/api/dels/:id/artikuls/update-all`

Запуск фонового обновления значений всех артикулов поставки (sharik.ua). Ответ возвращается сразу после запуска процесса.

**Запрос:**

- Path параметры: `id` (MongoDB ObjectId)

**Ответ:**

- 202: `{ message: string }` - процесс обновления запущен
- 400: `{ message: string, errors?: array }` - ошибка валидации
- 404: `{ message: string }` - поставка не найдена
- 500: `{ message: string, error?: any }` - ошибка сервера

**Доступ:** Требует роль ADMIN

**Примечание:** Операция выполняется асинхронно в фоне.

## Форматы данных

### Del (полный документ)

```typescript
{
  _id: string;                    // MongoDB ObjectId
  title: string;                  // Название поставки
  artikuls: {                     // Объект: артикул -> { quantity, nameukr? }
    [artikul: string]: {
      quantity: number;
      nameukr?: string;
    };
  };
  createdAt: Date;                // Дата создания
  updatedAt: Date;                // Дата обновления
}
```

### Элемент списка (без artikuls)

```typescript
{
  _id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}
```
