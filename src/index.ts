import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";


import artRoute from "./modules/arts/router.js";

dotenv.config();

const app = express();

// Middleware

app.use(cors());
app.use(express.json());



app.use("/api/arts", artRoute);



// Constants
const PORT = process.env.PORT || 3000;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;



async function start() {
  try {
    await mongoose.connect(
      `mongodb+srv://${DB_USER}:${DB_PASSWORD}@cluster0.b6qtdz4.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`
    );
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  } catch (error) {
    console.log(error);
  }
}

start();
