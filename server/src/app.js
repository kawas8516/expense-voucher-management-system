import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import voucherRoutes from "./routes/voucherRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import { mongoReady } from "./config/mongo.js";

const app = express();

// CLIENT_URL can be a comma separated list (eg. localhost + vercel url)
const allowedOrigins = (process.env.CLIENT_URL || "").split(",").map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, mongo: mongoReady() ? "connected" : "disabled" });
});

app.use("/api/auth", authRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/files", fileRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

export default app;
