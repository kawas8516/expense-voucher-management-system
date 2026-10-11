import { Router } from "express";
import { getStats } from "../controllers/dashboardController.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

router.get("/", verifyToken, getStats);

export default router;
