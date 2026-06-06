import { sendAnalyticsChatNotificationDeferred } from "../../utils/kyivNightNotificationDelay.js";
export async function sendCronAnalyticsReport(message, finishedAt = new Date()) {
    await sendAnalyticsChatNotificationDeferred(message, finishedAt);
}
