import express from "express";
import { body } from "express-validator";
import { BalanceController } from "../controllers/balance.controller.js";
import { authenticateToken as auth } from "../middleware/auth.js";
import { enforceFeatureFlag } from "../middleware/settingsEnforcement.js";

const router = express.Router();
const balanceController = new BalanceController();

// Get balance (always allowed - users need to see their balance)
router.get("/", auth, balanceController.getBalance);

// Get transactions - check if transactions module is enabled
router.get("/transactions", 
  auth, 
  enforceFeatureFlag('features.transactions.moduleEnabled', 'Transactions module is currently disabled'),
  balanceController.getTransactions
);

// Add balance - check if deposits are enabled
router.post(
  "/deposit",
  auth,
  enforceFeatureFlag('features.transactions.moduleEnabled', 'Deposits are currently disabled'),
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

// Withdraw balance - check if withdrawals are enabled
router.post(
  "/withdraw",
  auth,
  enforceFeatureFlag('features.transactions.withdrawalsEnabled', 'Withdrawals are currently disabled'),
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

export { router as balanceRouter };
