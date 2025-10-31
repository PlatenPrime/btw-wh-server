import { getCurrentFormattedDateTime } from "../../../../../utils/getCurrentFormattedDateTime.js";
import { IUser } from "../../../../auth/models/User.js";

interface GetUpdateAskActionUtilInput {
  user: IUser;
  action: string;
}

export const getUpdateAskActionUtil = ({
  user,
  action,
}: GetUpdateAskActionUtilInput): string => {
  const time = getCurrentFormattedDateTime();
  const userName = user.fullname;
  return `${time} ${userName}: ${action}` as string;
};

