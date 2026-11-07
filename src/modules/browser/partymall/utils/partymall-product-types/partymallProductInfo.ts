export interface PartymallProductInfo {
  stock: number;
  price: number;
  title?: string;
  artikul?: string;
}

export const PARTYMALL_NEGATIVE_OUTCOME: PartymallProductInfo = { stock: -1, price: -1 };
