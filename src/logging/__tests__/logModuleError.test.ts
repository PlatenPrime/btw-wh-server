import { beforeEach, describe, expect, it, vi } from "vitest";

const mockError = vi.hoisted(() => vi.fn());
const mockWarn = vi.hoisted(() => vi.fn());
const mockInfo = vi.hoisted(() => vi.fn());
const mockDebug = vi.hoisted(() => vi.fn());

vi.mock("../createLogger.js", () => ({
  createLogger: () => ({
    error: mockError,
    warn: mockWarn,
    info: mockInfo,
    debug: mockDebug,
  }),
}));

import {
  logModuleDebug,
  logModuleError,
  logModuleInfo,
  logModuleWarn,
} from "../logModuleError.js";

describe("logModuleError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("пишет error с module binding", () => {
    const err = new Error("boom");
    logModuleError("arts", err, "fetch failed");

    expect(mockError).toHaveBeenCalledWith({ err }, "fetch failed");
  });

  it("пишет error с extra полями", () => {
    const err = new Error("boom");
    logModuleError("arts", err, "fetch failed", { artikul: "123" });

    expect(mockError).toHaveBeenCalledWith(
      { err, artikul: "123" },
      "fetch failed"
    );
  });
});

describe("logModuleWarn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("пишет warn с extra", () => {
    logModuleWarn("defs", "retry scheduled", { attempt: 2 });

    expect(mockWarn).toHaveBeenCalledWith({ attempt: 2 }, "retry scheduled");
  });
});

describe("logModuleInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("пишет info с extra", () => {
    logModuleInfo("defs", "processing started", { totalItems: 10 });

    expect(mockInfo).toHaveBeenCalledWith({ totalItems: 10 }, "processing started");
  });
});

describe("logModuleDebug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("пишет debug с extra", () => {
    logModuleDebug("telegram", "message sent", { chatId: "123" });

    expect(mockDebug).toHaveBeenCalledWith({ chatId: "123" }, "message sent");
  });
});
