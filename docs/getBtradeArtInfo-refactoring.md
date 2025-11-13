# Рефакторинг getBtradeArtInfoController: унификация формата ответов

## Дата изменений
2024

## Описание
Приведение обработки ошибки "данные не найдены" в контроллере `getBtradeArtInfoController` к общему подходу проекта, где вместо HTTP статуса 404 возвращается статус 200 с полем `exists: false`.

## Изменения

### Контроллер
**Файл:** `src/modules/arts/controllers/get-btrade-art-info/getBtradeArtInfoController.ts`

#### До изменений:
- При отсутствии данных возвращался HTTP статус **404** с сообщением об ошибке
- При успешном получении данных возвращались данные напрямую без обёртки

#### После изменений:
- При отсутствии данных возвращается HTTP статус **200** с объектом:
  ```json
  {
    "exists": false,
    "message": "No products found for this artikul",
    "data": null
  }
  ```
- При успешном получении данных возвращается HTTP статус **200** с объектом:
  ```json
  {
    "exists": true,
    "message": "Product info retrieved successfully",
    "data": { ... }
  }
  ```

### Тесты
**Файл:** `src/modules/arts/controllers/__tests__/getBtradeArtInfoController.test.ts`

#### Изменения:
1. **Тест "200: возвращает данные из внешнего API"**
   - Обновлена проверка структуры ответа: добавлены поля `exists`, `message`, `data`
   - Ожидается `exists: true` при успешном получении данных

2. **Тест "200: возвращает exists false если товар не найден"** (переименован из "404: возвращает ошибку если товар не найден")
   - Изменён ожидаемый HTTP статус с **404** на **200**
   - Обновлена проверка структуры ответа: `exists: false`, `message`, `data: null`

## Причина изменений
Унификация формата ответов API в соответствии с общим подходом проекта, используемым в других контроллерах:
- `getArtByIdController`
- `getArtController`
- `getRowById`
- `getPosByIdController`
- и других

## Совместимость
⚠️ **Breaking change**: Изменение формата ответа API требует обновления клиентского кода, который обрабатывает случай отсутствия данных.

### Миграция для клиентов:
- **Было:** Проверка HTTP статуса `404` для определения отсутствия данных
- **Стало:** Проверка поля `exists: false` в теле ответа со статусом `200`

## Примеры использования

### До изменений:
```typescript
const response = await fetch('/api/arts/btrade/TEST-001');
if (response.status === 404) {
  // Товар не найден
}
```

### После изменений:
```typescript
const response = await fetch('/api/arts/btrade/TEST-001');
const result = await response.json();
if (!result.exists) {
  // Товар не найден
}
```

## Связанные файлы
- `src/modules/arts/controllers/get-btrade-art-info/getBtradeArtInfoController.ts`
- `src/modules/arts/controllers/__tests__/getBtradeArtInfoController.test.ts`

