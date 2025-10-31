import { AskStatus, IAsk } from "../../../models/Ask.js";

export const getAsksStatisticsUtil = (asks: IAsk[]) => {
  const newCount = asks.filter((ask) => ask.status === "new").length;
  const completedCount = asks.filter(
    (ask) => ask.status === "completed"
  ).length;
  const rejectedCount = asks.filter(
    (ask) => ask.status === "rejected"
  ).length;

  return {
    newCount,
    completedCount,
    rejectedCount,
  };
};

