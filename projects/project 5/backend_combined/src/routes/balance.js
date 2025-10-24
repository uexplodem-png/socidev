import express from "express";
import { body } from "express-validator";
import { BalanceController } from "../controllers/balance.controller.js";
import { authenticateToken as auth } from "../middleware/auth.js";

const router = express.Router();
const balanceController = new BalanceController();

// Add balance
router.post(
  "/deposit",
  auth,
  [
    body("amount")
      .isFloat({ min: 0.01 })
      .withMessage("Amount must be greater than 0"),
    body("method")
      .isIn(["bank_transfer", "credit_card", "crypto"])
      .withMessage("Invalid payment method"),
    body("details").optional().isObject().withMessage("Invalid details"),
  ],
  balanceController.addBalance
);

// Withdraw balance
router.post(
  "/withdraw",
  auth,
  [
    body("amount")
      .isFloat({ min: 0.01 })
      .withMessage("Amount must be greater than 0"),
    body("method")
      .isIn(["bank_transfer", "crypto"])
      .withMessage("Invalid withdrawal method"),
    body("details").optional().isObject().withMessage("Invalid details"),
  ],
  balanceController.withdrawBalance
);

// Get transactions
router.get("/transactions", auth, balanceController.getTransactions);

// Get balance
router.get("/", auth, balanceController.getBalance);

export { router as balanceRouter };
