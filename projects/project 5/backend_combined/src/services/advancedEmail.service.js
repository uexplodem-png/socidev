import EmailTemplate from '../models/EmailTemplate.js';
import EmailLog from '../models/EmailLog.js';
import { User } from '../models/index.js';
import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

class AdvancedEmailService {
  constructor() {
    // Configure SMTP transporter
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS
      }
    });
  }

  /**
   * Replace variables in text with actual values
   */
  replaceVariables(text, variables = {}) {
    if (!text) return '';
    
    let result = text;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, variables[key] || '');
    });
    
    return result;
  }

  /**
   * Get template by key
   */
  async getTemplate(key) {
    const template = await EmailTemplate.findOne({
      where: { key, isActive: true }
    });
    
    if (!template) {
      throw new Error(`Email template '${key}' not found or inactive`);
    }
    
    return template;
  }

  /**
   * Send email using template
   */
  async sendTemplateEmail(templateKey, recipientEmail, variables = {}, sentBy = null) {
    try {
      const template = await this.getTemplate(templateKey);
      
      const subject = this.replaceVariables(template.subject, variables);
      const bodyHtml = this.replaceVariables(template.bodyHtml, variables);
      const bodyText = this.replaceVariables(template.bodyText, variables);
      
      const user = await User.findOne({
        where: { email: recipientEmail },
        attributes: ['id', 'firstName', 'lastName']
      });
      
      const emailLog = await EmailLog.create({
        templateId: template.id,
        recipientEmail,
        recipientName: user ? `${user.firstName} ${user.lastName}` : variables.firstName || null,
        recipientUserId: user?.id || null,
        subject,
        bodyHtml,
        bodyText,
        variablesUsed: variables,
        status: 'pending',
        sentBy,
        provider: 'smtp'
      });
      
      try {
        const info = await this.transporter.sendMail({
          from: `"${process.env.SMTP_FROM_NAME || 'SociDev'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
          to: recipientEmail,
          subject,
          html: bodyHtml,
          text: bodyText
        });
        
        await emailLog.update({
          status: 'sent',
          sentAt: new Date(),
          providerMessageId: info.messageId
        });
        
        logger.info('Email sent successfully', {
          emailLogId: emailLog.id,
          recipientEmail,
          templateKey
        });
        
        return emailLog;
      } catch (sendError) {
        await emailLog.update({
          status: 'failed',
          errorMessage: sendError.message
        });
        
        throw sendError;
      }
    } catch (error) {
      logger.error('Email service error', { error: error.message });
      throw error;
    }
  }

  /**
   * Send custom email without template
   */
  async sendCustomEmail(recipientEmail, subject, bodyHtml, bodyText = null, sentBy = null) {
    try {
      const user = await User.findOne({
        where: { email: recipientEmail },
        attributes: ['id', 'firstName', 'lastName']
      });
      
      const emailLog = await EmailLog.create({
        templateId: null,
        recipientEmail,
        recipientName: user ? `${user.firstName} ${user.lastName}` : null,
        recipientUserId: user?.id || null,
        subject,
        bodyHtml,
        bodyText,
        status: 'pending',
        sentBy,
        provider: 'smtp'
      });
      
      try {
        const info = await this.transporter.sendMail({
          from: `"${process.env.SMTP_FROM_NAME || 'SociDev'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
          to: recipientEmail,
          subject,
          html: bodyHtml,
          text: bodyText || bodyHtml.replace(/<[^>]*>/g, '')
        });
        
        await emailLog.update({
          status: 'sent',
          sentAt: new Date(),
          providerMessageId: info.messageId
        });
        
        return emailLog;
      } catch (sendError) {
        await emailLog.update({
          status: 'failed',
          errorMessage: sendError.message
        });
        
        throw sendError;
      }
    } catch (error) {
      logger.error('Custom email error', { error: error.message });
      throw error;
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(templateKey, recipients, sentBy = null) {
    const results = {
      success: 0,
      failed: 0,
      results: []
    };
    
    for (const recipient of recipients) {
      try {
        await this.sendTemplateEmail(
          templateKey,
          recipient.email,
          recipient.variables || {},
          sentBy
        );
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
    
    return results;
  }

  /**
   * Preview email with variables
   */
  async previewEmail(templateKey, variables = {}) {
    const template = await this.getTemplate(templateKey);
    
    return {
      subject: this.replaceVariables(template.subject, variables),
      bodyHtml: this.replaceVariables(template.bodyHtml, variables),
      bodyText: this.replaceVariables(template.bodyText, variables),
      variables: template.variables
    };
  }
}

export default new AdvancedEmailService();
