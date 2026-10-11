import { Router } from "express";
import { body } from "express-validator";
import { login, me } from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

router.post(
  "/login",
  [
    body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Enter a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  login
);

router.get("/me", verifyToken, me);

export default router;
