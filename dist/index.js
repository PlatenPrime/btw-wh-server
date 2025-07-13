import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import artRoute from "./modules/arts/router.js";
import authRoute from "./modules/auth/router.js";
import palletRoute from "./modules/pallets/router.js";
import posesRoute from "./modules/poses/router.js";
import rowRouter from "./modules/rows/router.js";
dotenv.config();
const app = express();
// Middleware
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use("/api/arts", artRoute);
app.use("/api/rows", rowRouter);
app.use("/api/auth", authRoute);
app.use("/api/pallets", palletRoute);
app.use("/api/poses", posesRoute);
// Error handler must be after all routes
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use(function (err, req, res, next) {
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
        await mongoose.connect(`mongodb+srv://${DB_USER}:${DB_PASSWORD}@cluster0.b6qtdz4.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`);
        app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
    }
    catch (error) {
        console.log(error);
    }
}
start();
