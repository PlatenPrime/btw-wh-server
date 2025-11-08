import { ClientSession, Types } from "mongoose";
import { IUser } from "../../../../auth/models/User.js";
import {
  Ask,
  AskEventPullDetails,
  AskStatus,
  IAsk,
} from "../../../models/Ask.js";
import {
  applyAskEvent,
  buildAskEvent,
  mapUserToAskUserData,
} from "../../../utils/askEventsUtil.js";
import { UpdateAskEventPayload } from "../schemas/updateAskByIdSchema.js";
import { getUpdateAskActionUtil } from "./getUpdateAskActionUtil.js";

interface UpdateAskUtilInput {
  solver: IUser;
  solverId: Types.ObjectId;
  ask: IAsk;
  action: string;
  status?: AskStatus;
  event?: UpdateAskEventPayload;
  session: ClientSession;
}

export async function updateAskUtil({
  solver,
  solverId,
  ask,
  action,
  status,
  event,
  session,
}: UpdateAskUtilInput): Promise<IAsk> {
  const solverData = mapUserToAskUserData(solver);
  const newAction = getUpdateAskActionUtil({ solver, action });
  const updatedActions = [...ask.actions, newAction];

  const updateFields: Partial<IAsk> = {
    actions: updatedActions,
    solverData,
    solver: solverId,
  };

  let updatedEvents = ask.events;
  let currentPullQuant = ask.pullQuant;
  let currentPullBox = ask.pullBox;

  if (event) {
    let eventInstance: ReturnType<typeof buildAskEvent>;

    if (event.eventName === "pull") {
      const pullDetails: AskEventPullDetails = {
        palletData: {
          _id: new Types.ObjectId(event.pullDetails!.palletData._id),
          title: event.pullDetails!.palletData.title,
          sector: event.pullDetails!.palletData.sector,
          isDef: event.pullDetails!.palletData.isDef,
        },
        quant: event.pullDetails!.quant,
        boxes: event.pullDetails!.boxes,
      };

      eventInstance = buildAskEvent({
        eventName: "pull",
        user: solverData,
        date: event.date ? new Date(event.date) : undefined,
        pullDetails,
      });
    } else {
      eventInstance = buildAskEvent({
        eventName: event.eventName,
        user: solverData,
        date: event.date ? new Date(event.date) : undefined,
      });
    }

    const aggregated = applyAskEvent(
      updatedEvents,
      eventInstance,
      currentPullQuant,
      currentPullBox
    );

    updatedEvents = aggregated.events;
    currentPullQuant = aggregated.pullQuant;
    currentPullBox = aggregated.pullBox;
  }

  if (status === "completed") {
    const { events, pullQuant, pullBox } = applyAskEvent(
      updatedEvents,
      buildAskEvent({ eventName: "complete", user: solverData }),
      currentPullQuant,
      currentPullBox
    );
    updatedEvents = events;
    currentPullQuant = pullQuant;
    currentPullBox = pullBox;
  }

  if (status === "rejected") {
    const { events, pullQuant, pullBox } = applyAskEvent(
      updatedEvents,
      buildAskEvent({ eventName: "reject", user: solverData }),
      currentPullQuant,
      currentPullBox
    );
    updatedEvents = events;
    currentPullQuant = pullQuant;
    currentPullBox = pullBox;
  }

  if (status) {
    updateFields.status = status;
  }

  if (updatedEvents) {
    updateFields.events = updatedEvents;
  }

  if (typeof currentPullQuant === "number") {
    updateFields.pullQuant = currentPullQuant;
  }

  if (typeof currentPullBox === "number") {
    updateFields.pullBox = currentPullBox;
  }

  const updatedAsk = await Ask.findByIdAndUpdate(ask._id, updateFields, {
    new: true,
    runValidators: true,
    session,
  });

  if (!updatedAsk) {
    throw new Error("Failed to update ask");
  }

  return updatedAsk as IAsk;
}
