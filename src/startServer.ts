import type { Express } from "express";
import mongoose from "mongoose";

import { getMongoUri } from "./config/getMongoUri.js";
import { startCronOperations } from "./cron/startCronOperations.js";
import { createLogger } from "./logging/createLogger.js";
import { startExcelJobRuntime } from "./modules/excel-jobs/utils/startExcelJobRuntime.js";
import { logServerEgressGeo } from "./utils/server-egress-geo/logServerEgressGeo.js";

export type StartServerOptions = {
  port?: string | number;
};

export async function startServer(
  app: Express,
  options: StartServerOptions = {}
): Promise<void> {
  const bootLog = createLogger({ module: "server" });
  const port = (options.port ?? process.env.PORT) || 3232;

  try {
    mongoose.connection.on("connected", () => {
      bootLog.info("mongodb connected");
    });
    mongoose.connection.on("error", (err) => {
      bootLog.error({ err }, "mongodb connection error");
    });
    mongoose.connection.on("disconnected", () => {
      bootLog.warn("mongodb disconnected");
    });

    await mongoose.connect(getMongoUri());

    startCronOperations();
    await startExcelJobRuntime();

    app.listen(port, () => {
      bootLog.info({ port }, "server started");
      void logServerEgressGeo("startup");
    });
  } catch (error) {
    bootLog.fatal({ err: error }, "server failed to start");
    process.exit(1);
  }
}
