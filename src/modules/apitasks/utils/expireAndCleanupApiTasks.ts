import { ApiTask } from "../models/ApiTask.js";

export async function expireAndCleanupApiTasks(
  now: Date = new Date(),
): Promise<{ expired: number }> {
  const result = await ApiTask.updateMany(
    {
      status: "completed",
      expiresAt: { $lte: now },
    },
    {
      $set: {
        status: "expired",
        message: "Expired",
      },
      $unset: { result: 1 },
    },
  );
  return { expired: result.modifiedCount };
}
