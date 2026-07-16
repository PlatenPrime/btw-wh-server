import { normalizeObjectId } from "../../../utils/normalizeObjectId.js";
import { IUser } from "../../auth/models/User.js";
import { EventUserData } from "../models/Event.js";

type MapUserToEventUserDataInput =
  | Pick<IUser, "_id" | "fullname" | "telegram" | "photo">
  | EventUserData;

export const mapUserToEventUserData = (
  user: MapUserToEventUserDataInput
): EventUserData => {
  return {
    _id: normalizeObjectId(user._id),
    fullname: user.fullname,
    telegram: user.telegram,
    photo: user.photo,
  };
};
