import { Types } from "mongoose";
import { Ask, } from "../../../models/Ask.js";
import { buildAskEvent, mapUserToAskUserData, } from "../../../utils/askEventsUtil.js";
import { getUpdateAskActionUtil } from "../../update-ask-actions-by-id/utils/getUpdateAskActionUtil.js";
const appendPullEvent = (events, event) => [...(events ?? []), event];
const accumulatePullTotals = (currentQuant, currentBox, pullDetails) => {
    const baseQuant = currentQuant ?? 0;
    const baseBox = currentBox ?? 0;
    return {
        pullQuant: baseQuant + pullDetails.quant,
        pullBox: baseBox + pullDetails.boxes,
    };
};
export const pullAskUtil = async ({ solver, solverId, ask, action, pullAskData, session, }) => {
    const solverData = mapUserToAskUserData(solver);
    const actionEntry = getUpdateAskActionUtil({ user: solver, action });
    const pullDetails = {
        palletData: {
            _id: new Types.ObjectId(pullAskData.palletData._id),
            title: pullAskData.palletData.title,
        },
        quant: pullAskData.quant,
        boxes: pullAskData.boxes,
    };
    const pullEvent = buildAskEvent({
        eventName: "pull",
        user: solverData,
        pullDetails,
    });
    const events = appendPullEvent(ask.events, pullEvent);
    const totals = accumulatePullTotals(ask.pullQuant, ask.pullBox, pullDetails);
    const updateFields = {
        solverData,
        solver: solverId,
        actions: [...ask.actions, actionEntry],
        events,
        pullQuant: totals.pullQuant,
        pullBox: totals.pullBox,
        status: ask.status === "completed" || ask.status === "rejected"
            ? ask.status
            : "processing",
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
};
