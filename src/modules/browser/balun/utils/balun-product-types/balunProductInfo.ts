export interface BalunProductInfo {
  stock: number;
  price: number;
}

export const BALUN_ORIGIN = "https://balun.com.ua";

export const BALUN_NEGATIVE_OUTCOME: BalunProductInfo = {
  stock: -1,
  price: -1,
};
