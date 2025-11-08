import { ClientSession, Types } from "mongoose";
import { IUser } from "../../../../auth/models/User.js";
import { Ask, IAsk } from "../../../models/Ask.js";
import {
  buildAskEvent,
  mapUserToAskUserData,
} from "../../../utils/askEventsUtil.js";
import { getRejectAskActionUtil } from "./getRejectAskActionUtil.js";

interface RejectAskUtilInput {
  solver: IUser;
  solverId: Types.ObjectId;
  ask: IAsk;
  session: ClientSession;
}

export async function rejectAskUtil({
  solver,
  solverId,
  ask,
  session,
}: RejectAskUtilInput): Promise<IAsk> {
  const solverData = mapUserToAskUserData(solver);
  const newAction = getRejectAskActionUtil({ solver });
  const newEvent = buildAskEvent({ eventName: "reject", user: solverData });
  const updatedActions = [...ask.actions, newAction];
  const updatedEvents = [...(ask.events ?? []), newEvent];
  const updateFields: Partial<IAsk> = {
    actions: updatedActions,
    solverData,
    solver: solverId,
    status: "rejected",
    events: updatedEvents,
    pullQuant: ask.pullQuant ?? 0,
    pullBox: ask.pullBox ?? 0,
  };

  const updatedAsk = await Ask.findByIdAndUpdate(
    ask._id,
    updateFields,
    {
      new: true,
      runValidators: true,
      session,
    }
  );

  if (!updatedAsk) {
    throw new Error("Failed to update ask");
  }

  return updatedAsk as IAsk;
}

