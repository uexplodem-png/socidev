import crypto from 'crypto';
import DesktopApiKey from '../models/DesktopApiKey.js';
import logger from '../config/logger.js';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map();

// Clean up rate limit store every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.resetTime > 3600000) { // 1 hour
      rateLimitStore.delete(key);
    }
  }
}, 3600000);

export const authenticateDesktopApi = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];
    const clientIp = req.ip || req.connection.remoteAddress;

    // Validate required headers
    if (!apiKey || !signature || !timestamp) {
      return res.status(401).json({
        success: false,
        error: 'Missing required authentication headers',
        required: ['x-api-key', 'x-signature', 'x-timestamp']
      });
    }

    // Validate timestamp (prevent replay attacks)
    const now = Date.now();
    const requestTime = parseInt(timestamp);
    const timeDiff = Math.abs(now - requestTime);
    
    if (timeDiff > 300000) { // 5 minutes
      return res.status(401).json({
        success: false,
        error: 'Request timestamp expired',
        message: 'Request must be made within 5 minutes'
      });
    }

    // Hash the provided API key
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Find API key in database
    const apiKeyRecord = await DesktopApiKey.findOne({
      where: { apiKey: hashedKey }
    });

    if (!apiKeyRecord) {
      logger.warn('Invalid API key attempt', { apiKey: apiKey.substring(0, 10) + '...', ip: clientIp });
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    // Check if API key is active
    if (apiKeyRecord.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'API key is not active',
        status: apiKeyRecord.status
      });
    }

    // Check expiration
    if (apiKeyRecord.expiresAt && new Date(apiKeyRecord.expiresAt) < new Date()) {
      return res.status(403).json({
        success: false,
        error: 'API key has expired'
      });
    }

    // Check IP whitelist
    if (apiKeyRecord.ipWhitelist && apiKeyRecord.ipWhitelist.length > 0) {
      const isWhitelisted = apiKeyRecord.ipWhitelist.some(ip => {
        if (ip.includes('/')) {
          // CIDR notation support
          return isIpInCIDR(clientIp, ip);
        }
        return ip === clientIp;
      });

      if (!isWhitelisted) {
        logger.warn('IP not whitelisted', { ip: clientIp, userId: apiKeyRecord.userId });
        return res.status(403).json({
          success: false,
          error: 'IP address not whitelisted'
        });
      }
    }

    // Verify signature
    const method = req.method;
    const path = req.path;
    const body = req.body ? JSON.stringify(req.body) : '';
    
    const expectedSignature = apiKeyRecord.generateSignature(method, path, timestamp, body);
    
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      logger.warn('Invalid signature', { userId: apiKeyRecord.userId, ip: clientIp });
      return res.status(401).json({
        success: false,
        error: 'Invalid request signature'
      });
    }

    // Rate limiting
    const rateLimitKey = `${apiKeyRecord.id}:${Math.floor(now / 3600000)}`;
    let rateLimitData = rateLimitStore.get(rateLimitKey);

    if (!rateLimitData) {
      rateLimitData = {
        count: 0,
        resetTime: Math.floor(now / 3600000) * 3600000 + 3600000
      };
      rateLimitStore.set(rateLimitKey, rateLimitData);
    }

    rateLimitData.count++;

    if (rateLimitData.count > apiKeyRecord.rateLimit) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        limit: apiKeyRecord.rateLimit,
        resetAt: new Date(rateLimitData.resetTime).toISOString()
      });
    }

    // Update last used info
    await apiKeyRecord.update({
      lastUsedAt: new Date(),
      lastUsedIp: clientIp,
      requestCount: apiKeyRecord.requestCount + 1
    });

    // Attach API key info to request
    req.apiKey = apiKeyRecord;
    req.userId = apiKeyRecord.userId;

    next();
  } catch (error) {
    logger.error('Desktop API authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Permission check middleware
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    if (!req.apiKey.permissions[permission]) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied',
        required: permission
      });
    }

    next();
  };
};

// Helper function to check if IP is in CIDR range
function isIpInCIDR(ip, cidr) {
  const [range, bits] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);
  
  const ipNum = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
  const rangeNum = range.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
  
  return (ipNum & mask) === (rangeNum & mask);
}
