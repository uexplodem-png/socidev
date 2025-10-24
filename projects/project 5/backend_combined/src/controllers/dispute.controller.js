import { Dispute } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

export class DisputeController {
  // Create dispute
  async createDispute(req, res, next) {
    try {
      const { orderId, taskId, reason, description } = req.body;
      const userId = req.user.id;

      const dispute = await Dispute.create({
        orderId,
        taskId,
        userId,
        reason,
        description,
        status: 'pending'
      });

      res.status(201).json({
        success: true,
        message: 'Dispute created successfully',
        data: dispute
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user's disputes
  async getDisputes(req, res, next) {
    try {
      const userId = req.user.id;
      const disputes = await Dispute.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: disputes
      });
    } catch (error) {
      next(error);
    }
  }

  // Get dispute details
  async getDispute(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const dispute = await Dispute.findOne({
        where: { id, userId }
      });

      if (!dispute) {
        throw new ApiError(404, 'Dispute not found');
      }

      res.json({
        success: true,
        data: dispute
      });
    } catch (error) {
      next(error);
    }
  }

  // Update dispute
  async updateDispute(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { reason, description } = req.body;

      const dispute = await Dispute.findOne({
        where: { id, userId }
      });

      if (!dispute) {
        throw new ApiError(404, 'Dispute not found');
      }

      // Only allow updates if dispute is pending
      if (dispute.status !== 'pending') {
        throw new ApiError(400, 'Cannot update dispute that is not pending');
      }

      await dispute.update({
        reason,
        description
      });

      res.json({
        success: true,
        message: 'Dispute updated successfully',
        data: dispute
      });
    } catch (error) {
      next(error);
    }
  }
}