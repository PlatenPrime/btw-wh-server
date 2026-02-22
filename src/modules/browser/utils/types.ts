/**
 * Единый контракт для данных об остатках с внешнего сайта.
 * Используется модулем browser для sharte и других источников.
 */
export interface StockInfo {
  id: string | number;
  name: string;
  stock: number;
  reserved: number;
  available: number;
  /** Цена товара, если источник её отдаёт */
  price?: number;
}
