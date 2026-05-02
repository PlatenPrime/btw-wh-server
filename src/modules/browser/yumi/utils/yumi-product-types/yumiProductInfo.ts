export interface YumiProductInfo {
  stock: number;
  price: number;
  title?: string;
}

export const YUMI_NEGATIVE_OUTCOME: YumiProductInfo = { stock: -1, price: -1 };
