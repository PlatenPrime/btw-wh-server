import { IPositionForPull } from "../../get-ask-pull/types/getAskPullResponse.js";

/**
 * Группа позиций, сгруппированных по сектору паллеты
 */
export interface IPositionsBySector {
  /** Номер сектора паллеты */
  sector: number;
  /** Позиции в данном секторе */
  positions: IPositionForPull[];
}

/**
 * Response structure for getAsksPulls controller
 */
export interface GetAsksPullsResponse {
  /** Позиции для снятия, сгруппированные по секторам паллет */
  positionsBySector: IPositionsBySector[];
  /** ID asks, которые были автоматически завершены */
  completedAsks: string[];
}

