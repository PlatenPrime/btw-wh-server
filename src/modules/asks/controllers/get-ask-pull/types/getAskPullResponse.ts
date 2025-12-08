import { IPos } from "../../../../poses/models/Pos.js";

/**
 * Position extended with planned quantity for pull operation
 */
export interface IPositionForPull extends IPos {
  /** Количество для снятия (null если quant не указан в ask) */
  plannedQuant: number | null;
}

/**
 * Response structure for getAskPull controller
 */
export interface GetAskPullResponse {
  /** Флаг необходимости снятия товара */
  isPullRequired: boolean;
  /** Список позиций для снятия, отсортированных по сектору паллеты */
  positions: IPositionForPull[];
  /** Оставшееся количество для снятия (null если quant не указан в ask) */
  remainingQuantity: number | null;
  /** Статус снятия */
  status: "process" | "satisfied" | "no_poses" | "finished";
  message: string;
}

