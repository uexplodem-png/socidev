const { fileURLToPath } = require('url');
const { dirname, resolve } = require('path');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

module.exports = {
  config: resolve(__dirname, 'config.json'),
  'models-path': resolve(__dirname, 'src/models'),
  'seeders-path': resolve(__dirname, 'seeders'),
  'migrations-path': resolve(__dirname, 'migrations')
};