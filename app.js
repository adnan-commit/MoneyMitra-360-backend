import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import compression from "compression";
import hpp from "hpp";
import dashboardRoutes from "./routes/dashboardRoutes.js";

import authRoutes from "./routes/authRoutes.js";
import statementRoutes from "./routes/statementRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";


import { connectDB } from "./config/db.js";
import { globalErrorHandler } from "./middleware/errorMiddleware.js";

// MongoDB connection
connectDB();

const app = express();

// 1. Secure HTTP Headers
app.use(helmet());

// 2. Prevent XSS attacks

// 3. Prevent HTTP param pollution
app.use(hpp());

// 4. Body size limit (prevent large payload attacks)
app.use(express.json({ limit: "10kb" }));


// 5. Compression (performance boost)
app.use(compression());

// 6. Logging (dev only)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// 7. Rate limiting (anti-brute force)
const limiter = rateLimit({
  max: 100, // 100 requests
  windowMs: 15 * 60 * 1000, // 15 mins
  message: "Too many requests from this IP, try again later.",
});
app.use("/api", limiter);

// 8. CORS control (important)
const allowedOrigins = [
  "http://localhost:5173",
  "https://moneymitra-360.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/statements", statementRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/transactions", transactionRoutes);

app.use(globalErrorHandler);


// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

