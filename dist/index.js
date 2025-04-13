import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import artRoute from "./modules/arts/router.js";
import authRoute from "./modules/auth/router.js";
import { clerkMiddleware } from "@clerk/express";
// import "./types/express/index.d.js";
dotenv.config();
const app = express();
// Middleware
app.use(clerkMiddleware());
app.use(cors());
app.use(express.json());
app.use("/api/arts", artRoute);
app.use("/api/auth", authRoute);
app.use((error, _req, res, _next) => {
    res.json({
        message: error.message || "Something went wrong",
        stack: error.stack || null,
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
