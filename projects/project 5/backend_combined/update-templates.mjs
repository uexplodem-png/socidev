import mysql from 'mysql2/promise';
import fs from 'fs';

const templates = [
  {
    name: 'Welcome Email',
    key: 'welcome',
    subject: 'Welcome to {{siteName}} - Let\\'s Get Started! 🎉',
    bodyHtml: fs.readFileSync('./templates_html/welcome.html', 'utf8'),
    bodyText: 'Welcome to {{siteName}}!\\n\\nHi {{firstName}},\\n\\nWe\\'re thrilled to have you join our community! Your account has been successfully created.\\n\\nGet started: {{loginUrl}}\\n\\nBest regards,\\nThe {{siteName}} Team',
    variables: '["firstName","siteName","loginUrl","supportEmail","currentYear"]',
    category: 'transactional',
    isActive: 1
  }
];

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'social_developer'
});

for (const template of templates) {
  await connection.query(
    'INSERT INTO email_templates (name, `key`, subject, body_html, body_text, variables, category, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
    [template.name, template.key, template.subject, template.bodyHtml, template.bodyText, template.variables, template.category, template.isActive]
  );
}

console.log('✅ Templates updated successfully');
await connection.end();
