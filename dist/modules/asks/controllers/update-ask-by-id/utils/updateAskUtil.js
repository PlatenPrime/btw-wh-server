import { Ask } from "../../../models/Ask.js";
import { getUpdateAskActionUtil } from "./getUpdateAskActionUtil.js";
export async function updateAskUtil({ solver, solverId, ask, action, status, session, }) {
    const solverData = {
        _id: String(solver._id),
        fullname: solver.fullname,
        telegram: solver.telegram,
        photo: solver.photo,
    };
    const newAction = getUpdateAskActionUtil({ solver, action });
    const updatedActions = [...ask.actions, newAction];
    const updateFields = {
        actions: updatedActions,
        solverData,
        solver: solverId,
    };
    if (status) {
        updateFields.status = status;
    }
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
