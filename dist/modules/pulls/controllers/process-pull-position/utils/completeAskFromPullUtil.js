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
export const completeAskFromPullUtil = async (solver, solverId, ask, session) => {
    return await completeAskUtil({
        solver,
        solverId,
        ask,
        session,
    });
};
