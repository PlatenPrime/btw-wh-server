import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../logging/httpLogger.js", () => ({
  createHttpLogger: vi.fn(
    () => (_req: unknown, _res: unknown, next: () => void) => next()
  ),
  createSlowRequestLogger: vi.fn(
    () => (_req: unknown, _res: unknown, next: () => void) => next()
  ),
}));

vi.mock("../logging/errorLogger.js", () => ({
  createErrorLogger: vi.fn(
    () =>
      (_err: unknown, _req: unknown, _res: unknown, next: () => void) =>
        next()
  ),
}));

vi.mock("../registerRoutes.js", () => ({
  registerRoutes: vi.fn(),
}));

import { createErrorLogger } from "../logging/errorLogger.js";
import {
  createHttpLogger,
  createSlowRequestLogger,
} from "../logging/httpLogger.js";
import { registerRoutes } from "../registerRoutes.js";
import { createApp } from "../createApp.js";

describe("createApp", () => {
  beforeEach(() => {
    vi.mocked(createHttpLogger).mockClear();
    vi.mocked(createSlowRequestLogger).mockClear();
    vi.mocked(createErrorLogger).mockClear();
    vi.mocked(registerRoutes).mockClear();
  });

  it("по умолчанию подключает HTTP и slow loggers, routes и error logger", () => {
    const app = createApp();

    expect(createHttpLogger).toHaveBeenCalledOnce();
    expect(createSlowRequestLogger).toHaveBeenCalledOnce();
    expect(registerRoutes).toHaveBeenCalledOnce();
    expect(registerRoutes).toHaveBeenCalledWith(app);
    expect(createErrorLogger).toHaveBeenCalledOnce();
  });

  it("с httpLogging: false не подключает HTTP/slow loggers", () => {
    const app = createApp({ httpLogging: false });

    expect(createHttpLogger).not.toHaveBeenCalled();
    expect(createSlowRequestLogger).not.toHaveBeenCalled();
    expect(registerRoutes).toHaveBeenCalledWith(app);
    expect(createErrorLogger).toHaveBeenCalledOnce();
  });
});
