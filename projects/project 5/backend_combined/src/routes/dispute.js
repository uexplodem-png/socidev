import express from 'express';
import { DisputeController } from '../controllers/dispute.controller.js';
import { authenticateToken as auth } from '../middleware/auth.js';
import { validateDispute } from '../validators/dispute.validator.js';
import { logActivity } from '../middleware/activity-logger.js';

const router = express.Router();
const disputeController = new DisputeController();

// Create dispute
router.post('/',
  auth,
  validateDispute,
  logActivity('dispute', 'create'),
  disputeController.createDispute
);

// Get user's disputes
router.get('/',
  auth,
  disputeController.getDisputes
);

// Get dispute details
router.get('/:id',
  auth,
  disputeController.getDispute
);

// Update dispute
router.put('/:id',
  auth,
  validateDispute,
  logActivity('dispute', 'update'),
  disputeController.updateDispute
);

export { router as disputeRouter };