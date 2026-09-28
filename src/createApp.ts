import cors from "cors";
import express, { type Express } from "express";

import { createErrorLogger } from "./logging/errorLogger.js";
import {
  createHttpLogger,
  createSlowRequestLogger,
} from "./logging/httpLogger.js";
import { registerRoutes } from "./registerRoutes.js";

export type CreateAppOptions = {
  /** Access/slow HTTP loggers. Default: true (prod). Tests pass false. */
  httpLogging?: boolean;
};

export function createApp(options: CreateAppOptions = {}): Express {
  const { httpLogging = true } = options;
  const app = express();

  app.use(cors());

  if (httpLogging) {
    app.use(createHttpLogger());
    app.use(createSlowRequestLogger());
  }

  app.use(express.json({ limit: "20mb" }));
  registerRoutes(app);
  app.use(createErrorLogger());

  return app;
}
