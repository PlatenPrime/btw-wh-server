export interface YuminProductInfo {
  stock: number;
  price: number;
  title?: string;
  artikul?: string;
}

export const YUMIN_NEGATIVE_OUTCOME: YuminProductInfo = { stock: -1, price: -1 };
