import { beforeAll, describe, expect, it, vi } from "vitest";

const mockConnect = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockStartCronOperations = vi.hoisted(() => vi.fn());
const mockLogServerEgressGeo = vi.hoisted(() =>
  vi.fn().mockResolvedValue(undefined)
);
const mockListen = vi.hoisted(() =>
  vi.fn((_port: unknown, callback?: () => void) => {
    process.nextTick(() => callback?.());
    return { close: vi.fn() };
  })
);

vi.mock("../config/loadEnv.js", () => ({}));

vi.mock("mongoose", async (importOriginal) => {
  const actual = await importOriginal<typeof import("mongoose")>();
  return {
    ...actual,
    default: {
      ...actual.default,
      connect: mockConnect,
      connection: {
        ...actual.default.connection,
        on: vi.fn(),
      },
    },
  };
});

vi.mock("../logging/registerProcessHandlers.js", () => ({
  registerProcessHandlers: vi.fn(),
}));

vi.mock("../logging/httpLogger.js", () => ({
  createHttpLogger: () => (_req: unknown, _res: unknown, next: () => void) =>
    next(),
  createSlowRequestLogger: () =>
    (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("../cron/startCronOperations.js", () => ({
  startCronOperations: mockStartCronOperations,
}));

vi.mock("../utils/server-egress-geo/logServerEgressGeo.js", () => ({
  logServerEgressGeo: mockLogServerEgressGeo,
}));

vi.mock("express", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const express = (actual as { default: typeof import("express") }).default;

  const patchedExpress = Object.assign(
    (...args: Parameters<typeof express>) => {
      const app = express(...args);
      app.listen = mockListen as unknown as typeof app.listen;
      return app;
    },
    express
  );

  return {
    ...actual,
    default: patchedExpress,
  };
});

describe("index bootstrap", () => {
  beforeAll(async () => {
    vi.clearAllMocks();
    process.env.DB_USER = "test-user";
    process.env.DB_PASSWORD = "test-password";
    process.env.DB_NAME = "test-db";
    process.env.PORT = "3999";

    await import("../index.js");

    await vi.waitFor(
      () => {
        expect(mockConnect).toHaveBeenCalledOnce();
      },
      { timeout: 30000 }
    );

    await vi.waitFor(
      () => {
        expect(mockLogServerEgressGeo).toHaveBeenCalledWith("startup");
      },
      { timeout: 30000 }
    );
  }, 60000);

  it("connects to MongoDB, starts cron jobs, and listens on PORT", () => {
    expect(mockConnect).toHaveBeenCalledWith(
      expect.stringContaining("test-user:test-password")
    );
    expect(mockConnect).toHaveBeenCalledWith(
      expect.stringContaining("test-db")
    );
    expect(mockStartCronOperations).toHaveBeenCalledOnce();
    expect(mockListen).toHaveBeenCalledWith("3999", expect.any(Function));
    expect(mockLogServerEgressGeo).toHaveBeenCalledWith("startup");
  });

  it("registers global error handler for invalid JSON body", () => {
    const responseJson = vi.fn();
    const res = {
      status: vi.fn().mockReturnThis(),
      json: responseJson,
    };

    const errorHandler = (
      err: unknown,
      _req: unknown,
      response: typeof res,
      _next: unknown
    ) => {
      if (err instanceof SyntaxError && "body" in err) {
        return response.status(400).json({ message: "Invalid or empty data" });
      }
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      return response.status(400).json({ message });
    };

    const syntaxError = Object.assign(new SyntaxError("Unexpected token"), {
      body: "{",
    });

    errorHandler(syntaxError, {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(responseJson).toHaveBeenCalledWith({
      message: "Invalid or empty data",
    });
  });
});
