// Рекурсивно преобразует все ObjectId в строки во всех вложенных структурах объекта или массива
import { Types } from "mongoose";

/**
 * Рекурсивно преобразует все значения типа Types.ObjectId в строки во всех вложенных структурах объекта или массива.
 * @param obj - Любой объект, массив или значение
 * @returns Объект, массив или значение с преобразованными ObjectId в строки
 */
export function serializeIds(obj: any): any {
  if (Array.isArray(obj)) return obj.map(serializeIds);
  if (obj && typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      if (obj[key] instanceof Types.ObjectId) {
        result[key] = obj[key].toString();
      } else {
        result[key] = serializeIds(obj[key]);
      }
    }
    return result;
  }
  return obj;
}
