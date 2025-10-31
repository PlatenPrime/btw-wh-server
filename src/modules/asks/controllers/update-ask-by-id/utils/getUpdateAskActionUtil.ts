import { getCurrentFormattedDateTime } from "../../../../../utils/getCurrentFormattedDateTime.js";
import { IUser } from "../../../../auth/models/User.js";

interface GetUpdateAskActionUtilInput {
  solver: IUser;
  action: string;
}

export const getUpdateAskActionUtil = ({
  solver,
  action,
}: GetUpdateAskActionUtilInput): string => {
  const time = getCurrentFormattedDateTime();
  const solverName = solver.fullname;
  return `${time} ${solverName}: ${action}` as string;
};

