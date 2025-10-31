import { getCurrentFormattedDateTime } from "../../../../../utils/getCurrentFormattedDateTime.js";
import { IUser } from "../../../../auth/models/User.js";

export const getRejectAskActionUtil = ({
  solver,
}: {
  solver: IUser;
}): string => {
  const time = getCurrentFormattedDateTime();
  const solverName = solver.fullname;
  return `${time} ${solverName}: ВІДХИЛИВ запит` as string;
};

