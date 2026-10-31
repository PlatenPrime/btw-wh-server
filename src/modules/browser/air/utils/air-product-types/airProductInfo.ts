export interface AirProductInfo {
  stock: number;
  price: number;
  artikul?: string;
}

export const AIR_NEGATIVE_OUTCOME: AirProductInfo = { stock: -1, price: -1 };
