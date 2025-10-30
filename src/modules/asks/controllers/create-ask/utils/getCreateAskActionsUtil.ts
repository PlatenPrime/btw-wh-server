import { getCurrentFormattedDateTime } from "../../../../../utils/getCurrentFormattedDateTime.js";
import { IUser } from "../../../../auth/models/User.js";

interface GetCreateAskActionsInput {
  askerData: IUser;
  nameukr: string;
  quant: number;
  com: string;
}

export const getCreateAskActionsUtil = (
    {askerData, nameukr, quant, com}: GetCreateAskActionsInput
): string[] => {
  const time = getCurrentFormattedDateTime();
  return [
    `${time} ${askerData?.fullname ?? ""}: необхідно ${nameukr}
    ${quant !== undefined && ", кількість: "}${quant}
    ${com && ", коментарій: "}${com}`,
  ];
};
