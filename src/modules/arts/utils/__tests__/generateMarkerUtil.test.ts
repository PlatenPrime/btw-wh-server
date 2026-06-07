import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateMarkerUtil } from "../generateMarkerUtil.js";

describe("generateMarkerUtil", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("возвращает маркер в формате YYYYMMDD для Europe/Kyiv", () => {
    vi.setSystemTime(new Date("2025-11-23T10:00:00.000Z"));

    expect(generateMarkerUtil()).toBe("20251123");
  });

  it("дополняет месяц и день нулями", () => {
    vi.setSystemTime(new Date("2025-01-05T12:00:00.000Z"));

    expect(generateMarkerUtil()).toBe("20250105");
  });
});
