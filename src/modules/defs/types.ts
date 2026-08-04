/**
 * Интерфейс для информации о существующей заявке
 */
export interface IExistingAsk {
  _id: string;
  status: string;
  createdAt: Date;
  askerName: string;
  askerId: string;
}

/**
 * Типы статусов дефицита
 */
export type DeficitStatus = "limited" | "critical";

/**
 * Интерфейс для данных о дефиците по артикулу
 */
export interface IDeficitItem {
  nameukr: string;
  quant: number;
  sharikQuant: number;
  difQuant: number;
  defLimit: number;
  status: DeficitStatus;
}

export interface IDeficitItemWithAsk extends IDeficitItem {
  existingAsk: IExistingAsk | null;
}

export interface IDeficitCalculationResult {
  [artikul: string]: IDeficitItem;
}

export interface IDeficitCalculationResultWithAsks {
  [artikul: string]: IDeficitItemWithAsk;
}

/**
 * Результат live-расчёта дефицитов (без Mongo Def).
 */
export interface ILiveDefsCalculation {
  result: IDeficitCalculationResult;
  total: number;
  totalCriticalDefs: number;
  totalLimitDefs: number;
  calculatedAt: Date;
}
