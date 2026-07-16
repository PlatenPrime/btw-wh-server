import "./config/loadEnv.js";

import cors from "cors";
import express from "express";
import mongoose from "mongoose";

import { getMongoUri } from "./config/getMongoUri.js";

import { startCronOperations } from "./cron/startCronOperations.js";
import { createLogger } from "./logging/createLogger.js";
import { createErrorLogger } from "./logging/errorLogger.js";
import {
  createHttpLogger,
  createSlowRequestLogger,
} from "./logging/httpLogger.js";
import { registerProcessHandlers } from "./logging/registerProcessHandlers.js";
import analogSlicesRoute from "./modules/analog-slices/router.js";
import analogsRoute from "./modules/analogs/router.js";
import artChartReportsRoute from "./modules/art-chart-reports/router.js";
import artExcelReportsRoute from "./modules/art-excel-reports/router.js";
import artSalesReportsRoute from "./modules/art-sales-reports/router.js";
import artsRoute from "./modules/arts/router.js";
import asksRoute from "./modules/asks/router.js";
import authRoute from "./modules/auth/router.js";
import blocksRoute from "./modules/blocks/router.js";
import browserRoute from "./modules/browser/router.js";
import btradeSlicesRoute from "./modules/btrade-slices/router.js";
import constantsRoute from "./modules/constants/router.js";
import defsRoute from "./modules/defs/router.js";
import delsRoute from "./modules/dels/router.js";
import eventsRoute from "./modules/events/router.js";
import kasksRoute from "./modules/kasks/router.js";
import konksRoute from "./modules/konks/router.js";
import palletGroupsRoute from "./modules/pallet-groups/router.js";
import palletsRoute from "./modules/pallets/router.js";
import posesRoute from "./modules/poses/router.js";
import prodsRoute from "./modules/prods/router.js";
import rowsRoute from "./modules/rows/router.js";
import segsRoute from "./modules/segs/router.js";
import skuChartReportsRoute from "./modules/sku-chart-reports/router.js";
import skuExcelReportsRoute from "./modules/sku-excel-reports/router.js";
import skuSalesReportsRoute from "./modules/sku-sales-reports/router.js";
import skuSlicesRoute from "./modules/sku-slices/router.js";
import skugrsRoute from "./modules/skugrs/router.js";
import skusRoute from "./modules/skus/router.js";
import sliceCompensationRoute from "./modules/slice-compensation/router.js";
import variantsRoute from "./modules/variants/router.js";
import zonesRoute from "./modules/zones/router.js";
import { logServerEgressGeo } from "./utils/server-egress-geo/logServerEgressGeo.js";

const bootLog = createLogger({ module: "server" });
registerProcessHandlers(bootLog);

const app = express();

app.use(cors());
app.use(createHttpLogger());
app.use(createSlowRequestLogger());
app.use(express.json({ limit: "20mb" }));

app.use("/api/analog-slices", analogSlicesRoute);
app.use("/api/analogs", analogsRoute);
app.use("/api/variants", variantsRoute);
app.use("/api/auth", authRoute);
app.use("/api/arts", artsRoute);
app.use("/api/art-sales-reports", artSalesReportsRoute);
app.use("/api/art-chart-reports", artChartReportsRoute);
app.use("/api/art-excel-reports", artExcelReportsRoute);
app.use("/api/browser", browserRoute);
app.use("/api/btrade-slices", btradeSlicesRoute);
app.use("/api/asks", asksRoute);
app.use("/api/kasks", kasksRoute);
app.use("/api/dels", delsRoute);
app.use("/api/constants", constantsRoute);
app.use("/api/events", eventsRoute);
app.use("/api/konks", konksRoute);
app.use("/api/prods", prodsRoute);
app.use("/api/skus", skusRoute);
app.use("/api/sku-slices", skuSlicesRoute);
app.use("/api/sku-excel-reports", skuExcelReportsRoute);
app.use("/api/sku-sales-reports", skuSalesReportsRoute);
app.use("/api/sku-chart-reports", skuChartReportsRoute);
app.use("/api/skugrs", skugrsRoute);
app.use("/api/blocks", blocksRoute);
app.use("/api/segs", segsRoute);
app.use("/api/slice-compensation", sliceCompensationRoute);
app.use("/api/rows", rowsRoute);
app.use("/api/pallets", palletsRoute);
app.use("/api/pallet-groups", palletGroupsRoute);
app.use("/api/poses", posesRoute);
app.use("/api/defs", defsRoute);
app.use("/api/zones", zonesRoute);

app.use(createErrorLogger());

const PORT = process.env.PORT || 3232;

async function start() {
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

    app.listen(PORT, () => {
      bootLog.info({ port: PORT }, "server started");
      void logServerEgressGeo("startup");
    });
  } catch (error) {
    bootLog.fatal({ err: error }, "server failed to start");
    process.exit(1);
  }
}

start();
