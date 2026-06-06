import { sendAnalyticsChatNotificationDeferred } from "../../utils/kyivNightNotificationDelay.js";

export async function sendCronAnalyticsReport(
  message: string,
  finishedAt: Date = new Date()
): Promise<void> {
  await sendAnalyticsChatNotificationDeferred(message, finishedAt);
}
