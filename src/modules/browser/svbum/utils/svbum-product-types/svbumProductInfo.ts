export interface SvbumProductInfo {
  stock: number;
  price: number;
  title?: string;
  artikul?: string;
}

export const SVBUM_NEGATIVE_OUTCOME: SvbumProductInfo = { stock: -1, price: -1 };
