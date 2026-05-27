export type PerfectStockSource =
  | "data-product"
  | "cart"
  | "html-oos"
  | "unavailable";

export interface PerfectProductInfo {
  stock: number;
  price: number;
  title?: string;
  source?: PerfectStockSource;
}
