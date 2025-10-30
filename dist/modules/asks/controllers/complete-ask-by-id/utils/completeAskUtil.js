import { Ask } from "../../../models/Ask.js";
import { getCompleteAskActionUtil } from "./getCompleteAskActionUtil.js";
export async function completeAskUtil({ solver, solverId, ask, }) {
    const solverData = {
        _id: String(solver._id),
        fullname: solver.fullname,
        telegram: solver.telegram,
        photo: solver.photo,
    };
    const newAction = getCompleteAskActionUtil({ solver });
    const updatedActions = [...ask.actions, newAction];
    const updateFields = {
        actions: updatedActions,
        solverData,
        solver: solverId,
        status: "completed",
    };
    const updatedAsk = await Ask.findByIdAndUpdate(ask._id, updateFields, {
        new: true,
        runValidators: true,
    });
    return updatedAsk;
}
