import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";

import { startCronOperations } from "./cron/startCronOperations.js";
import artsRoute from "./modules/arts/router.js";
import asksRoute from "./modules/asks/router.js";
import authRoute from "./modules/auth/router.js";
import blocksRoute from "./modules/blocks/router.js";
import defsRoute from "./modules/defs/router.js";
import palletGroupsRoute from "./modules/pallet-groups/router.js";
import palletsRoute from "./modules/pallets/router.js";
import posesRoute from "./modules/poses/router.js";
import rowsRoute from "./modules/rows/router.js";
import segsRoute from "./modules/segs/router.js";
import zonesRoute from "./modules/zones/router.js";

dotenv.config();

const app = express();

// Middleware

app.use(cors());

app.use(express.json({ limit: "20mb" }));

app.use("/api/auth", authRoute);
app.use("/api/arts", artsRoute);
app.use("/api/asks", asksRoute);
app.use("/api/blocks", blocksRoute);
app.use("/api/segs", segsRoute);
app.use("/api/rows", rowsRoute);
app.use("/api/pallets", palletsRoute);
app.use("/api/pallet-groups", palletGroupsRoute);
app.use("/api/poses", posesRoute);
app.use("/api/defs", defsRoute);
app.use("/api/zones", zonesRoute);

// Error handler must be after all routes
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use(function (err: any, req: any, res: any, next: any) {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ message: "Invalid or empty data" });
  }
  res.status(400).json({
    message: err.message || "Something went wrong",
    stack: err.stack || null,
  });
});

// Constants
const PORT = process.env.PORT || 3232;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

async function start() {
  try {
    await mongoose.connect(
      `mongodb+srv://${DB_USER}:${DB_PASSWORD}@cluster0.b6qtdz4.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`,
    );

    startCronOperations();

    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
}

start();
