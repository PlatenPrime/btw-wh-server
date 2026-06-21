import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { logModuleError, logModuleInfo } = vi.hoisted(() => ({
  logModuleError: vi.fn(),
  logModuleInfo: vi.fn(),
}));

vi.mock("../../logging/logModuleError.js", () => ({
  logModuleError,
  logModuleInfo,
}));

import {
  getMsUntilKyivMorningSend,
  isKyivNightHours,
  sendAnalyticsChatNotificationDeferred,
} from "../kyivNightNotificationDelay.js";

vi.mock("../telegram/sendMessageToAnalyticsChat.js", () => ({
  sendMessageToAnalyticsChat: vi.fn(),
}));

import { sendMessageToAnalyticsChat } from "../telegram/sendMessageToAnalyticsChat.js";

/** UTC instant when Kyiv wall clock shows given local date/time (DST-aware). */
function kyivLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
  second = 0
): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour - 2, minute, second));
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Kiev",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  });

  for (let i = 0; i < 3; i++) {
    const parts = fmt.formatToParts(guess);
    const get = (type: string) =>
      Number(parts.find((p) => p.type === type)?.value);
    const y = get("year");
    const m = get("month");
    const d = get("day");
    const h = get("hour");
    const min = get("minute");
    const sec = get("second");

    if (y === year && m === month && d === day && h === hour && min === minute && sec === second) {
      return guess;
    }

    const diffMs =
      ((year - y) * 365 * 24 +
        (month - m) * 31 * 24 +
        (day - d) * 24 +
        (hour - h)) *
        3600_000 +
      (minute - min) * 60_000 +
      (second - sec) * 1000;

    guess.setTime(guess.getTime() + diffMs);
  }

  return guess;
}

describe("isKyivNightHours", () => {
  it("returns false at 10:00 Kyiv", () => {
    const d = kyivLocalToUtc(2025, 6, 6, 10, 0);
    expect(isKyivNightHours(d)).toBe(false);
  });

  it("returns false at 19:59 Kyiv", () => {
    const d = kyivLocalToUtc(2025, 6, 6, 19, 59);
    expect(isKyivNightHours(d)).toBe(false);
  });

  it("returns true at 20:00 Kyiv", () => {
    const d = kyivLocalToUtc(2025, 6, 6, 20, 0);
    expect(isKyivNightHours(d)).toBe(true);
  });

  it("returns true at 23:00 Kyiv", () => {
    const d = kyivLocalToUtc(2025, 6, 6, 23, 0);
    expect(isKyivNightHours(d)).toBe(true);
  });

  it("returns true at 02:00 Kyiv", () => {
    const d = kyivLocalToUtc(2025, 6, 6, 2, 0);
    expect(isKyivNightHours(d)).toBe(true);
  });

  it("returns true at 05:59 Kyiv", () => {
    const d = kyivLocalToUtc(2025, 6, 6, 5, 59);
    expect(isKyivNightHours(d)).toBe(true);
  });

  it("returns false at 06:00 Kyiv", () => {
    const d = kyivLocalToUtc(2025, 6, 6, 6, 0);
    expect(isKyivNightHours(d)).toBe(false);
  });
});

describe("getMsUntilKyivMorningSend", () => {
  it("returns 0 outside night window", () => {
    const d = kyivLocalToUtc(2025, 6, 6, 10, 0);
    expect(getMsUntilKyivMorningSend(d)).toBe(0);
  });

  it("returns ms until 06:00 next day when finished at 23:00", () => {
    const d = kyivLocalToUtc(2025, 6, 6, 23, 0);
    expect(getMsUntilKyivMorningSend(d)).toBe(7 * 60 * 60 * 1000);
  });

  it("returns ms until 06:00 same day when finished at 02:00", () => {
    const d = kyivLocalToUtc(2025, 6, 6, 2, 0);
    expect(getMsUntilKyivMorningSend(d)).toBe(4 * 60 * 60 * 1000);
  });

  it("returns ms until 06:00 next day when finished at 21:30", () => {
    const d = kyivLocalToUtc(2025, 6, 6, 21, 30);
    expect(getMsUntilKyivMorningSend(d)).toBe(8.5 * 60 * 60 * 1000);
  });
});

describe("sendAnalyticsChatNotificationDeferred", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends immediately during day hours", async () => {
    vi.setSystemTime(kyivLocalToUtc(2025, 6, 6, 10, 0));
    vi.mocked(sendMessageToAnalyticsChat).mockResolvedValue(undefined);

    await sendAnalyticsChatNotificationDeferred("day report");

    expect(sendMessageToAnalyticsChat).toHaveBeenCalledWith("day report");
    expect(sendMessageToAnalyticsChat).toHaveBeenCalledTimes(1);
  });

  it("defers send until morning during night hours", async () => {
    vi.setSystemTime(kyivLocalToUtc(2025, 6, 6, 23, 0));
    vi.mocked(sendMessageToAnalyticsChat).mockResolvedValue(undefined);

    await sendAnalyticsChatNotificationDeferred("night report");

    expect(sendMessageToAnalyticsChat).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(7 * 60 * 60 * 1000);

    expect(sendMessageToAnalyticsChat).toHaveBeenCalledWith("night report");
  });

  it("swallows send errors without throwing", async () => {
    vi.setSystemTime(kyivLocalToUtc(2025, 6, 6, 10, 0));
    vi.mocked(sendMessageToAnalyticsChat).mockRejectedValue(new Error("TG fail"));

    await expect(
      sendAnalyticsChatNotificationDeferred("fail report")
    ).resolves.toBeUndefined();

    expect(logModuleError).toHaveBeenCalledWith(
      "kyivNightNotificationDelay",
      expect.any(Error),
      "analytics notification failed"
    );
  });
});
