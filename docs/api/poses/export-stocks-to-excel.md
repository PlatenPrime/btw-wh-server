# Export Poses Stocks To Excel

## Endpoint

```
POST /api/poses/export-stocks
```

## Назначение

Экспортирует остатки по позициям (poses) в Excel-файл. Позиции агрегируются по артикулу, включаются только записи с положительным остатком. Можно получить данные по конкретному складу (`merezhi` или `pogrebi`) либо по обоим сразу.

## Тело запроса

| Поле   | Тип     | Обязательность | Допустимые значения | Описание                                |
| ------ | ------- | -------------- | ------------------- | --------------------------------------- |
| `sklad` | string | Нет            | `merezhi` \| `pogrebi` | Код склада. Если не передан — выгружаются оба склада. |

## Заголовки ответа Excel

- `Артикул`
- `Название (укр)`
- `Склад`
- `Количество`

`Склад` содержит список складов через запятую, если артикул присутствует на нескольких площадках.

## Успешный ответ

- **Статус:** `200 OK`
- **Контент:** бинарный поток Excel (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)
- **Название файла:** `poses_stocks_<sklad|all>_<YYYY-MM-DD>.xlsx`

## Ошибки

| Статус | Причина                               |
| ------ | -------------------------------------- |
| 400    | Тело запроса не прошло валидацию (`sklad` вне списка) |
| 404    | Нет позиций с положительным остатком под заданные условия |
| 500    | Внутренняя ошибка сервера              |

## Пример использования (TypeScript + Fetch)

```typescript
type ExportSklad = "merezhi" | "pogrebi" | undefined;

export const exportPosesStocks = async (sklad?: ExportSklad) => {
  const token = localStorage.getItem("authToken");
  const response = await fetch("/api/poses/export-stocks", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sklad }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message ?? "Failed to export stocks");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `poses-stocks-${sklad ?? "all"}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
};
```

## Заметки

- Экспорт доступен только пользователям с ролью `ADMIN`.
- Позиции группируются по `artikul`, сумма остатков выводится в колонке `Количество`.
- В выгрузку попадают только записи с `quant > 0`.


