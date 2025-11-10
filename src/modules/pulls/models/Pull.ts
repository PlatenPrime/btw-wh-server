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
  /** Planned quantity to pull from this position (null when ask has no explicit quantity) */
  plannedQuant: number | null;
  /** Total requested quantity in the ask (null when not provided) */
  totalRequestedQuant: number | null;
  /** Quant already pulled according to ask history */
  alreadyPulledQuant: number;
  /** Boxes already pulled according to ask history */
  alreadyPulledBoxes: number;
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
