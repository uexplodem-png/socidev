import Dispute from '../models/Dispute.js';
import { ApiError } from '../utils/ApiError.js';
import { sendNotification } from '../utils/notifications.js';
import logger from '../config/logger.js';

export class DisputeService {
  async createDispute(userId, orderId, data) {
    const dispute = await Dispute.create({
      userId,
      orderId,
      type: data.type,
      subject: data.subject,
      description: data.description
    });

    // Send notification to user and admin
    await sendNotification(userId, 'dispute_created', {
      disputeId: dispute.id,
      subject: dispute.subject
    });

    return dispute;
  }

  async getDispute(userId, disputeId) {
    const dispute = await Dispute.findOne({
      where: { id: disputeId, userId }
    });

    if (!dispute) {
      throw new ApiError(404, 'Dispute not found');
    }

    return dispute;
  }

  async updateDispute(userId, disputeId, data) {
    const dispute = await this.getDispute(userId, disputeId);

    if (dispute.status === 'closed') {
      throw new ApiError(400, 'Cannot update closed dispute');
    }

    const updatedDispute = await dispute.update(data);
    return updatedDispute;
  }

  async resolveDispute(disputeId, resolution) {
    const dispute = await Dispute.findByPk(disputeId);
    if (!dispute) {
      throw new ApiError(404, 'Dispute not found');
    }

    await dispute.update({
      status: 'resolved',
      resolution,
      resolvedAt: new Date()
    });

    // Send notification to user
    await sendNotification(dispute.userId, 'dispute_resolved', {
      disputeId: dispute.id,
      resolution
    });

    return dispute;
  }

  async getUserDisputes(userId, { status, page = 1, limit = 10 }) {
    const where = { userId };
    if (status) where.status = status;

    const { rows: disputes, count } = await Dispute.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });

    return {
      disputes,
      pagination: {
        total: count,
        page,
        totalPages: Math.ceil(count / limit)
      }
    };
  }
}