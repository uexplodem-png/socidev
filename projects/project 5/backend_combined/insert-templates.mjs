import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'social_developer'
});

const templates = [
  {
    name: 'Welcome Email',
    key: 'welcome',
    subject: 'Welcome to Social Developer! 🎉',
    bodyHtml: '<html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f7fa"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 0"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1)"><tr><td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:50px 40px;text-align:center;border-radius:12px 12px 0 0"><h1 style="color:#ffffff;margin:0;font-size:32px">Welcome! 🎉</h1></td></tr><tr><td style="padding:40px"><h2 style="color:#333333;font-size:24px;margin:0 0 20px 0">Hi {{firstName}},</h2><p style="color:#555555;font-size:16px;line-height:1.8;margin:0 0 20px 0">Welcome to Social Developer! We are excited to have you join our community.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0"><tr><td align="center"><a href="{{loginUrl}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:600">Get Started</a></td></tr></table></td></tr><tr><td style="background-color:#f8f9fa;padding:20px;text-align:center;border-radius:0 0 12px 12px"><p style="color:#999999;font-size:13px;margin:0">© 2025 Social Developer. All rights reserved.</p></td></tr></table></td></tr></table></body></html>',
    bodyText: 'Welcome {{firstName}}! Get started at {{loginUrl}}',
    variables: '["firstName","loginUrl"]',
    category: 'transactional'
  },
  {
    name: 'Order Confirmation',
    key: 'order_confirmation',
    subject: 'Order #{{orderNumber}} Confirmed ✅',
    bodyHtml: '<html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f7fa"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 0"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1)"><tr><td style="background:linear-gradient(135deg,#4facfe 0%,#00f2fe 100%);padding:50px 40px;text-align:center;border-radius:12px 12px 0 0"><h1 style="color:#ffffff;margin:0;font-size:32px">Order Confirmed! ✅</h1></td></tr><tr><td style="padding:40px"><h2 style="color:#333333;font-size:24px;margin:0 0 20px 0">Hi {{firstName}},</h2><p style="color:#555555;font-size:16px;line-height:1.8;margin:0 0 20px 0">Your order #{{orderNumber}} has been confirmed and is being processed.</p><table width="100%" style="background-color:#f8f9fa;border-radius:8px;padding:20px;margin:20px 0"><tr><td><p style="margin:5px 0;color:#555"><strong>Service:</strong> {{serviceName}}</p><p style="margin:5px 0;color:#555"><strong>Platform:</strong> {{platform}}</p><p style="margin:5px 0;color:#555"><strong>Quantity:</strong> {{quantity}}</p><p style="margin:5px 0;color:#4facfe;font-size:18px"><strong>Amount:</strong> ${{amount}}</p></td></tr></table><table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0"><tr><td align="center"><a href="{{orderUrl}}" style="display:inline-block;background:linear-gradient(135deg,#4facfe 0%,#00f2fe 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:600">Track Order</a></td></tr></table></td></tr><tr><td style="background-color:#f8f9fa;padding:20px;text-align:center;border-radius:0 0 12px 12px"><p style="color:#999999;font-size:13px;margin:0">© 2025 Social Developer. All rights reserved.</p></td></tr></table></td></tr></table></body></html>',
    bodyText: 'Order #{{orderNumber}} confirmed! Service: {{serviceName}}, Amount: ${{amount}}. Track: {{orderUrl}}',
    variables: '["firstName","orderNumber","serviceName","platform","quantity","amount","orderUrl"]',
    category: 'transactional'
  },
  {
    name: 'Test Email',
    key: 'test_email',
    subject: 'Test Email - {{siteName}}',
    bodyHtml: '<html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f7fa"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 0"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1)"><tr><td style="background:linear-gradient(135deg,#fa709a 0%,#fee140 100%);padding:50px 40px;text-align:center;border-radius:12px 12px 0 0"><h1 style="color:#ffffff;margin:0;font-size:32px">Test Email 📧</h1></td></tr><tr><td style="padding:40px"><h2 style="color:#333333;font-size:24px;margin:0 0 20px 0">Hello {{recipientName}}!</h2><p style="color:#555555;font-size:16px;line-height:1.8;margin:0 0 20px 0">This is a test email from {{siteName}}. If you are seeing this, the email system is working perfectly!</p><div style="background-color:#d1f2eb;border-left:4px solid #43e97b;border-radius:8px;padding:20px;margin:20px 0"><p style="color:#0c5149;margin:0;font-size:14px"><strong>✅ Email System Status:</strong> All systems operational!</p></div></td></tr><tr><td style="background-color:#f8f9fa;padding:20px;text-align:center;border-radius:0 0 12px 12px"><p style="color:#999999;font-size:13px;margin:0">© 2025 Social Developer. All rights reserved.</p></td></tr></table></td></tr></table></body></html>',
    bodyText: 'Test email from {{siteName}} to {{recipientName}}. Email system is working!',
    variables: '["siteName","recipientName"]',
    category: 'notification'
  }
];

for (const t of templates) {
  await connection.query(
    'INSERT INTO email_templates (name, `key`, subject, body_html, body_text, variables, category, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())',
    [t.name, t.key, t.subject, t.bodyHtml, t.bodyText, t.variables, t.category]
  );
}

console.log('✅ 3 professional email templates inserted successfully');
await connection.end();
