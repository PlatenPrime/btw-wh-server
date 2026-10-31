export type DojdevikProductInfo = {
  stock: number;
  price: number;
  title?: string;
  artikul?: string;
};

export const DOJDEVIK_NEGATIVE_OUTCOME: DojdevikProductInfo = {
  stock: -1,
  price: -1,
};
