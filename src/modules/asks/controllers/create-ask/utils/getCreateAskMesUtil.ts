import { IUser } from "../../../../auth/models/User.js";
import { CreateAskData } from "../schemas/createAskSchema.js";

interface GetCreateAskMessageInput {
  askerData: IUser;
  data: CreateAskData;
}

export const getCreateAskMessageUtil = ({
  askerData,
  data,
}: GetCreateAskMessageInput) => {
  const { artikul, nameukr, quant, com } = data;
  return `🆕 Новий запит

  👤 ${askerData.fullname}
  📦 ${artikul}
  📝 ${nameukr || "—"}
  🔢 ${quant || "—"}
  💬 ${com || "—"}
`;
};
