/**
 * Общие типы точек среза SKU (stock/price).
 * Вынесены из SkuSlice, чтобы store/months не зависели от legacy-модели.
 */

export interface ISkuSliceDataItem {
  stock: number;
  price: number;
}

/** Мета rotation-среза (observability; логика due — hash productId). */
export interface ISkuSliceRotationMeta {
  cycleDays: number;
  dayIndex: number;
  dueCount: number;
}

/** Статистика прогона дневного среза (DayMeta). */
export interface ISkuSliceDayRunStats {
  filled: number;
  invalid: number;
  errorCount: number;
  dueTotal?: number;
  abortReason?: string;
}
