import { sendMessageToAnalyticsChat } from "./telegram/sendMessageToAnalyticsChat.js";
import {
  TELEGRAM_MESSAGE_CHUNK_DELAY_MS,
  chunkTelegramMessage,
} from "./telegram/chunkTelegramMessage.js";
import { logModuleError, logModuleInfo } from "../logging/logModuleError.js";

const KYIV_TIMEZONE = "Europe/Kiev";
const MORNING_HOUR = 6;
const NIGHT_START_HOUR = 20;

const kyivHourFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: KYIV_TIMEZONE,
  hour: "numeric",
  hourCycle: "h23",
});

function getKyivHour(d: Date): number {
  const hourPart = kyivHourFormatter.formatToParts(d).find((p) => p.type === "hour");
  const hour = Number(hourPart?.value);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) {
    throw new Error("getKyivHour: could not read hour in Europe/Kiev");
  }
  return hour;
}

/** Ночное окно для отложенной отправки: 20:00–05:59 по Киеву. */
export function isKyivNightHours(d: Date = new Date()): boolean {
  const hour = getKyivHour(d);
  return hour >= NIGHT_START_HOUR || hour < MORNING_HOUR;
}

/**
 * Миллисекунды до ближайших 06:00 по Киеву.
 * Вне ночного окна возвращает 0.
 */
export function getMsUntilKyivMorningSend(d: Date = new Date()): number {
  if (!isKyivNightHours(d)) {
    return 0;
  }

  const hour = getKyivHour(d);
  let hoursUntilMorning: number;

  if (hour >= NIGHT_START_HOUR) {
    hoursUntilMorning = 24 - hour + MORNING_HOUR;
  } else {
    hoursUntilMorning = MORNING_HOUR - hour;
  }

  const kyivMinuteFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: KYIV_TIMEZONE,
    minute: "numeric",
  });
  const kyivSecondFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: KYIV_TIMEZONE,
    second: "numeric",
  });

  const minute = Number(
    kyivMinuteFormatter.formatToParts(d).find((p) => p.type === "minute")?.value
  );
  const second = Number(
    kyivSecondFormatter.formatToParts(d).find((p) => p.type === "second")?.value
  );

  const msUntilMorning =
    hoursUntilMorning * 60 * 60 * 1000 -
    minute * 60 * 1000 -
    second * 1000 -
    d.getMilliseconds();

  return Math.max(0, msUntilMorning);
}

async function sendAnalyticsChatNotificationSafe(message: string): Promise<void> {
  try {
    await sendMessageToAnalyticsChat(message);
  } catch (error) {
    logModuleError("kyivNightNotificationDelay", error, "analytics notification failed");
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function sendAnalyticsChatChunks(chunks: string[]): Promise<void> {
  for (let i = 0; i < chunks.length; i += 1) {
    const chunk = chunks[i];
    if (chunk !== undefined) {
      await sendAnalyticsChatNotificationSafe(chunk);
    }
    if (i < chunks.length - 1) {
      await delay(TELEGRAM_MESSAGE_CHUNK_DELAY_MS);
    }
  }
}

/**
 * Отправляет сообщение в чат аналитики сразу или откладывает до 06:00 Kyiv,
 * если завершение попало в ночное окно 20:00–05:59.
 * Текст длиннее лимита Telegram режется на чанки и шлётся последовательно.
 */
export async function sendAnalyticsChatNotificationDeferred(
  message: string,
  finishedAt: Date = new Date()
): Promise<void> {
  const chunks = chunkTelegramMessage(message);
  const delayMs = getMsUntilKyivMorningSend(finishedAt);

  if (delayMs <= 0) {
    await sendAnalyticsChatChunks(chunks);
    return;
  }

  logModuleInfo("kyivNightNotificationDelay", "analytics notification night delay", {
    delayMin: Math.round(delayMs / 60000),
    chunkCount: chunks.length,
  });

  setTimeout(() => {
    void sendAnalyticsChatChunks(chunks);
  }, delayMs);
}
