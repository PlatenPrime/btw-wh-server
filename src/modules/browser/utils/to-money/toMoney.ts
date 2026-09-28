/**
 * Округляет денежное значение до 2 знаков после запятой.
 */
export function toMoney(value: number): number {
  return Number(value.toFixed(2));
}
