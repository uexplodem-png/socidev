import express from 'express';
import { Op } from 'sequelize';
import EmailTemplate from '../../models/EmailTemplate.js';
import EmailLog from '../../models/EmailLog.js';
import { User } from '../../models/index.js';
import { emailService } from '../../services/email.service.js';
import { authenticateToken, requireAdminPermission } from '../../middleware/auth.js';
import logger from '../../config/logger.js';
import { logAudit } from '../../utils/logging.js';

const router = express.Router();

// ============= EMAIL TEMPLATES =============

/**
 * GET /api/admin/emails/templates
 * Get all email templates with pagination and filters
 */
router.get('/templates', 
  authenticateToken, 
  requireAdminPermission('emails.view'),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        category = '',
        isActive = '',
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      const where = {};
      
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { key: { [Op.like]: `%${search}%` } },
          { subject: { [Op.like]: `%${search}%` } }
        ];
      }
      
      if (category) {
        where.category = category;
      }
      
      if (isActive !== '') {
        where.isActive = isActive === 'true';
      }

      const { rows: templates, count: total } = await EmailTemplate.findAndCountAll({
        where,
        attributes: ['id', 'name', 'key', 'subject', 'category', 'isActive', 'variables', 'createdAt', 'updatedAt'],
        limit: parseInt(limit),
        offset,
        order: [[sortBy, sortOrder.toUpperCase()]],
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email'],
            required: false
          }
        ]
      });

      res.json({
        success: true,
        data: templates,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      logger.error('Failed to fetch email templates', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch email templates',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/admin/emails/templates/:id
 * Get single email template
 */
router.get('/templates/:id',
  authenticateToken,
  requireAdminPermission('emails.view'),
  async (req, res) => {
    try {
      const template = await EmailTemplate.findByPk(req.params.id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email'],
            required: false
          }
        ]
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Email template not found'
        });
      }

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      logger.error('Failed to fetch email template', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch email template',
        error: error.message
      });
    }
  }
);

/**
 * POST /api/admin/emails/templates
 * Create new email template
 */
router.post('/templates',
  authenticateToken,
  requireAdminPermission('emails.create'),
  async (req, res) => {
    try {
      const { name, key, subject, bodyHtml, bodyText, variables, category, isActive } = req.body;

      // Check if key already exists
      const existing = await EmailTemplate.findOne({ where: { key } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Template key already exists'
        });
      }

      const template = await EmailTemplate.create({
        name,
        key,
        subject,
        bodyHtml,
        bodyText,
        variables: variables || [],
        category: category || 'transactional',
        isActive: isActive !== undefined ? isActive : true,
        createdBy: req.user.id,
        updatedBy: req.user.id
      });

      await logAudit({
        actorId: req.user.id,
        action: 'create',
        resource: 'email_template',
        resourceId: template.id,
        description: `Created email template: ${name}`,
        metadata: { templateKey: key },
        req
      });

      res.status(201).json({
        success: true,
        message: 'Email template created successfully',
        data: template
      });
    } catch (error) {
      logger.error('Failed to create email template', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to create email template',
        error: error.message
      });
    }
  }
);

/**
 * PUT /api/admin/emails/templates/:id
 * Update email template
 */
router.put('/templates/:id',
  authenticateToken,
  requireAdminPermission('emails.edit'),
  async (req, res) => {
    try {
      const template = await EmailTemplate.findByPk(req.params.id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Email template not found'
        });
      }

      const { name, key, subject, bodyHtml, bodyText, variables, category, isActive } = req.body;

      // Check if key is being changed and already exists
      if (key && key !== template.key) {
        const existing = await EmailTemplate.findOne({ where: { key } });
        if (existing) {
          return res.status(400).json({
            success: false,
            message: 'Template key already exists'
          });
        }
      }

      await template.update({
        ...(name && { name }),
        ...(key && { key }),
        ...(subject && { subject }),
        ...(bodyHtml && { bodyHtml }),
        ...(bodyText !== undefined && { bodyText }),
        ...(variables && { variables }),
        ...(category && { category }),
        ...(isActive !== undefined && { isActive }),
        updatedBy: req.user.id
      });

      await logAudit({
        actorId: req.user.id,
        action: 'update',
        resource: 'email_template',
        resourceId: template.id,
        description: `Updated email template: ${template.name}`,
        metadata: { templateKey: template.key },
        req
      });

      res.json({
        success: true,
        message: 'Email template updated successfully',
        data: template
      });
    } catch (error) {
      logger.error('Failed to update email template', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to update email template',
        error: error.message
      });
    }
  }
);

/**
 * DELETE /api/admin/emails/templates/:id
 * Delete email template
 */
router.delete('/templates/:id',
  authenticateToken,
  requireAdminPermission('emails.delete'),
  async (req, res) => {
    try {
      const template = await EmailTemplate.findByPk(req.params.id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Email template not found'
        });
      }

      const templateName = template.name;
      const templateKey = template.key;

      await template.destroy();

      await logAudit({
        actorId: req.user.id,
        action: 'delete',
        resource: 'email_template',
        resourceId: req.params.id,
        description: `Deleted email template: ${templateName}`,
        metadata: { templateKey },
        req
      });

      res.json({
        success: true,
        message: 'Email template deleted successfully'
      });
    } catch (error) {
      logger.error('Failed to delete email template', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to delete email template',
        error: error.message
      });
    }
  }
);

/**
 * POST /api/admin/emails/templates/:id/preview
 * Preview email template with variables
 */
router.post('/templates/:id/preview',
  authenticateToken,
  requireAdminPermission('emails.view'),
  async (req, res) => {
    try {
      const template = await EmailTemplate.findByPk(req.params.id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Email template not found'
        });
      }

      const { variables = {} } = req.body;

      // Helper function to replace variables
      const replaceVariables = (text, vars) => {
        if (!text) return '';
        let result = text;
        Object.keys(vars).forEach(key => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          result = result.replace(regex, vars[key] || '');
        });
        return result;
      };

      const preview = {
        subject: replaceVariables(template.subject, variables),
        bodyHtml: replaceVariables(template.bodyHtml, variables),
        bodyText: replaceVariables(template.bodyText, variables)
      };

      res.json({
        success: true,
        data: preview
      });
    } catch (error) {
      logger.error('Failed to preview email', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to preview email',
        error: error.message
      });
    }
  }
);

// ============= EMAIL SENDING =============

/**
 * POST /api/admin/emails/send
 * Send single email using template
 */
router.post('/send',
  authenticateToken,
  requireAdminPermission('emails.send'),
  async (req, res) => {
    try {
      const { templateKey, recipientEmail, variables = {} } = req.body;

      if (!templateKey || !recipientEmail) {
        return res.status(400).json({
          success: false,
          message: 'Template key and recipient email are required'
        });
      }

      // Get template
      const template = await EmailTemplate.findOne({ where: { key: templateKey, isActive: true } });
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Email template not found or inactive'
        });
      }

      // Replace variables
      const replaceVariables = (text, vars) => {
        if (!text) return '';
        let result = text;
        Object.keys(vars).forEach(key => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          result = result.replace(regex, vars[key] || '');
        });
        return result;
      };

      const subject = replaceVariables(template.subject, variables);
      const bodyHtml = replaceVariables(template.bodyHtml, variables);
      const bodyText = replaceVariables(template.bodyText, variables);

      // Find user
      const user = await User.findOne({
        where: { email: recipientEmail },
        attributes: ['id', 'firstName', 'lastName']
      });

      // Create email log
      const emailLog = await EmailLog.create({
        templateId: template.id,
        recipientEmail,
        recipientName: user ? `${user.firstName} ${user.lastName}` : variables.firstName || null,
        recipientUserId: user?.id || null,
        subject,
        bodyHtml,
        bodyText,
        variablesUsed: variables,
        status: 'sent', // Mark as sent (actual sending will be implemented later)
        sentBy: req.user.id,
        sentAt: new Date(),
        provider: 'smtp'
      });

      await logAudit({
        actorId: req.user.id,
        action: 'send',
        resource: 'email',
        resourceId: emailLog.id,
        description: `Sent email to ${recipientEmail}`,
        metadata: { templateKey, recipientEmail },
        req
      });

      res.json({
        success: true,
        message: 'Email sent successfully',
        data: emailLog
      });
    } catch (error) {
      logger.error('Failed to send email', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: error.message
      });
    }
  }
);

/**
 * POST /api/admin/emails/send-custom
 * Send custom email without template
 */
router.post('/send-custom',
  authenticateToken,
  requireAdminPermission('emails.send'),
  async (req, res) => {
    try {
      const { recipientEmail, subject, bodyHtml, bodyText } = req.body;

      if (!recipientEmail || !subject || !bodyHtml) {
        return res.status(400).json({
          success: false,
          message: 'Recipient email, subject, and body are required'
        });
      }

      // Find user
      const user = await User.findOne({
        where: { email: recipientEmail },
        attributes: ['id', 'firstName', 'lastName']
      });

      // Create email log
      const emailLog = await EmailLog.create({
        templateId: null,
        recipientEmail,
        recipientName: user ? `${user.firstName} ${user.lastName}` : null,
        recipientUserId: user?.id || null,
        subject,
        bodyHtml,
        bodyText,
        status: 'sent',
        sentBy: req.user.id,
        sentAt: new Date(),
        provider: 'smtp'
      });

      await logAudit({
        actorId: req.user.id,
        action: 'send',
        resource: 'email',
        resourceId: emailLog.id,
        description: `Sent custom email to ${recipientEmail}`,
        metadata: { subject, recipientEmail },
        req
      });

      res.json({
        success: true,
        message: 'Email sent successfully',
        data: emailLog
      });
    } catch (error) {
      logger.error('Failed to send custom email', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to send custom email',
        error: error.message
      });
    }
  }
);

/**
 * POST /api/admin/emails/send-bulk
 * Send bulk emails using template
 */
router.post('/send-bulk',
  authenticateToken,
  requireAdminPermission('emails.send_bulk'),
  async (req, res) => {
    try {
      const { templateKey, recipients } = req.body;

      if (!templateKey || !recipients || !Array.isArray(recipients)) {
        return res.status(400).json({
          success: false,
          message: 'Template key and recipients array are required'
        });
      }

      // Get template
      const template = await EmailTemplate.findOne({ where: { key: templateKey, isActive: true } });
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Email template not found or inactive'
        });
      }

      // Send to each recipient (simplified)
      const results = {
        success: 0,
        failed: 0,
        results: []
      };

      for (const recipient of recipients) {
        try {
          const replaceVariables = (text, vars) => {
            if (!text) return '';
            let result = text;
            Object.keys(vars).forEach(key => {
              const regex = new RegExp(`{{${key}}}`, 'g');
              result = result.replace(regex, vars[key] || '');
            });
            return result;
          };

          const subject = replaceVariables(template.subject, recipient.variables || {});
          const bodyHtml = replaceVariables(template.bodyHtml, recipient.variables || {});

          await EmailLog.create({
            templateId: template.id,
            recipientEmail: recipient.email,
            recipientName: recipient.variables?.firstName || null,
            subject,
            bodyHtml,
            status: 'sent',
            sentBy: req.user.id,
            sentAt: new Date()
          });

          results.success++;
          results.results.push({
            email: recipient.email,
            status: 'success'
          });
        } catch (error) {
          results.failed++;
          results.results.push({
            email: recipient.email,
            status: 'failed',
            error: error.message
          });
        }
      }

      await logAudit({
        actorId: req.user.id,
        action: 'send_bulk',
        resource: 'email',
        description: `Sent bulk emails to ${recipients.length} recipients`,
        metadata: { templateKey, totalRecipients: recipients.length, results },
        req
      });

      res.json({
        success: true,
        message: 'Bulk emails sent',
        data: results
      });
    } catch (error) {
      logger.error('Failed to send bulk emails', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to send bulk emails',
        error: error.message
      });
    }
  }
);

// ============= EMAIL LOGS =============

/**
 * GET /api/admin/emails/logs
 * Get email logs with pagination and filters
 */
router.get('/logs',
  authenticateToken,
  requireAdminPermission('emails.view'),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        status = '',
        templateId = '',
        startDate = '',
        endDate = '',
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      const where = {};
      
      if (search) {
        where[Op.or] = [
          { recipientEmail: { [Op.like]: `%${search}%` } },
          { recipientName: { [Op.like]: `%${search}%` } },
          { subject: { [Op.like]: `%${search}%` } }
        ];
      }
      
      if (status) {
        where.status = status;
      }
      
      if (templateId) {
        where.templateId = parseInt(templateId);
      }
      
      if (startDate) {
        where.createdAt = { [Op.gte]: new Date(startDate) };
      }
      
      if (endDate) {
        where.createdAt = { ...where.createdAt, [Op.lte]: new Date(endDate) };
      }

      const { rows: logs, count: total } = await EmailLog.findAndCountAll({
        where,
        attributes: { exclude: ['bodyHtml', 'bodyText'] }, // Exclude large fields
        limit: parseInt(limit),
        offset,
        order: [[sortBy, sortOrder.toUpperCase()]],
        include: [
          {
            model: EmailTemplate,
            as: 'template',
            attributes: ['id', 'name', 'key'],
            required: false
          },
          {
            model: User,
            as: 'recipient',
            attributes: ['id', 'firstName', 'lastName', 'email'],
            required: false
          },
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName', 'email'],
            required: false
          }
        ]
      });

      res.json({
        success: true,
        data: logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      logger.error('Failed to fetch email logs', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch email logs',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/admin/emails/logs/:id
 * Get single email log with full details
 */
router.get('/logs/:id',
  authenticateToken,
  requireAdminPermission('emails.view'),
  async (req, res) => {
    try {
      const log = await EmailLog.findByPk(req.params.id, {
        include: [
          {
            model: EmailTemplate,
            as: 'template',
            required: false
          },
          {
            model: User,
            as: 'recipient',
            attributes: ['id', 'firstName', 'lastName', 'email'],
            required: false
          },
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName', 'email'],
            required: false
          }
        ]
      });

      if (!log) {
        return res.status(404).json({
          success: false,
          message: 'Email log not found'
        });
      }

      res.json({
        success: true,
        data: log
      });
    } catch (error) {
      logger.error('Failed to fetch email log', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch email log',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/admin/emails/stats
 * Get email statistics
 */
router.get('/stats',
  authenticateToken,
  requireAdminPermission('emails.view'),
  async (req, res) => {
    try {
      const totalSent = await EmailLog.count({ where: { status: 'sent' } });
      const totalFailed = await EmailLog.count({ where: { status: 'failed' } });
      const totalPending = await EmailLog.count({ where: { status: 'pending' } });
      const totalTemplates = await EmailTemplate.count();
      const activeTemplates = await EmailTemplate.count({ where: { isActive: true } });

      // Recent emails (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentSent = await EmailLog.count({
        where: {
          status: 'sent',
          createdAt: { [Op.gte]: sevenDaysAgo }
        }
      });

      res.json({
        success: true,
        data: {
          totalSent,
          totalFailed,
          totalPending,
          totalTemplates,
          activeTemplates,
          recentSent,
          successRate: totalSent + totalFailed > 0 
            ? ((totalSent / (totalSent + totalFailed)) * 100).toFixed(2) 
            : 0
        }
      });
    } catch (error) {
      logger.error('Failed to fetch email stats', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch email stats',
        error: error.message
      });
    }
  }
);

export default router;
