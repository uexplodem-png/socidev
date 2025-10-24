import express from "express";
import { InstagramAccountController } from "../controllers/instagram-account.controller.js";
import { authenticateToken as auth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate-request.js";
import {
  validateInstagramAccount,
  validateAccountSettings,
} from "../validators/instagram-account.validator.js";

const router = express.Router();
const instagramAccountController = new InstagramAccountController();

// Add Instagram account
router.post(
  "/",
  auth,
  validateInstagramAccount,
  validateRequest,
  instagramAccountController.addAccount
);

// Get user's Instagram accounts
router.get("/", auth, instagramAccountController.getAccounts);

// Get account details
router.get("/:id", auth, instagramAccountController.getAccountDetails);

// Update account settings
router.put(
  "/:id/settings",
  auth,
  validateAccountSettings,
  validateRequest,
  instagramAccountController.updateSettings
);

// Delete account
router.delete("/:id", auth, instagramAccountController.deleteAccount);

// Get account statistics
router.get("/:id/stats", auth, instagramAccountController.getAccountStats);

export { router as instagramAccountRouter };
