# API: Получение всех позиций для снятия (getAsksPulls)

## Описание

Эндпоинт `GET /api/asks/pulls` предназначен для получения общего списка всех позиций, которые необходимо снять по всем активным заявкам. Позиции автоматически группируются по секторам паллет для удобной организации работы складских работников.

## Особенности

### Автоматическое завершение заявок

При каждом запросе к эндпоинту автоматически проверяются заявки со статусом "processing" (в обработке). Если количество уже снятого товара (`pullQuant`) удовлетворяет запрашиваемое количество (`quant`), заявка автоматически завершается:

- Создается событие типа "complete" в истории заявки
- Отправляется уведомление создателю заявки через Telegram (если указан telegram контакт)
- Заявка переводится в статус "completed"

**Важно:** Автоматическое завершение происходит только для заявок:
- Со статусом "processing" (у которых уже назначен solver)
- У которых указано требуемое количество (`quant`)
- У которых `pullQuant >= quant`

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
            "comment": ""
          }
        ]
      }
    ],
    "completedAsks": [
      "507f1f77bcf86cd799439017",
      "507f1f77bcf86cd799439018"
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

| Поле | Тип | Описание |
|------|-----|----------|
| `sector` | `number` | Номер сектора паллеты. Сектора отсортированы по возрастанию |
| `positions` | `Array<PositionForPull>` | Массив позиций в данном секторе |

### PositionForPull

Позиция товара с информацией о планируемом количестве для снятия. Расширяет стандартную структуру `Pos`.

| Поле | Тип | Описание |
|------|-----|----------|
| `_id` | `string` | MongoDB ObjectId позиции |
| `artikul` | `string` | Артикул товара |
| `nameukr` | `string?` | Название товара на украинском |
| `quant` | `number` | Текущее количество товара на позиции |
| `boxes` | `number` | Количество коробок |
| `palletData` | `object` | Данные паллеты |
| `palletData._id` | `string` | ID паллеты |
| `palletData.title` | `string` | Название паллеты |
| `palletData.sector` | `string?` | Номер сектора паллеты |
| `palletData.isDef` | `boolean` | Флаг дефицита |
| `rowData` | `object` | Данные ряда |
| `rowData._id` | `string` | ID ряда |
| `rowData.title` | `string` | Название ряда |
| `palletTitle` | `string` | Кэшированное название паллеты |
| `rowTitle` | `string` | Кэшированное название ряда |
| `sklad` | `string?` | Склад ("pogrebi" или "merezhi") |
| `plannedQuant` | `number \| null` | Планируемое количество для снятия. `null` если в заявке не указано требуемое количество |
| `comment` | `string` | Комментарий |
| `createdAt` | `Date?` | Дата создания |
| `updatedAt` | `Date?` | Дата обновления |

### GetAsksPullsResponse

Основная структура ответа.

| Поле | Тип | Описание |
|------|-----|----------|
| `positionsBySector` | `Array<PositionsBySector>` | Позиции для снятия, сгруппированные по секторам паллет. Сектора отсортированы по возрастанию |
| `completedAsks` | `Array<string>` | Массив ID заявок, которые были автоматически завершены в процессе обработки запроса |

## Примеры использования

### JavaScript/TypeScript (fetch)

```typescript
async function getAsksPulls() {
  const response = await fetch('/api/asks/pulls', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch asks pulls');
  }

  const result = await response.json();
  return result.data;
}

// Использование
const data = await getAsksPulls();

// Обработка позиций по секторам
data.positionsBySector.forEach(sectorGroup => {
  console.log(`Сектор ${sectorGroup.sector}:`);
  sectorGroup.positions.forEach(position => {
    console.log(`  - ${position.artikul}: ${position.plannedQuant} шт.`);
  });
});

// Информация о завершенных заявках
if (data.completedAsks.length > 0) {
  console.log(`Автоматически завершено заявок: ${data.completedAsks.length}`);
}
```

### Axios

```typescript
import axios from 'axios';

async function getAsksPulls() {
  const response = await axios.get('/api/asks/pulls', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.data.data;
}
```

## Логика работы

1. **Получение активных заявок**: Система получает все заявки со статусом "new" или "processing"

2. **Сбор позиций**: Для каждой заявки вызывается логика получения позиций для снятия (аналогично `GET /api/asks/:id/pull`). Собираются только позиции, где `isPullRequired === true`

3. **Автоматическое завершение**: Проверяются заявки со статусом "processing":
   - Если `quant` указан и `pullQuant >= quant`, заявка автоматически завершается
   - Создается событие "complete"
   - Отправляется уведомление создателю заявки

4. **Группировка по секторам**: Все собранные позиции группируются по секторам паллет и сортируются по возрастанию сектора

5. **Возврат результата**: Возвращается структурированный список позиций и массив ID завершенных заявок

## Важные замечания

- **Производительность**: При большом количестве активных заявок запрос может выполняться дольше, так как для каждой заявки выполняется расчет позиций

- **Автоматическое завершение**: Происходит синхронно в процессе обработки запроса. Если завершение какой-то заявки завершилось ошибкой, это не прерывает обработку остальных заявок, но ошибка логируется

- **Группировка**: Позиции группируются только по секторам. Если нужно отобразить информацию о том, к какой заявке относится позиция, необходимо использовать отдельный эндпоинт `GET /api/asks/:id/pull`

- **Сектора**: Сектора отсортированы по возрастанию (0, 1, 2, ...). Позиции без указанного сектора попадают в сектор 0

## Связанные эндпоинты

- `GET /api/asks/:id/pull` - получение позиций для снятия по конкретной заявке
- `PATCH /api/asks/:id/pull` - фиксация снятия товара по заявке
- `PATCH /api/asks/:id/complete` - ручное завершение заявки

