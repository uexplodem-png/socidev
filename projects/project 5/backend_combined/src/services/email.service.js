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
   * Send email verification email
   */
  async sendVerificationEmail(user, verificationUrl) {
    try {
      if (!this.transporter) {
        await this.initialize();
      }

      // Check if email notifications are enabled
      const emailEnabled = await settingsService.get('email.notifications.enabled', true);
      if (!emailEnabled) {
        logger.info(`Email notifications disabled. Skipping verification email to ${user.email}`);
        return { skipped: true };
      }

      const siteName = await settingsService.get('site.name', 'SociDev');
      
      // Use inline HTML template for verification email
      const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0;
      padding: 0;
      background-color: #f4f7fa;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: #ffffff;
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; 
      padding: 40px 30px; 
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content { 
      padding: 40px 30px; 
      background: #ffffff;
    }
    .content h2 {
      color: #333;
      font-size: 22px;
      margin: 0 0 20px 0;
    }
    .content p {
      color: #555;
      font-size: 16px;
      line-height: 1.8;
      margin: 0 0 20px 0;
    }
    .button { 
      display: inline-block; 
      padding: 14px 35px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; 
      text-decoration: none; 
      border-radius: 8px;
      margin: 25px 0;
      font-size: 16px;
      font-weight: 600;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .link-box {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      padding: 15px;
      margin: 20px 0;
      word-break: break-all;
    }
    .link-box a {
      color: #667eea;
      text-decoration: none;
      font-size: 14px;
    }
    .warning-box {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .warning-box strong {
      color: #856404;
      display: block;
      margin-bottom: 8px;
    }
    .warning-box p {
      color: #856404;
      margin: 5px 0;
      font-size: 14px;
    }
    .footer { 
      text-align: center; 
      padding: 30px; 
      font-size: 13px; 
      color: #6c757d;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
    }
    .footer p {
      margin: 5px 0;
    }
    @media only screen and (max-width: 600px) {
      .content { padding: 25px 20px; }
      .header { padding: 30px 20px; }
      .header h1 { font-size: 24px; }
      .content h2 { font-size: 20px; }
      .button { padding: 12px 28px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Verify Your Email</h1>
    </div>
    <div class="content">
      <h2>Hello ${user.firstName || 'there'}!</h2>
      <p>Thank you for registering with <strong>${siteName}</strong>. We're excited to have you on board!</p>
      <p>To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </div>
      <div class="link-box">
        <p style="margin: 0 0 10px 0; font-size: 13px; color: #6c757d;">Or copy and paste this link into your browser:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
      </div>
      <div class="warning-box">
        <strong>⚠️ Important:</strong>
        <p>• This verification link will expire in <strong>24 hours</strong></p>
        <p>• You must verify your email before you can log in</p>
        <p>• If you didn't create an account, please ignore this email</p>
      </div>
      <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
        Need help? Contact us at <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@socidev.com'}" style="color: #667eea;">${process.env.SUPPORT_EMAIL || 'support@socidev.com'}</a>
      </p>
    </div>
    <div class="footer">
      <p><strong>${siteName}</strong></p>
      <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

      const mailOptions = {
        from: `"${siteName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: user.email,
        subject: `Verify Your Email Address - ${siteName}`,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Verification email sent successfully to ${user.email}`, { messageId: info.messageId });
      return info;
    } catch (error) {
      logger.error(`Failed to send verification email to ${user.email}:`, error);
      throw error;
    }
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
