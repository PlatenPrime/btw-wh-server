import { Types } from "mongoose";
import { IUser } from "../../auth/models/User.js";

/**
 * User data interface for Ask integration
 */
type AskUserData = Pick<IUser, "_id" | "fullname" | "telegram" | "photo">;

/**
 * Represents a single position within a pull that needs to be processed
 */
export interface IPullPosition {
  /** Unique identifier of the position */
  posId: Types.ObjectId;
  /** Article number/identifier */
  artikul: string;
  /** Ukrainian name of the product */
  nameukr?: string;
  /** Current quantity available on the pallet */
  currentQuant: number;
  /** Current number of boxes available on the pallet */
  currentBoxes: number;
  /** Requested quantity to be pulled from this position */
  requestedQuant: number;
  /** ID of the ask that requests this position */
  askId: Types.ObjectId;
  /** Data of the user who made the ask */
  askerData: AskUserData;
}

/**
 * Represents a virtual pallet with all positions that need to be processed
 * Pulls are calculated dynamically and not stored in database
 */
export interface IPull {
  /** Unique identifier of the pallet */
  palletId: Types.ObjectId;
  /** Title/name of the pallet */
  palletTitle: string;
  /** Sector number for sorting priority (0 if sector is null/undefined) */
  sector: number;
  /** Title/name of the row containing this pallet */
  rowTitle: string;
  /** Array of positions to be processed on this pallet */
  positions: IPullPosition[];
  /** Total number of unique asks involved in this pull */
  totalAsks: number;
}

/**
 * Response interface for pulls API endpoints
 */
export interface IPullsResponse {
  /** Array of calculated pulls */
  pulls: IPull[];
  /** Total number of pulls */
  totalPulls: number;
  /** Total number of asks being processed */
  totalAsks: number;
}

/**
 * Request interface for processing a pull position
 */
export interface IProcessPullPositionRequest {
  /** ID of the ask that requests this position */
  askId: Types.ObjectId;
  /** Actual quantity to be pulled from the position */
  actualQuant: number;
  /** Actual number of boxes to be pulled from the position */
  actualBoxes: number;
  /** ID of the solver processing this position */
  solverId: Types.ObjectId;
}
