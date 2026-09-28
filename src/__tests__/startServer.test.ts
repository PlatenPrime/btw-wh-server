import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Express } from "express";

const connectionOn = vi.fn();
const mongooseConnect = vi.fn();
const startCronOperations = vi.fn();
const startExcelJobRuntime = vi.fn();
const logServerEgressGeo = vi.fn();
const getMongoUri = vi.fn(() => "mongodb://test");
const bootLog = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  fatal: vi.fn(),
};

vi.mock("mongoose", () => ({
  default: {
    connection: { on: (...args: unknown[]) => connectionOn(...args) },
    connect: (...args: unknown[]) => mongooseConnect(...args),
  },
}));

vi.mock("../config/getMongoUri.js", () => ({
  getMongoUri: () => getMongoUri(),
}));

vi.mock("../cron/startCronOperations.js", () => ({
  startCronOperations: () => startCronOperations(),
}));

vi.mock("../modules/excel-jobs/utils/startExcelJobRuntime.js", () => ({
  startExcelJobRuntime: () => startExcelJobRuntime(),
}));

vi.mock("../utils/server-egress-geo/logServerEgressGeo.js", () => ({
  logServerEgressGeo: (...args: unknown[]) => logServerEgressGeo(...args),
}));

vi.mock("../logging/createLogger.js", () => ({
  createLogger: () => bootLog,
}));

import { startServer } from "../startServer.js";

describe("startServer", () => {
  const listen = vi.fn(
    (_port: unknown, cb?: () => void) => {
      cb?.();
      return {} as never;
    }
  );

  const app = { listen } as unknown as Express;

  beforeEach(() => {
    vi.clearAllMocks();
    mongooseConnect.mockResolvedValue(undefined);
    startExcelJobRuntime.mockResolvedValue(undefined);
    getMongoUri.mockReturnValue("mongodb://test");
  });

  it("подключает mongo, стартует cron/excel и слушает порт", async () => {
    await startServer(app, { port: 4000 });

    expect(connectionOn).toHaveBeenCalledWith("connected", expect.any(Function));
    expect(connectionOn).toHaveBeenCalledWith("error", expect.any(Function));
    expect(connectionOn).toHaveBeenCalledWith(
      "disconnected",
      expect.any(Function)
    );
    expect(mongooseConnect).toHaveBeenCalledWith("mongodb://test");
    expect(startCronOperations).toHaveBeenCalledOnce();
    expect(startExcelJobRuntime).toHaveBeenCalledOnce();
    expect(listen).toHaveBeenCalledWith(4000, expect.any(Function));
    expect(bootLog.info).toHaveBeenCalledWith(
      { port: 4000 },
      "server started"
    );
    expect(logServerEgressGeo).toHaveBeenCalledWith("startup");
  });

  it("логирует connected/error/disconnected через handlers", async () => {
    await startServer(app, { port: 4000 });

    const connectedHandler = connectionOn.mock.calls.find(
      ([event]) => event === "connected"
    )?.[1] as () => void;
    const errorHandler = connectionOn.mock.calls.find(
      ([event]) => event === "error"
    )?.[1] as (err: Error) => void;
    const disconnectedHandler = connectionOn.mock.calls.find(
      ([event]) => event === "disconnected"
    )?.[1] as () => void;

    connectedHandler();
    expect(bootLog.info).toHaveBeenCalledWith("mongodb connected");

    const err = new Error("mongo fail");
    errorHandler(err);
    expect(bootLog.error).toHaveBeenCalledWith(
      { err },
      "mongodb connection error"
    );

    disconnectedHandler();
    expect(bootLog.warn).toHaveBeenCalledWith("mongodb disconnected");
  });

  it("при ошибке connect пишет fatal и вызывает process.exit(1)", async () => {
    const connectError = new Error("connect failed");
    mongooseConnect.mockRejectedValueOnce(connectError);

    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as never);

    await startServer(app, { port: 4000 });

    expect(bootLog.fatal).toHaveBeenCalledWith(
      { err: connectError },
      "server failed to start"
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(listen).not.toHaveBeenCalled();

    exitSpy.mockRestore();
  });

  it("использует PORT из env, если port не передан", async () => {
    const prev = process.env.PORT;
    process.env.PORT = "5555";

    await startServer(app);

    expect(listen).toHaveBeenCalledWith("5555", expect.any(Function));

    if (prev === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = prev;
    }
  });

  it("использует 3232, если port и PORT не заданы", async () => {
    const prev = process.env.PORT;
    delete process.env.PORT;

    await startServer(app);

    expect(listen).toHaveBeenCalledWith(3232, expect.any(Function));

    if (prev === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = prev;
    }
  });
});
