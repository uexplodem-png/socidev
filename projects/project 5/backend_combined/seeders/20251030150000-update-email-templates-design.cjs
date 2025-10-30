'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    // Modern, professional email templates with responsive design
    const templates = [
      {
        name: 'Welcome Email',
        key: 'welcome',
        subject: 'Welcome to {{siteName}} - Let\'s Get Started! 🎉',
        bodyHtml: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to {{siteName}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 0;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                    <!-- Header with Gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 40px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">
                                Welcome to {{siteName}}! 🎉
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">
                                Hi {{firstName}},
                            </h2>
                            <p style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                                We're thrilled to have you join our community! Your account has been successfully created and you're now ready to explore all the amazing features we have to offer.
                            </p>
                            
                            <!-- Features Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin: 30px 0; padding: 20px;">
                                <tr>
                                    <td>
                                        <p style="color: #667eea; font-weight: 600; margin: 0 0 15px 0; font-size: 16px;">✨ What's Next?</p>
                                        <ul style="color: #555555; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                            <li style="margin-bottom: 10px;">Complete your profile to get personalized recommendations</li>
                                            <li style="margin-bottom: 10px;">Browse available tasks and services</li>
                                            <li style="margin-bottom: 10px;">Connect your social media accounts</li>
                                            <li>Start earning with your first order</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{loginUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                                            Get Started Now
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #777777; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                                If you have any questions, our support team is always here to help. Just reply to this email or visit our help center.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="color: #999999; font-size: 13px; margin: 0 0 10px 0;">
                                &copy; {{currentYear}} {{siteName}}. All rights reserved.
                            </p>
                            <p style="color: #999999; font-size: 13px; margin: 0;">
                                Need help? Contact us at <a href="mailto:{{supportEmail}}" style="color: #667eea; text-decoration: none;">{{supportEmail}}</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `,
        bodyText: `Welcome to {{siteName}}!\n\nHi {{firstName}},\n\nWe're thrilled to have you join our community! Your account has been successfully created.\n\nGet started: {{loginUrl}}\n\nBest regards,\nThe {{siteName}} Team`,
        variables: JSON.stringify(['firstName', 'siteName', 'loginUrl', 'supportEmail', 'currentYear']),
        category: 'transactional',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Password Reset',
        key: 'password_reset',
        subject: 'Reset Your {{siteName}} Password 🔐',
        bodyHtml: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 50px 40px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">
                                🔐 Password Reset
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">
                                Hi {{firstName}},
                            </h2>
                            <p style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                                We received a request to reset your password for your {{siteName}} account. Don't worry, we've got you covered!
                            </p>
                            
                            <!-- Security Notice -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 8px; margin: 20px 0; padding: 20px;">
                                <tr>
                                    <td>
                                        <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.6;">
                                            <strong>⚠️ Important:</strong> This link will expire in {{expiresIn}}. If you didn't request this reset, please ignore this email or contact our support team.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{resetUrl}}" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);">
                                            Reset My Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #777777; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                                If the button doesn't work, copy and paste this link into your browser:
                            </p>
                            <p style="color: #667eea; font-size: 13px; word-break: break-all; background-color: #f8f9fa; padding: 12px; border-radius: 6px; margin: 10px 0 0 0;">
                                {{resetUrl}}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="color: #999999; font-size: 13px; margin: 0 0 10px 0;">
                                &copy; {{currentYear}} {{siteName}}. All rights reserved.
                            </p>
                            <p style="color: #999999; font-size: 13px; margin: 0;">
                                Need help? Contact us at <a href="mailto:{{supportEmail}}" style="color: #667eea; text-decoration: none;">{{supportEmail}}</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `,
        bodyText: `Reset Your Password\n\nHi {{firstName}},\n\nWe received a request to reset your password. Click the link below to reset it:\n\n{{resetUrl}}\n\nThis link expires in {{expiresIn}}.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nThe {{siteName}} Team`,
        variables: JSON.stringify(['firstName', 'resetUrl', 'expiresIn', 'siteName', 'supportEmail', 'currentYear']),
        category: 'transactional',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Order Confirmation',
        key: 'order_confirmation',
        subject: 'Order Confirmed - #{{orderNumber}} ✅',
        bodyHtml: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 50px 40px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">
                                ✅ Order Confirmed!
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">
                                Hi {{firstName}},
                            </h2>
                            <p style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                                Great news! Your order has been confirmed and is now being processed. We'll keep you updated every step of the way.
                            </p>
                            
                            <!-- Order Details -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin: 30px 0; padding: 25px;">
                                <tr>
                                    <td>
                                        <p style="color: #4facfe; font-weight: 600; margin: 0 0 20px 0; font-size: 18px;">📦 Order Details</p>
                                        
                                        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
                                            <tr>
                                                <td style="color: #777777; font-size: 14px; border-bottom: 1px solid #e9ecef; padding: 12px 0;">Order Number:</td>
                                                <td style="color: #333333; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e9ecef; padding: 12px 0; text-align: right;">#{{orderNumber}}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #777777; font-size: 14px; border-bottom: 1px solid #e9ecef; padding: 12px 0;">Service:</td>
                                                <td style="color: #333333; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e9ecef; padding: 12px 0; text-align: right;">{{serviceName}}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #777777; font-size: 14px; border-bottom: 1px solid #e9ecef; padding: 12px 0;">Platform:</td>
                                                <td style="color: #333333; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e9ecef; padding: 12px 0; text-align: right;">{{platform}}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #777777; font-size: 14px; border-bottom: 1px solid #e9ecef; padding: 12px 0;">Quantity:</td>
                                                <td style="color: #333333; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e9ecef; padding: 12px 0; text-align: right;">{{quantity}}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #777777; font-size: 14px; padding: 12px 0;">Total Amount:</td>
                                                <td style="color: #4facfe; font-size: 18px; font-weight: 700; padding: 12px 0; text-align: right;">{{amount}}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Status Timeline -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td>
                                        <p style="color: #333333; font-weight: 600; margin: 0 0 15px 0; font-size: 16px;">📊 Order Status</p>
                                        <table width="100%" cellpadding="8" cellspacing="0">
                                            <tr>
                                                <td style="width: 30px; vertical-align: top;">
                                                    <div style="width: 24px; height: 24px; background-color: #4facfe; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">✓</div>
                                                </td>
                                                <td style="color: #555555; font-size: 14px; line-height: 1.6;">
                                                    <strong>Order Received</strong><br>
                                                    <span style="color: #999999; font-size: 13px;">Your order has been confirmed</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 30px; vertical-align: top; padding-top: 0;">
                                                    <div style="width: 2px; height: 30px; background-color: #e9ecef; margin-left: 11px;"></div>
                                                </td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td style="width: 30px; vertical-align: top;">
                                                    <div style="width: 24px; height: 24px; background-color: #e9ecef; border-radius: 50%;"></div>
                                                </td>
                                                <td style="color: #999999; font-size: 14px; line-height: 1.6;">
                                                    <strong>Processing</strong><br>
                                                    <span style="font-size: 13px;">We're working on your order</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 30px; vertical-align: top; padding-top: 0;">
                                                    <div style="width: 2px; height: 30px; background-color: #e9ecef; margin-left: 11px;"></div>
                                                </td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td style="width: 30px; vertical-align: top;">
                                                    <div style="width: 24px; height: 24px; background-color: #e9ecef; border-radius: 50%;"></div>
                                                </td>
                                                <td style="color: #999999; font-size: 14px; line-height: 1.6;">
                                                    <strong>Completed</strong><br>
                                                    <span style="font-size: 13px;">Order delivered successfully</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{orderUrl}}" style="display: inline-block; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);">
                                            Track Your Order
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="color: #999999; font-size: 13px; margin: 0 0 10px 0;">
                                &copy; {{currentYear}} {{siteName}}. All rights reserved.
                            </p>
                            <p style="color: #999999; font-size: 13px; margin: 0;">
                                Need help? Contact us at <a href="mailto:{{supportEmail}}" style="color: #4facfe; text-decoration: none;">{{supportEmail}}</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `,
        bodyText: `Order Confirmed!\n\nHi {{firstName}},\n\nYour order #{{orderNumber}} has been confirmed!\n\nOrder Details:\n- Service: {{serviceName}}\n- Platform: {{platform}}\n- Quantity: {{quantity}}\n- Amount: ${{amount}}\n\nTrack your order: {{orderUrl}}\n\nBest regards,\nThe {{siteName}} Team`,
        variables: JSON.stringify(['firstName', 'orderNumber', 'serviceName', 'platform', 'quantity', 'amount', 'orderUrl', 'siteName', 'supportEmail', 'currentYear']),
        category: 'transactional',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Withdrawal Approved',
        key: 'withdrawal_approved',
        subject: 'Withdrawal Approved - ${{amount}} 💰',
        bodyHtml: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Withdrawal Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 50px 40px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">
                                💰 Withdrawal Approved!
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">
                                Hi {{firstName}},
                            </h2>
                            <p style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                                Great news! Your withdrawal request has been approved and the funds are being processed. You should receive your payment shortly.
                            </p>
                            
                            <!-- Amount Highlight -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); border-radius: 12px; padding: 30px;">
                                        <p style="color: #ffffff; font-size: 16px; margin: 0 0 10px 0; opacity: 0.9;">Withdrawal Amount</p>
                                        <p style="color: #ffffff; font-size: 48px; font-weight: 700; margin: 0;">
                                            ${{amount}}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Withdrawal Details -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin: 30px 0; padding: 25px;">
                                <tr>
                                    <td>
                                        <p style="color: #43e97b; font-weight: 600; margin: 0 0 20px 0; font-size: 18px;">📋 Withdrawal Details</p>
                                        
                                        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
                                            <tr>
                                                <td style="color: #777777; font-size: 14px; border-bottom: 1px solid #e9ecef; padding: 12px 0;">Payment Method:</td>
                                                <td style="color: #333333; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e9ecef; padding: 12px 0; text-align: right;">{{method}}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #777777; font-size: 14px; border-bottom: 1px solid #e9ecef; padding: 12px 0;">Status:</td>
                                                <td style="color: #43e97b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e9ecef; padding: 12px 0; text-align: right;">✓ Approved</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #777777; font-size: 14px; padding: 12px 0;">Processing Time:</td>
                                                <td style="color: #333333; font-size: 14px; font-weight: 600; padding: 12px 0; text-align: right;">{{processingTime}}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Info Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #d1f2eb; border-left: 4px solid #43e97b; border-radius: 8px; margin: 20px 0; padding: 20px;">
                                <tr>
                                    <td>
                                        <p style="color: #0c5149; margin: 0; font-size: 14px; line-height: 1.6;">
                                            <strong>💡 What's Next?</strong><br>
                                            Your payment is being processed and should arrive within the estimated time frame. You'll receive a confirmation once the transfer is complete.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{dashboardUrl}}" style="display: inline-block; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(67, 233, 123, 0.4);">
                                            View Transaction History
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="color: #999999; font-size: 13px; margin: 0 0 10px 0;">
                                &copy; {{currentYear}} {{siteName}}. All rights reserved.
                            </p>
                            <p style="color: #999999; font-size: 13px; margin: 0;">
                                Need help? Contact us at <a href="mailto:{{supportEmail}}" style="color: #43e97b; text-decoration: none;">{{supportEmail}}</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `,
        bodyText: `Withdrawal Approved!\n\nHi {{firstName}},\n\nGreat news! Your withdrawal of ${{amount}} has been approved.\n\nPayment Method: {{method}}\nStatus: Approved\nProcessing Time: {{processingTime}}\n\nView your transactions: {{dashboardUrl}}\n\nBest regards,\nThe {{siteName}} Team`,
        variables: JSON.stringify(['firstName', 'amount', 'method', 'processingTime', 'dashboardUrl', 'siteName', 'supportEmail', 'currentYear']),
        category: 'transactional',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Task Completed',
        key: 'task_completed',
        subject: 'Task Completed - You Earned ${{earnings}}! 🎉',
        bodyHtml: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Completed</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 50px 40px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">
                                🎉 Task Completed!
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">
                                Congratulations {{firstName}}!
                            </h2>
                            <p style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                                You've successfully completed your task and earned some money! Your earnings have been added to your balance.
                            </p>
                            
                            <!-- Earnings Highlight -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); border-radius: 12px; padding: 30px;">
                                        <p style="color: #ffffff; font-size: 16px; margin: 0 0 10px 0; opacity: 0.9;">You Earned</p>
                                        <p style="color: #ffffff; font-size: 48px; font-weight: 700; margin: 0;">
                                            ${{earnings}}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Task Details -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin: 30px 0; padding: 25px;">
                                <tr>
                                    <td>
                                        <p style="color: #fa709a; font-weight: 600; margin: 0 0 20px 0; font-size: 18px;">📝 Task Summary</p>
                                        
                                        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
                                            <tr>
                                                <td style="color: #777777; font-size: 14px; border-bottom: 1px solid #e9ecef; padding: 12px 0;">Task:</td>
                                                <td style="color: #333333; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e9ecef; padding: 12px 0; text-align: right;">{{taskName}}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #777777; font-size: 14px; border-bottom: 1px solid #e9ecef; padding: 12px 0;">Earnings:</td>
                                                <td style="color: #43e97b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e9ecef; padding: 12px 0; text-align: right;">+${{earnings}}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #777777; font-size: 14px; padding: 12px 0;">New Balance:</td>
                                                <td style="color: #fa709a; font-size: 18px; font-weight: 700; padding: 12px 0; text-align: right;">${{newBalance}}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Stats Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td style="width: 50%; padding-right: 10px;">
                                        <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; text-align: center;">
                                            <tr>
                                                <td>
                                                    <p style="color: #fa709a; font-size: 28px; font-weight: 700; margin: 0;">{{totalTasks}}</p>
                                                    <p style="color: #777777; font-size: 13px; margin: 5px 0 0 0;">Tasks Completed</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td style="width: 50%; padding-left: 10px;">
                                        <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; text-align: center;">
                                            <tr>
                                                <td>
                                                    <p style="color: #43e97b; font-size: 28px; font-weight: 700; margin: 0;">${{totalEarnings}}</p>
                                                    <p style="color: #777777; font-size: 13px; margin: 5px 0 0 0;">Total Earned</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Buttons -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{tasksUrl}}" style="display: inline-block; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: #ffffff; text-decoration: none; padding: 16px 30px; border-radius: 8px; font-size: 16px; font-weight: 600; margin: 0 5px; box-shadow: 0 4px 12px rgba(250, 112, 154, 0.4);">
                                            Find More Tasks
                                        </a>
                                        <a href="{{dashboardUrl}}" style="display: inline-block; background-color: #ffffff; color: #fa709a; text-decoration: none; padding: 16px 30px; border-radius: 8px; font-size: 16px; font-weight: 600; margin: 0 5px; border: 2px solid #fa709a;">
                                            View Dashboard
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="color: #999999; font-size: 13px; margin: 0 0 10px 0;">
                                &copy; {{currentYear}} {{siteName}}. All rights reserved.
                            </p>
                            <p style="color: #999999; font-size: 13px; margin: 0;">
                                Need help? Contact us at <a href="mailto:{{supportEmail}}" style="color: #fa709a; text-decoration: none;">{{supportEmail}}</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `,
        bodyText: `Task Completed!\n\nCongratulations {{firstName}}!\n\nYou've earned ${{earnings}} for completing your task!\n\nTask: {{taskName}}\nEarnings: ${{earnings}}\nNew Balance: ${{newBalance}}\n\nFind more tasks: {{tasksUrl}}\n\nBest regards,\nThe {{siteName}} Team`,
        variables: JSON.stringify(['firstName', 'earnings', 'taskName', 'newBalance', 'totalTasks', 'totalEarnings', 'tasksUrl', 'dashboardUrl', 'siteName', 'supportEmail', 'currentYear']),
        category: 'notification',
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    // Delete old templates and insert new ones
    await queryInterface.bulkDelete('email_templates', {
      key: ['welcome', 'password_reset', 'order_confirmation', 'withdrawal_approved', 'task_completed']
    });

    // Insert new templates with beautiful designs
    await queryInterface.bulkInsert('email_templates', templates);
  },

  down: async (queryInterface, Sequelize) => {
    // Revert to simple templates or delete
    await queryInterface.bulkDelete('email_templates', {
      key: ['welcome', 'password_reset', 'order_confirmation', 'withdrawal_approved', 'task_completed']
    });
  }
};
