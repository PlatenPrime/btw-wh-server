import { Ask } from "../../../models/Ask.js";
import { buildAskEvent, mapUserToAskUserData, } from "../../../utils/askEventsUtil.js";
import { getCompleteAskActionUtil } from "./getCompleteAskActionUtil.js";
export async function completeAskUtil({ solver, solverId, ask, session, }) {
    const solverData = mapUserToAskUserData(solver);
    const newAction = getCompleteAskActionUtil({ solver });
    const newEvent = buildAskEvent({ eventName: "complete", user: solverData });
    const updatedActions = [...ask.actions, newAction];
    const updatedEvents = [...(ask.events ?? []), newEvent];
    const updateFields = {
        actions: updatedActions,
        solverData,
        solver: solverId,
        status: "completed",
        events: updatedEvents,
        pullQuant: ask.pullQuant ?? 0,
        pullBox: ask.pullBox ?? 0,
    };
    const updatedAsk = await Ask.findByIdAndUpdate(ask._id, updateFields, {
        new: true,
        runValidators: true,
        session,
    });
    if (!updatedAsk) {
        throw new Error("Failed to complete ask");
    }
    return updatedAsk;
}
