# API: Получение всех позиций для снятия (getAsksPulls)

## Описание

Эндпоинт `GET /api/asks/pulls` предназначен для получения общего списка всех позиций, которые необходимо снять по всем активным заявкам. Позиции автоматически группируются по секторам паллет для удобной организации работы складских работников.

## Особенности

### Автоматическое завершение заявок

После отправки ответа клиенту в фоновом режиме автоматически проверяются заявки со статусом "processing" (в обработке). Если количество уже снятого товара (`pullQuant`) удовлетворяет запрашиваемое количество (`quant`), заявка автоматически завершается:

- Создается событие типа "complete" в истории заявки
- Отправляется уведомление создателю заявки через Telegram (если указан telegram контакт)
- Заявка переводится в статус "completed"

**Важно:** Автоматическое завершение происходит только для заявок:

- Со статусом "processing" (у которых уже назначен solver)
- У которых указано требуемое количество (`quant`)
- У которых `pullQuant >= quant`

**Примечание:** Автоматическое завершение происходит асинхронно в фоне после отправки ответа клиенту. Это позволяет клиенту получить ответ быстрее, не дожидаясь завершения обработки заявок.

## Эндпоинт

### GET `/api/asks/pulls`

Получение всех позиций для снятия по всем активным заявкам.

**URL:** `/api/asks/pulls`

**Метод:** `GET`

**Аутентификация:** Требуется (JWT токен в заголовке `Authorization: Bearer <token>`)

**Роль:** `USER`

**Параметры запроса:** Отсутствуют

## Формат ответа

### Успешный ответ (200 OK)

```json
{
  "message": "Asks pulls retrieved successfully",
  "data": {
    "positionsBySector": [
      {
        "sector": 1,
        "positions": [
          {
            "_id": "507f1f77bcf86cd799439011",
            "artikul": "ART001",
            "nameukr": "Товар 1",
            "quant": 100,
            "boxes": 5,
            "palletData": {
              "_id": "507f1f77bcf86cd799439012",
              "title": "Паллета 1",
              "sector": "1",
              "isDef": false
            },
            "rowData": {
              "_id": "507f1f77bcf86cd799439013",
              "title": "Ряд 1"
            },
            "palletTitle": "Паллета 1",
            "rowTitle": "Ряд 1",
            "sklad": "pogrebi",
            "plannedQuant": 50,
            "askId": "507f1f77bcf86cd799439019",
            "askArtikul": "ART001",
            "askQuant": 100,
            "askRemainingQuantity": 50,
            "comment": ""
          }
        ]
      },
      {
        "sector": 2,
        "positions": [
          {
            "_id": "507f1f77bcf86cd799439014",
            "artikul": "ART002",
            "nameukr": "Товар 2",
            "quant": 200,
            "boxes": 10,
            "palletData": {
              "_id": "507f1f77bcf86cd799439015",
              "title": "Паллета 2",
              "sector": "2",
              "isDef": false
            },
            "rowData": {
              "_id": "507f1f77bcf86cd799439016",
              "title": "Ряд 2"
            },
            "palletTitle": "Паллета 2",
            "rowTitle": "Ряд 2",
            "sklad": "pogrebi",
            "plannedQuant": 100,
            "askId": "507f1f77bcf86cd799439020",
            "askArtikul": "ART002",
            "askQuant": 200,
            "askRemainingQuantity": 100,
            "comment": ""
          }
        ]
      }
    ]
  }
}
```

### Ошибка сервера (500 Internal Server Error)

```json
{
  "message": "Server error while fetching asks pulls",
  "error": "Описание ошибки"
}
```

## Структура данных

### PositionsBySector

Группа позиций, сгруппированных по сектору паллеты.

| Поле        | Тип                      | Описание                                                    |
| ----------- | ------------------------ | ----------------------------------------------------------- |
| `sector`    | `number`                 | Номер сектора паллеты. Сектора отсортированы по возрастанию |
| `positions` | `Array<PositionForPull>` | Массив позиций в данном секторе                             |

### PositionForPull

Позиция товара с информацией о планируемом количестве для снятия. Расширяет стандартную структуру `Pos`.

| Поле                | Тип              | Описание                                                                                                     |
| ------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------ |
| `_id`               | `string`         | MongoDB ObjectId позиции                                                                                     |
| `artikul`           | `string`         | Артикул товара                                                                                               |
| `nameukr`           | `string?`        | Название товара на украинском                                                                                |
| `quant`             | `number`         | Текущее количество товара на позиции                                                                         |
| `boxes`             | `number`         | Количество коробок                                                                                           |
| `palletData`        | `object`         | Данные паллеты                                                                                               |
| `palletData._id`    | `string`         | ID паллеты                                                                                                   |
| `palletData.title`  | `string`         | Название паллеты                                                                                             |
| `palletData.sector` | `string?`        | Номер сектора паллеты                                                                                        |
| `palletData.isDef`  | `boolean`        | Флаг дефицита                                                                                                |
| `rowData`           | `object`         | Данные ряда                                                                                                  |
| `rowData._id`       | `string`         | ID ряда                                                                                                      |
| `rowData.title`     | `string`         | Название ряда                                                                                                |
| `palletTitle`       | `string`         | Кэшированное название паллеты                                                                                |
| `rowTitle`          | `string`         | Кэшированное название ряда                                                                                   |
| `sklad`             | `string?`        | Склад ("pogrebi" или "merezhi")                                                                              |
| `plannedQuant`      | `number \| null` | Планируемое количество для снятия с данной позиции. `null` если в заявке не указано требуемое количество                      |
| `askId`             | `string`         | ID заявки, для которой предназначена позиция. Позволяет отслеживать, для какого ask снимается товар          |
| `askArtikul`        | `string`         | Артикул из заявки. Полезно для генерации событий и различения позиций для разных asks с одинаковым артикулом |
| `askQuant`          | `number \| null` | Количество товара, которое просят в заявке. `null` если в заявке не указано требуемое количество            |
| `askRemainingQuantity` | `number \| null` | Оставшееся количество для снятия по заявке. `null` если в заявке не указано требуемое количество. Позволяет видеть, сколько еще нужно снять по заявке |
| `comment`           | `string`         | Комментарий                                                                                                  |
| `createdAt`         | `Date?`          | Дата создания                                                                                                |
| `updatedAt`         | `Date?`          | Дата обновления                                                                                              |

### GetAsksPullsResponse

Основная структура ответа.

| Поле                | Тип                        | Описание                                                                                                                                                          |
| ------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `positionsBySector` | `Array<PositionsBySector>` | Позиции для снятия, сгруппированные по секторам паллет. Сектора отсортированы по возрастанию. Каждая позиция содержит информацию о заявке (`askId`, `askArtikul`) |

## Примеры использования

### JavaScript/TypeScript (fetch)

```typescript
async function getAsksPulls() {
  const response = await fetch("/api/asks/pulls", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch asks pulls");
  }

  const result = await response.json();
  return result.data;
}

// Использование
const data = await getAsksPulls();

// Обработка позиций по секторам
data.positionsBySector.forEach((sectorGroup) => {
  console.log(`Сектор ${sectorGroup.sector}:`);
  sectorGroup.positions.forEach((position) => {
    const askInfo = position.askQuant !== null 
      ? `ask: ${position.askId} (просят: ${position.askQuant}, осталось: ${position.askRemainingQuantity})`
      : `ask: ${position.askId} (количество не указано)`;
    console.log(
      `  - ${position.artikul} (${askInfo}): снять ${position.plannedQuant ?? 'все'} шт.`
    );
  });
});

// Группировка позиций по asks для удобства отслеживания
const positionsByAsk = new Map<
  string,
  (typeof data.positionsBySector)[0]["positions"]
>();
data.positionsBySector.forEach((sectorGroup) => {
  sectorGroup.positions.forEach((position) => {
    if (!positionsByAsk.has(position.askId)) {
      positionsByAsk.set(position.askId, []);
    }
    positionsByAsk.get(position.askId)!.push(position);
  });
});

// Вывод позиций по каждой заявке
positionsByAsk.forEach((positions, askId) => {
  console.log(
    `Ask ${askId} (${positions[0].askArtikul}): ${positions.length} позиций`
  );
});
```

### Axios

```typescript
import axios from "axios";

async function getAsksPulls() {
  const response = await axios.get("/api/asks/pulls", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data.data;
}
```

## Логика работы

1. **Получение активных заявок**: Система получает все заявки со статусом "new" или "processing"

2. **Сбор позиций**: Для каждой заявки вызывается логика получения позиций для снятия (аналогично `GET /api/asks/:id/pull`). Собираются только позиции, где `isPullRequired === true`. Каждая позиция дополняется информацией о заявке (`askId`, `askArtikul`)

3. **Группировка по секторам**: Все собранные позиции группируются по секторам паллет и сортируются по возрастанию сектора

4. **Отправка ответа клиенту**: Возвращается структурированный список позиций с информацией о заявках

5. **Фоновая обработка**: После отправки ответа в фоне проверяются заявки со статусом "processing":
   - Если `quant` указан и `pullQuant >= quant`, заявка автоматически завершается
   - Создается событие "complete"
   - Отправляется уведомление создателю заявки через Telegram

## Важные замечания

- **Производительность**: При большом количестве активных заявок запрос может выполняться дольше, так как для каждой заявки выполняется расчет позиций

- **Автоматическое завершение**: Происходит асинхронно в фоне после отправки ответа клиенту. Это позволяет клиенту получить ответ быстрее. Если завершение какой-то заявки завершилось ошибкой, это не прерывает обработку остальных заявок, но ошибка логируется

- **Информация о заявках**: Каждая позиция содержит полную информацию о заявке:
  - `askId` и `askArtikul` - идентификация заявки
  - `askQuant` - сколько товара просят в заявке
  - `askRemainingQuantity` - сколько еще осталось снять по заявке
  - `plannedQuant` - сколько нужно снять с конкретной позиции
  Это позволяет клиенту отрендерить полную картину: сколько просят, сколько уже снято, сколько осталось, и сколько нужно снять с каждой позиции. Особенно важно, когда есть несколько заявок с одинаковым артикулом - позиции для разных заявок можно легко различить

- **Группировка**: Позиции группируются по секторам паллет, но каждая позиция содержит информацию о заявке. Это позволяет как работать с позициями по секторам, так и отслеживать позиции по конкретным заявкам

- **Сектора**: Сектора отсортированы по возрастанию (0, 1, 2, ...). Позиции без указанного сектора попадают в сектор 0

## Связанные эндпоинты

- `GET /api/asks/:id/pull` - получение позиций для снятия по конкретной заявке
- `PATCH /api/asks/:id/pull` - фиксация снятия товара по заявке
- `PATCH /api/asks/:id/complete` - ручное завершение заявки
