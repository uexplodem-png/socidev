import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';
import { settingsService } from './settingsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Email Service
 * Handles all email operations with template support
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = {};
  }

  /**
   * Initialize email transporter with SMTP settings
   */
  async initialize() {
    try {
      // Get email settings from environment or database
      const emailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      };

      this.transporter = nodemailer.createTransport(emailConfig);

      // Verify connection
      await this.transporter.verify();
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      throw error;
    }
  }

  /**
   * Load and compile email template
   */
  loadTemplate(templateName) {
    if (this.templates[templateName]) {
      return this.templates[templateName];
    }

    const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
    
    if (!fs.existsSync(templatePath)) {
      logger.error(`Email template not found: ${templateName}`);
      return null;
    }

    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    this.templates[templateName] = handlebars.compile(templateSource);
    return this.templates[templateName];
  }

  /**
   * Send email
   */
  async send(to, subject, templateName, data = {}) {
    try {
      // Check if email notifications are enabled
      const emailEnabled = await settingsService.get('email.notifications.enabled', true);
      if (!emailEnabled) {
        logger.info(`Email notifications disabled. Skipping email to ${to}`);
        return { skipped: true };
      }

      if (!this.transporter) {
        await this.initialize();
      }

      const template = this.loadTemplate(templateName);
      if (!template) {
        throw new Error(`Template ${templateName} not found`);
      }

      // Add common data
      const siteName = await settingsService.get('site.name', 'SociDev');
      const templateData = {
        ...data,
        siteName,
        currentYear: new Date().getFullYear(),
        supportEmail: process.env.SUPPORT_EMAIL || 'support@socidev.com',
      };

      const html = template(templateData);

      const mailOptions = {
        from: `"${siteName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}`, { messageId: info.messageId });
      return info;
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(user) {
    return this.send(
      user.email,
      'Welcome to SociDev! 🎉',
      'welcome',
      {
        firstName: user.firstName,
        username: user.username,
        loginUrl: process.env.FRONTEND_URL || 'http://localhost:5174',
      }
    );
  }

  /**
   * Send order status update email
   */
  async sendOrderStatusEmail(user, order, status) {
    const statusMessages = {
      approved: 'Your order has been approved and is now being processed.',
      processing: 'Your order is currently being processed.',
      completed: 'Your order has been completed successfully!',
      failed: 'Unfortunately, your order could not be completed.',
      cancelled: 'Your order has been cancelled.',
    };

    return this.send(
      user.email,
      `Order #${order.id.substring(0, 8)} - ${status.toUpperCase()}`,
      'order-status',
      {
        firstName: user.firstName,
        orderId: order.id.substring(0, 8),
        status,
        statusMessage: statusMessages[status] || 'Your order status has been updated.',
        platform: order.platform,
        service: order.service,
        quantity: order.quantity,
        amount: order.amount,
        orderUrl: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/orders/${order.id}`,
      }
    );
  }

  /**
   * Send withdrawal request confirmation email
   */
  async sendWithdrawalRequestEmail(user, withdrawal) {
    return this.send(
      user.email,
      'Withdrawal Request Received',
      'withdrawal-request',
      {
        firstName: user.firstName,
        amount: withdrawal.amount,
        fee: withdrawal.fee || 0,
        totalAmount: withdrawal.totalAmount || withdrawal.amount,
        method: withdrawal.method,
        withdrawalUrl: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/withdrawals`,
      }
    );
  }

  /**
   * Send withdrawal completed email
   */
  async sendWithdrawalCompletedEmail(user, withdrawal) {
    return this.send(
      user.email,
      'Withdrawal Completed Successfully',
      'withdrawal-completed',
      {
        firstName: user.firstName,
        amount: withdrawal.amount,
        method: withdrawal.method,
        processedAt: new Date(withdrawal.processedAt).toLocaleString(),
      }
    );
  }

  /**
   * Send task completion notification
   */
  async sendTaskCompletionEmail(user, task, earnings) {
    return this.send(
      user.email,
      'Task Completed - Earnings Added',
      'task-completion',
      {
        firstName: user.firstName,
        taskTitle: task.title || `${task.type} task on ${task.platform}`,
        earnings,
        newBalance: user.balance,
        tasksUrl: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/tasks`,
      }
    );
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, resetToken) {
    return this.send(
      user.email,
      'Reset Your Password',
      'password-reset',
      {
        firstName: user.firstName,
        resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/reset-password?token=${resetToken}`,
        expiresIn: '1 hour',
      }
    );
  }

  /**
   * Send generic notification email
   */
  async sendNotification(user, subject, message, actionUrl = null, actionText = null) {
    return this.send(
      user.email,
      subject,
      'notification',
      {
        firstName: user.firstName,
        message,
        actionUrl,
        actionText,
      }
    );
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
