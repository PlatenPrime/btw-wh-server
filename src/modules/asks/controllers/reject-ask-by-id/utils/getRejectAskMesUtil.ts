import { IAsk } from "../../../models/Ask.js";

interface GetRejectAskMesUtilInput {
  ask: IAsk;
  solverName: string;
}

export const getRejectAskMesUtil = ({
  ask,
  solverName,
}: GetRejectAskMesUtilInput): string => {
  const message = `❌ Ваш запит відхилено

📦 ${ask.artikul}
📝 ${ask.nameukr || "—"}
🔢 ${ask.quant ?? "—"}
👤 Відхилив: ${solverName}`;
  return message as string;
};

