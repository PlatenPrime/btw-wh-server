export type PerfectStockSource =
  | "data-product"
  | "refresh"
  | "cart"
  | "html-oos"
  | "unavailable";

export interface PerfectProductInfo {
  stock: number;
  price: number;
  title?: string;
  source?: PerfectStockSource;
}
