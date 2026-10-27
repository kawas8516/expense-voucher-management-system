import { Router } from "express";
import { body, param, query, validationResult } from "express-validator";
import {
  getVouchers,
  getVoucher,
  getVoucherHistory,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  submitVoucher,
  approveVoucher,
  rejectVoucher,
} from "../controllers/voucherController.js";
import { verifyToken, allowRoles } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = Router();

export const CATEGORIES = ["Travel", "Food", "Accommodation", "Office Supplies", "Fuel", "Communication", "Other"];
const STATUSES = ["draft", "pending", "approved", "rejected"];

const voucherRules = [
  body("department").trim().notEmpty().withMessage("Department is required"),
  body("title").trim().notEmpty().withMessage("Expense title is required").isLength({ max: 150 }).withMessage("Title is too long"),
  body("expense_date")
    .notEmpty().withMessage("Expense date is required")
    .isISO8601().withMessage("Expense date is not valid")
    .custom((value) => {
      // local date, toISOString() would give UTC date
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (value > today) throw new Error("Expense date cannot be in the future");
      return true;
    }),
  body("amount")
    .notEmpty().withMessage("Amount is required")
    .isFloat({ gt: 0 }).withMessage("Amount must be greater than zero")
    .isFloat({ max: 9999999999 }).withMessage("Amount is too large"),
  body("category").optional({ values: "falsy" }).isIn(CATEGORIES).withMessage("Invalid category"),
  body("description").optional().trim(),
];

// search / filter params for list
const listRules = [
  query("q").optional().trim().isLength({ max: 100 }),
  query("department").optional().trim().isLength({ max: 100 }),
  query("category").optional({ values: "falsy" }).isIn(CATEGORIES).withMessage("Invalid category"),
  query("status").optional({ values: "falsy" }).isIn(STATUSES).withMessage("Invalid status"),
  query("from").optional({ values: "falsy" }).isISO8601().withMessage("Invalid from date"),
  query("to").optional({ values: "falsy" }).isISO8601().withMessage("Invalid to date"),
  query("min").optional({ values: "falsy" }).isFloat({ min: 0 }).withMessage("Invalid min amount"),
  query("max").optional({ values: "falsy" }).isFloat({ min: 0 }).withMessage("Invalid max amount"),
  query("order").optional({ values: "falsy" }).isIn(["asc", "desc"]).withMessage("Invalid order"),
];

const rejectRules = [
  body("reason")
    .trim()
    .notEmpty().withMessage("Rejection reason is required")
    .isLength({ max: 500 }).withMessage("Reason is too long (max 500 characters)"),
];

const idRule = param("id").isInt({ min: 1 }).withMessage("Invalid voucher id");

// for routes without file upload, stop here if id is wrong
function checkId(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
}

router.use(verifyToken);

router.get("/", listRules, getVouchers);
router.get("/:id", idRule, checkId, getVoucher);
router.get("/:id/history", idRule, checkId, getVoucherHistory);

// employee only
router.post("/", allowRoles("employee"), upload.single("signature"), voucherRules, createVoucher);
router.put("/:id", allowRoles("employee"), upload.single("signature"), idRule, voucherRules, updateVoucher);
router.delete("/:id", allowRoles("employee"), idRule, checkId, deleteVoucher);
router.post("/:id/submit", allowRoles("employee"), idRule, checkId, submitVoucher);

// director only
router.post("/:id/approve", allowRoles("director"), upload.single("signature"), idRule, approveVoucher);
router.post("/:id/reject", allowRoles("director"), idRule, rejectRules, rejectVoucher);

export default router;
