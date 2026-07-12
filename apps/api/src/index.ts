import express, { Express } from "express";
import cors from "cors";
import dotenv from "dotenv"; 
import { env } from "./config/env.config.js";

import authRouter from "./routers/auth.router.js";
import { errorHandler } from "./middleware/error.middleware.js";

// Load env
dotenv.config();

const app: Express = express();

// Secure CORS config matching target frontend URL
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

// Mount Modular Routers
app.use("/api/auth", authRouter);

// Standard Health check
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "TransitOps API is fully active and healthy",
  });
});

// Unified Error Interceptor (MUST be placed after all route definitions)
app.use(errorHandler);

// Start Server
app.listen(env.PORT, async () => {
  console.log(`TransitOps Express server listening on port ${env.PORT}`);
});

export default app;
