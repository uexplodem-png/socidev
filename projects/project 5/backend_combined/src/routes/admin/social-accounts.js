import express from 'express';
import { SocialAccount, User } from '../../models/index.js';
import { authenticateToken, requirePermission } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database.js';

const router = express.Router();

// Get all social accounts with filters and pagination
router.get(
  '/',
  authenticateToken,
  requirePermission('users.view'),
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      search = '',
      platform = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const whereClause = {};
    
    if (platform) {
      whereClause.platform = platform;
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { accountId: { [Op.like]: `%${search}%` } },
      ];
    }

    // Get accounts with user data
    const { rows: accounts, count: total } = await SocialAccount.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'username'],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]],
    });

    // Format response
    const formattedAccounts = accounts.map((account) => ({
      id: account.id,
      userId: account.userId,
      userName: account.user
        ? `${account.user.firstName || ''} ${account.user.lastName || ''}`.trim()
        : 'Unknown',
      userEmail: account.user?.email || '',
      username: account.username,
      platform: account.platform,
      accountId: account.accountId,
      profileUrl: account.profileUrl,
      status: account.status,
      followersCount: account.followersCount,
      followingCount: account.followingCount,
      postsCount: account.postsCount,
      lastActivity: account.lastActivity,
      healthScore: account.healthScore,
      verificationStatus: account.verificationStatus,
      errorCount: account.errorCount,
      lastError: account.lastError,
      lastErrorAt: account.lastErrorAt,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }));

    res.json({
      accounts: formattedAccounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  })
);

// Get social account statistics
router.get(
  '/stats',
  authenticateToken,
  requirePermission('users.view'),
  asyncHandler(async (req, res) => {
    const totalAccounts = await SocialAccount.count();
    const activeAccounts = await SocialAccount.count({ where: { status: 'active' } });
    const inactiveAccounts = await SocialAccount.count({ where: { status: 'inactive' } });
    const errorAccounts = await SocialAccount.count({ where: { status: 'error' } });
    const suspendedAccounts = await SocialAccount.count({ where: { status: 'suspended' } });
    const bannedAccounts = await SocialAccount.count({ where: { status: 'banned' } });

    // Platform breakdown
    const platformStats = await SocialAccount.findAll({
      attributes: [
        'platform',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['platform'],
    });

    // Status breakdown
    const statusStats = await SocialAccount.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['status'],
    });

    // Health score average
    const healthScoreAvg = await SocialAccount.findOne({
      attributes: [[sequelize.fn('AVG', sequelize.col('health_score')), 'avg']],
      raw: true,
    });

    res.json({
      totalAccounts,
      activeAccounts,
      inactiveAccounts,
      errorAccounts,
      suspendedAccounts,
      bannedAccounts,
      platformBreakdown: platformStats.map((p) => ({
        platform: p.platform,
        count: parseInt(p.get('count')),
      })),
      statusBreakdown: statusStats.map((s) => ({
        status: s.status,
        count: parseInt(s.get('count')),
      })),
      averageHealthScore: parseFloat(healthScoreAvg?.avg || 0),
    });
  })
);

// Get single social account details
router.get(
  '/:id',
  authenticateToken,
  requirePermission('users.view'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const account = await SocialAccount.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'username', 'status'],
        },
      ],
    });

    if (!account) {
      return res.status(404).json({ error: 'Social account not found' });
    }

    res.json({
      id: account.id,
      userId: account.userId,
      user: account.user,
      username: account.username,
      platform: account.platform,
      accountId: account.accountId,
      profileUrl: account.profileUrl,
      status: account.status,
      followersCount: account.followersCount,
      followingCount: account.followingCount,
      postsCount: account.postsCount,
      lastActivity: account.lastActivity,
      healthScore: account.healthScore,
      verificationStatus: account.verificationStatus,
      accountData: account.accountData,
      errorCount: account.errorCount,
      lastError: account.lastError,
      lastErrorAt: account.lastErrorAt,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    });
  })
);

// Update social account status
router.put(
  '/:id/status',
  authenticateToken,
  requirePermission('users.edit'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'error', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const account = await SocialAccount.findByPk(id);

    if (!account) {
      return res.status(404).json({ error: 'Social account not found' });
    }

    await account.update({ status });

    res.json({
      success: true,
      message: 'Account status updated successfully',
      account: {
        id: account.id,
        status: account.status,
      },
    });
  })
);

// Delete social account
router.delete(
  '/:id',
  authenticateToken,
  requirePermission('users.delete'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const account = await SocialAccount.findByPk(id);

    if (!account) {
      return res.status(404).json({ error: 'Social account not found' });
    }

    await account.destroy();

    res.json({
      success: true,
      message: 'Social account deleted successfully',
    });
  })
);

// Refresh account data (simulate sync)
router.post(
  '/:id/refresh',
  authenticateToken,
  requirePermission('users.edit'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const account = await SocialAccount.findByPk(id);

    if (!account) {
      return res.status(404).json({ error: 'Social account not found' });
    }

    // Simulate data refresh (in production, this would call the actual API)
    await account.update({
      lastActivity: new Date(),
      healthScore: Math.min(100, account.healthScore + 5),
    });

    res.json({
      success: true,
      message: 'Account data refreshed successfully',
      account: {
        id: account.id,
        healthScore: account.healthScore,
        lastActivity: account.lastActivity,
      },
    });
  })
);

export default router;
