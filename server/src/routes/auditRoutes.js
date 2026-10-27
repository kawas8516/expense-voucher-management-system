import { Router } from "express";
import { query } from "express-validator";
import { getAuditLog } from "../controllers/auditController.js";
import { verifyToken, allowRoles } from "../middleware/auth.js";
import AuditLog from "../models/AuditLog.js";

const router = Router();

const ACTIONS = AuditLog.schema.path("action").enumValues;

const rules = [
  query("action").optional({ values: "falsy" }).isIn(ACTIONS).withMessage("Invalid action"),
  query("user").optional().trim().isLength({ max: 100 }),
  query("from").optional({ values: "falsy" }).isISO8601().withMessage("Invalid from date"),
  query("to").optional({ values: "falsy" }).isISO8601().withMessage("Invalid to date"),
  query("page").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("Invalid page"),
];

// activity log is for the director and the accounts team
router.get("/", verifyToken, allowRoles("director", "accounts"), rules, getAuditLog);

export default router;
