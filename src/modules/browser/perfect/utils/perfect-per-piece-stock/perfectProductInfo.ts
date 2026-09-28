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

export const PERFECT_UNAVAILABLE_OUTCOME: PerfectProductInfo = {
  stock: -1,
  price: -1,
  source: "unavailable",
};
