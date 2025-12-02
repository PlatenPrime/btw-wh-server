import { ClientSession, Types } from "mongoose";
import { IUser } from "../../../../auth/models/User.js";
import {
  Ask,
  AskEvent,
  AskEventPullDetails,
  IAsk,
} from "../../../models/Ask.js";
import {
  buildAskEvent,
  mapUserToAskUserData,
} from "../../../utils/askEventsUtil.js";
import { getUpdateAskActionUtil } from "../../update-ask-actions-by-id/utils/getUpdateAskActionUtil.js";
import { PullAskPayload } from "../schemas/pullAskByIdSchema.js";

interface PullAskUtilInput {
  solver: IUser;
  solverId: Types.ObjectId;
  ask: IAsk;
  action: string;
  pullAskData: PullAskPayload;
  session: ClientSession;
}

const appendPullEvent = (
  events: AskEvent[] | undefined,
  event: AskEvent
): AskEvent[] => [...(events ?? []), event];

const accumulatePullTotals = (
  currentQuant: number | undefined,
  currentBox: number | undefined,
  pullDetails: AskEventPullDetails
) => {
  const baseQuant = currentQuant ?? 0;
  const baseBox = currentBox ?? 0;

  return {
    pullQuant: baseQuant + pullDetails.quant,
    pullBox: baseBox + pullDetails.boxes,
  };
};

export const pullAskUtil = async ({
  solver,
  solverId,
  ask,
  action,
  pullAskData,
  session,
}: PullAskUtilInput): Promise<IAsk> => {
  const solverData = mapUserToAskUserData(solver);
  const actionEntry = getUpdateAskActionUtil({ user: solver, action });

  const pullDetails: AskEventPullDetails = {
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

  const updateFields: Partial<IAsk> = {
    solverData,
    solver: solverId,
    actions: [...ask.actions, actionEntry],
    events,
    pullQuant: totals.pullQuant,
    pullBox: totals.pullBox,
    status:
      ask.status === "completed" || ask.status === "rejected"
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

  return updatedAsk as IAsk;
};
