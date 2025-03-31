import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { router } from "./routes";

// Try to load .env from current directory first, then from dist directory
if (fs.existsSync(path.join(process.cwd(), ".env"))) {
  dotenv.config();
} else if (fs.existsSync(path.join(process.cwd(), "dist", ".env"))) {
  dotenv.config({ path: path.join(process.cwd(), "dist", ".env") });
} else {
  console.warn("No .env file found, using environment variables");
  dotenv.config();
}

console.log("Ambiente:", process.env.NODE_ENV);
console.log("JWT_SECRET no início do servidor:", process.env.JWT_SECRET);

const app = express();
const port = process.env.PORT || 3333;

const allowedOrigins = [
  "http://localhost:5173",
  "https://plann-er-lake.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir requisições sem origem (como apps mobile ou postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(router);

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
