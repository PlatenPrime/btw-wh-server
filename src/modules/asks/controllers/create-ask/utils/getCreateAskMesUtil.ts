import { IUser } from "../../../../auth/models/User.js";

interface GetCreateAskMessageInput {
  askerData: IUser;
  artikul: string;
  nameukr: string;
  quant: number;
  com: string;
}

export const getCreateAskMessageUtil = (
 { askerData, artikul, nameukr, quant, com}: GetCreateAskMessageInput
) => {
  return `🆕 Новий запит

  👤 ${askerData.fullname}
  📦 ${artikul}
  📝 ${nameukr || "—"}
  🔢 ${quant || "—"}
  💬 ${com || "—"}
`;
};
