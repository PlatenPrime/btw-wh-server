import { Types } from "mongoose";
import { IAsk } from "../../asks/models/Ask.js";
import { IPos } from "../../poses/models/Pos.js";
import { IPullPosition } from "../models/Pull.js";

/**
 * Creates a pull position object
 *
 * @param position - Source position
 * @param ask - Associated ask
 * @param requestedQuant - Quantity to request from this position
 * @returns IPullPosition - Created pull position
 */
export const createPullPositionUtil = (
  position: IPos,
  ask: IAsk,
  requestedQuant: number
): IPullPosition => {
  return {
    posId: position._id as Types.ObjectId,
    artikul: position.artikul,
    nameukr: position.nameukr,
    currentQuant: position.quant,
    currentBoxes: position.boxes,
    requestedQuant,
    askId: ask._id as Types.ObjectId,
    askerData: ask.askerData,
  };
};
