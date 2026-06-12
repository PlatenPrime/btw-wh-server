import { getCurrentFormattedDateTime } from "../../../../../utils/getCurrentFormattedDateTime.js";
import { IUser } from "../../../../auth/models/User.js";
import { CreateAskData } from "../schemas/createAskSchema.js";

interface GetCreateAskActionsInput {
  askerData: IUser;
  data: CreateAskData;
}

export const getCreateAskActionsUtil = ({
  askerData,
  data,
}: GetCreateAskActionsInput): string[] => {
  const nameukr = data.nameukr ?? "";
  const quant = data.quant ?? 0;
  const com = data.com ?? "";
  const time = getCurrentFormattedDateTime();
  return [
    `${time} ${askerData?.fullname ?? ""}: необхідно ${nameukr}
    ${quant !== undefined && ", кількість: "}${quant}
    ${com && ", коментарій: "}${com}`,
  ];
};
