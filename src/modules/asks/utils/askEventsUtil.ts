import { Types } from "mongoose";
import { IUser } from "../../auth/models/User.js";
import {
  AskEvent,
  AskEventName,
  AskEventPullDetails,
  AskUserData,
} from "../models/Ask.js";

type MapUserToAskUserDataInput =
  | Pick<IUser, "_id" | "fullname" | "telegram" | "photo">
  | AskUserData;

const normalizeId = (id: Types.ObjectId | string): Types.ObjectId => {
  if (id instanceof Types.ObjectId) {
    return id;
  }
  return new Types.ObjectId(id);
};

export const mapUserToAskUserData = (
  user: MapUserToAskUserDataInput
): AskUserData => {
  return {
    _id: normalizeId(user._id as Types.ObjectId | string),
    fullname: user.fullname,
    telegram: user.telegram,
    photo: user.photo,
  };
};

interface BuildAskEventBase<TName extends AskEventName> {
  eventName: TName;
  user: MapUserToAskUserDataInput;
  date?: Date;
}

interface BuildPullAskEventInput
  extends BuildAskEventBase<"pull">,
    Pick<AskEvent, "pullDetails"> {
  pullDetails: AskEventPullDetails;
}

type BuildNonPullAskEventInput = BuildAskEventBase<
  Exclude<AskEventName, "pull">
> & { pullDetails?: undefined };

type BuildAskEventInput = BuildPullAskEventInput | BuildNonPullAskEventInput;

export const buildAskEvent = ({
  eventName,
  user,
  date,
  pullDetails,
}: BuildAskEventInput): AskEvent => {
  if (eventName === "pull" && !pullDetails) {
    throw new Error("Pull events require pullDetails payload");
  }

  if (eventName !== "pull" && pullDetails) {
    throw new Error("Only pull events may contain pullDetails payload");
  }

  return {
    eventName,
    userData: mapUserToAskUserData(user),
    date: date ?? new Date(),
    pullDetails,
  };
};

export const appendAskEvent = (
  events: AskEvent[] = [],
  event: AskEvent
): AskEvent[] => {
  return [...events, event];
};

export const applyAskEvent = (
  events: AskEvent[] | undefined,
  event: AskEvent,
  pullQuant: number | undefined,
  pullBox: number | undefined
): { events: AskEvent[]; pullQuant: number; pullBox: number } => {
  const nextEvents = appendAskEvent(events, event);
  const currentPullQuant = pullQuant ?? 0;
  const currentPullBox = pullBox ?? 0;

  if (event.eventName !== "pull" || !event.pullDetails) {
    return {
      events: nextEvents,
      pullQuant: currentPullQuant,
      pullBox: currentPullBox,
    };
  }

  return {
    events: nextEvents,
    pullQuant: currentPullQuant + event.pullDetails.quant,
    pullBox: currentPullBox + event.pullDetails.boxes,
  };
};
