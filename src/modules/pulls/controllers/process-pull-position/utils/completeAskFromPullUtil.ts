import mongoose, { ClientSession } from "mongoose";
import { Types } from "mongoose";
import { IUser } from "../../../../auth/models/User.js";
import { IAsk } from "../../../../asks/models/Ask.js";
import { completeAskUtil } from "../../../../asks/controllers/complete-ask-by-id/utils/completeAskUtil.js";

/**
 * Completes ask from pull processing
 * Uses the completeAskUtil from asks module
 *
 * @param solver - Solver user
 * @param solverId - Solver user ID
 * @param ask - Ask to complete
 * @param session - MongoDB session for transaction
 * @returns Promise<IAsk> - Completed ask
 */
export const completeAskFromPullUtil = async (
  solver: IUser,
  solverId: Types.ObjectId,
  ask: IAsk,
  session: ClientSession
): Promise<IAsk> => {
  return await completeAskUtil({
    solver,
    solverId,
    ask,
    session,
  });
};
