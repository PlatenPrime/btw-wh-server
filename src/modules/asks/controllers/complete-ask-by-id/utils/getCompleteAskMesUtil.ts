import { IAsk } from "../../../models/Ask.js";

interface GetCompleteAskMesUtilInput {
  ask: IAsk;
  solverName: string;
}

export const getCompleteAskMesUtil = ({
  ask,
  solverName,
}: GetCompleteAskMesUtilInput): string => {
  const message = `✅ Ваш запит виконано!

        📦 ${ask.artikul}
        📝 ${ask.nameukr || "—"}
        🔢 ${ask.quant ?? "—"}
        👤 Виконавець: ${solverName}`;
  return message as string;
};
