/**
 * Общие типы точек среза Btrade (quantity/price).
 * Вынесены из BtradeSlice, чтобы store/months не зависели от legacy-модели.
 */

export interface IBtradeSliceDataItem {
  price: number;
  quantity: number;
}
