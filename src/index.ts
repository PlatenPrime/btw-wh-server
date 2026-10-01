import "./config/loadEnv.js";

import { createApp } from "./createApp.js";
import { createLogger } from "./logging/createLogger.js";
import { registerProcessHandlers } from "./logging/registerProcessHandlers.js";
import { startServer } from "./startServer.js";

const bootLog = createLogger({ module: "server" });
registerProcessHandlers(bootLog);

void startServer(createApp());

