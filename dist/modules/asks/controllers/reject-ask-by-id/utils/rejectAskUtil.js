import { Ask } from "../../../models/Ask.js";
import { getRejectAskActionUtil } from "./getRejectAskActionUtil.js";
export async function rejectAskUtil({ solver, solverId, ask, session, }) {
    const solverData = {
        _id: solver._id,
        fullname: solver.fullname,
        telegram: solver.telegram,
        photo: solver.photo,
    };
    const newAction = getRejectAskActionUtil({ solver });
    const updatedActions = [...ask.actions, newAction];
    const updateFields = {
        actions: updatedActions,
        solverData,
        solver: solverId,
        status: "rejected",
    };
    const updatedAsk = await Ask.findByIdAndUpdate(ask._id, updateFields, {
        new: true,
        runValidators: true,
        session,
    });
    if (!updatedAsk) {
        throw new Error("Failed to update ask");
    }
    return updatedAsk;
}
