import { Ask } from "../../../models/Ask.js";
import { getUpdateAskActionUtil } from "./getUpdateAskActionUtil.js";
export async function updateAskActionsUtil({ user, ask, action, session, }) {
    const newAction = getUpdateAskActionUtil({ user, action });
    const updatedActions = [...ask.actions, newAction];
    const updateFields = {
        actions: updatedActions,
    };
    const updatedAsk = await Ask.findByIdAndUpdate(ask._id, updateFields, {
        new: true,
        runValidators: true,
        session,
    });
    if (!updatedAsk) {
        throw new Error("Failed to update ask actions");
    }
    return updatedAsk;
}
