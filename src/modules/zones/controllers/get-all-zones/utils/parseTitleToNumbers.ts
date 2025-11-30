/**
 * Преобразует строку title зоны в массив чисел для правильной числовой сортировки
 * @param title - Строка формата "42-11-2" (1-3 числовых сегмента, разделенных дефисами)
 * @returns Массив чисел, например [42, 11, 2]
 * @example
 * parseTitleToNumbers("42-8-1") // [42, 8, 1]
 * parseTitleToNumbers("42-11-2") // [42, 11, 2]
 * parseTitleToNumbers("42") // [42]
 */
export const parseTitleToNumbers = (title: string): number[] => {
  return title.split("-").map((part) => parseInt(part, 10));
};
