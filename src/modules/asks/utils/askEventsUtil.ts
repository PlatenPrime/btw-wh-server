import { normalizeObjectId } from "../../../utils/normalizeObjectId.js";
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

export const mapUserToAskUserData = (
  user: MapUserToAskUserDataInput
): AskUserData => {
  return {
    _id: normalizeObjectId(user._id),
    fullname: user.fullname,
    telegram: user.telegram,
    photo: user.photo,
  };
};

interface BuildAskEventBase<TName extends AskEventName> {
  eventName: TName;
  user: MapUserToAskUserDataInput;
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
    date: new Date(),
    pullDetails,
  };
};
