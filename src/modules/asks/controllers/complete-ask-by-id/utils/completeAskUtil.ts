import { ClientSession, Types } from "mongoose";
import { IUser } from "../../../../auth/models/User.js";
import { Ask, IAsk } from "../../../models/Ask.js";
import {
  applyAskEvent,
  buildAskEvent,
  mapUserToAskUserData,
} from "../../../utils/askEventsUtil.js";
import { getCompleteAskActionUtil } from "./getCompleteAskActionUtil.js";

interface CompleteAskUtilInput {
  solver: IUser;
  solverId: Types.ObjectId;
  ask: IAsk;
  session: ClientSession;
}

export async function completeAskUtil({
  solver,
  solverId,
  ask,
  session,
}: CompleteAskUtilInput): Promise<IAsk> {
  const solverData = mapUserToAskUserData(solver);
  const newAction = getCompleteAskActionUtil({ solver });
  const newEvent = buildAskEvent({ eventName: "complete", user: solverData });
  const {
    events: updatedEvents,
    pullQuant,
    pullBox,
  } = applyAskEvent(ask.events, newEvent, ask.pullQuant, ask.pullBox);

  const updatedActions = [...ask.actions, newAction];
  const updateFields: Partial<IAsk> = {
    actions: updatedActions,
    solverData,
    solver: solverId,
    status: "completed",
    events: updatedEvents,
    pullQuant,
    pullBox,
  };

  const updatedAsk = await Ask.findByIdAndUpdate(ask._id, updateFields, {
    new: true,
    runValidators: true,
    session,
  });

  if (!updatedAsk) {
    throw new Error("Failed to complete ask");
  }

  return updatedAsk as IAsk;
}
