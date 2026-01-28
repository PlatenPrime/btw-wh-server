import cors from "cors";
import express from "express";
import artsRoute from "../../modules/arts/router.js";
import asksRoute from "../../modules/asks/router.js";
import authRoute from "../../modules/auth/router.js";
import blocksRoute from "../../modules/blocks/router.js";
import defsRoute from "../../modules/defs/router.js";
import palletGroupsRoute from "../../modules/pallet-groups/router.js";
import palletsRoute from "../../modules/pallets/router.js";
import posesRoute from "../../modules/poses/router.js";
import rowsRoute from "../../modules/rows/router.js";
import segsRoute from "../../modules/segs/router.js";
import zonesRoute from "../../modules/zones/router.js";
const app = express();
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
app.use(function (err, req, res, next) {
    if (err instanceof SyntaxError && "body" in err) {
        return res.status(400).json({ message: "Invalid or empty data" });
    }
    return res.status(400).json({
        message: err.message || "Something went wrong",
        stack: err.stack || null,
    });
});
export default app;
