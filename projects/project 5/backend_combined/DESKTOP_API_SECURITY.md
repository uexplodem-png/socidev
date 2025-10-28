# Desktop API Security Documentation

## Overview
High-security API system for desktop applications to interact with the platform. Uses HMAC-SHA256 request signing, rate limiting, IP whitelisting, and timestamp-based replay attack prevention.

## Security Features

### 1. **API Key Authentication**
- API keys are SHA256 hashed before storage
- API secrets are stored encrypted
- Keys are never shown after creation

### 2. **Request Signing (HMAC-SHA256)**
- Every request must be signed with the API secret
- Signature format: `HMAC-SHA256(method:path:timestamp:body, secret)`
- Prevents request tampering

### 3. **Replay Attack Prevention**
- Requests must include a timestamp header
- Requests older than 5 minutes are rejected
- Prevents replay of captured requests

### 4. **Rate Limiting**
- Default: 1000 requests per hour per API key
- Configurable per key
- Returns 429 status when exceeded

### 5. **IP Whitelisting**
- Optional per-key IP restrictions
- Supports CIDR notation (e.g., 192.168.1.0/24)
- Blocks requests from non-whitelisted IPs

### 6. **Permissions System**
- Granular permissions per API key:
  - `getTasks`: Fetch available tasks
  - `getTaskDetails`: Get task details
  - `getInProgressTasks`: View tasks in progress
  - `completeTask`: Mark tasks as complete
  - `uploadScreenshot`: Upload proof screenshots

### 7. **Key Expiration**
- Optional expiration dates
- Automatically reject expired keys

### 8. **Key Status Management**
- States: `active`, `suspended`, `revoked`
- Only active keys can make requests

## API Endpoints

### Desktop API Endpoints (Require Desktop Authentication)

#### Base URL: `/api/desktop`

**Authentication Headers Required:**
```
X-API-Key: sk_abc123...
X-Signature: hmac_sha256_signature
X-Timestamp: 1234567890000
```

---

#### 1. Get Available Tasks
```http
GET /api/desktop/tasks/available?limit=10&platform=instagram&service_type=follow
```

**Query Parameters:**
- `limit` (optional): Number of tasks to return (default: 10)
- `platform` (optional): Filter by platform (instagram, youtube, etc.)
- `service_type` (optional): Filter by service type

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task-uuid",
        "orderId": "order-uuid",
        "platform": "instagram",
        "serviceType": "follow",
        "targetUrl": "https://instagram.com/username",
        "targetUsername": "username",
        "instructions": "Follow this account",
        "reward": 0.50,
        "status": "pending",
        "createdAt": "2025-10-28T00:00:00Z",
        "order": { ... }
      }
    ],
    "count": 10,
    "timestamp": "2025-10-28T00:00:00Z"
  }
}
```

---

#### 2. Get Task Details
```http
GET /api/desktop/tasks/:taskId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "task-uuid",
      "orderId": "order-uuid",
      "platform": "instagram",
      "serviceType": "follow",
      "targetUrl": "https://instagram.com/username",
      "targetUsername": "username",
      "instructions": "Follow this account and screenshot",
      "reward": 0.50,
      "status": "pending",
      "requirements": { "screenshot": true },
      "createdAt": "2025-10-28T00:00:00Z",
      "order": { ... }
    }
  }
}
```

---

#### 3. Get In-Progress Tasks
```http
GET /api/desktop/tasks/in-progress
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task-uuid",
        "orderId": "order-uuid",
        "platform": "instagram",
        "serviceType": "follow",
        "targetUrl": "https://instagram.com/username",
        "reward": 0.50,
        "status": "in_progress",
        "startedAt": "2025-10-28T00:00:00Z",
        "order": { ... }
      }
    ],
    "count": 5,
    "timestamp": "2025-10-28T00:00:00Z"
  }
}
```

---

#### 4. Start Task
```http
POST /api/desktop/tasks/:taskId/start
```

**Response:**
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "task-uuid",
      "status": "in_progress",
      "startedAt": "2025-10-28T00:00:00Z",
      "reward": 0.50
    },
    "message": "Task started successfully"
  }
}
```

---

#### 5. Complete Task
```http
POST /api/desktop/tasks/:taskId/complete
```

**Request Body:**
```json
{
  "screenshotUrl": "https://...",
  "notes": "Task completed successfully"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "task-uuid",
      "status": "pending_approval",
      "completedAt": "2025-10-28T00:00:00Z",
      "reward": 0.50
    },
    "message": "Task submitted for approval"
  }
}
```

---

#### 6. Health Check
```http
GET /api/desktop/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-10-28T00:00:00Z",
    "apiKeyId": "key-uuid",
    "userId": "user-uuid",
    "requestCount": 150
  }
}
```

---

### Key Management Endpoints (Require User Authentication)

#### Base URL: `/api/desktop-keys`

**Authentication:** Bearer token in Authorization header

---

#### 1. Create API Key
```http
POST /api/desktop-keys
```

**Request Body:**
```json
{
  "name": "My Desktop App",
  "permissions": {
    "getTasks": true,
    "getTaskDetails": true,
    "getInProgressTasks": true,
    "completeTask": true,
    "uploadScreenshot": true
  },
  "rateLimit": 1000,
  "ipWhitelist": ["192.168.1.100", "10.0.0.0/24"],
  "expiresAt": "2026-01-01T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "key-uuid",
    "name": "My Desktop App",
    "apiKey": "sk_abc123...",
    "apiSecret": "secret_xyz...",
    "permissions": { ... },
    "rateLimit": 1000,
    "ipWhitelist": ["192.168.1.100"],
    "status": "active",
    "createdAt": "2025-10-28T00:00:00Z"
  },
  "message": "API key created successfully. Save the API key and secret securely - they will not be shown again!"
}
```

**⚠️ Important:** The `apiKey` and `apiSecret` are only shown once during creation. Store them securely!

---

#### 2. List API Keys
```http
GET /api/desktop-keys
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "key-uuid",
      "name": "My Desktop App",
      "permissions": { ... },
      "rateLimit": 1000,
      "status": "active",
      "lastUsedAt": "2025-10-28T00:00:00Z",
      "lastUsedIp": "192.168.1.100",
      "requestCount": 150,
      "createdAt": "2025-10-28T00:00:00Z"
    }
  ]
}
```

---

#### 3. Get API Key Stats
```http
GET /api/desktop-keys/:keyId
```

---

#### 4. Update API Key
```http
PUT /api/desktop-keys/:keyId
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "permissions": { ... },
  "rateLimit": 2000,
  "ipWhitelist": ["192.168.1.0/24"],
  "status": "active"
}
```

---

#### 5. Revoke API Key
```http
POST /api/desktop-keys/:keyId/revoke
```

---

#### 6. Delete API Key
```http
DELETE /api/desktop-keys/:keyId
```

---

## Desktop App Implementation Example

```javascript
import crypto from 'crypto';

class DesktopApiClient {
  constructor(apiKey, apiSecret, baseUrl = 'http://localhost:3000/api/desktop') {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = baseUrl;
  }

  // Generate HMAC signature
  generateSignature(method, path, timestamp, body = '') {
    const message = `${method}:${path}:${timestamp}:${body}`;
    return crypto.createHmac('sha256', this.apiSecret)
      .update(message)
      .digest('hex');
  }

  // Make authenticated request
  async request(method, path, body = null) {
    const timestamp = Date.now().toString();
    const bodyString = body ? JSON.stringify(body) : '';
    const signature = this.generateSignature(method, path, timestamp, bodyString);

    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      'X-Signature': signature,
      'X-Timestamp': timestamp
    };

    const options = {
      method,
      headers,
      body: body ? bodyString : undefined
    };

    const response = await fetch(`${this.baseUrl}${path}`, options);
    return await response.json();
  }

  // API Methods
  async getAvailableTasks(options = {}) {
    const query = new URLSearchParams(options).toString();
    const path = `/tasks/available${query ? '?' + query : ''}`;
    return await this.request('GET', path);
  }

  async getTaskDetails(taskId) {
    return await this.request('GET', `/tasks/${taskId}`);
  }

  async getInProgressTasks() {
    return await this.request('GET', '/tasks/in-progress');
  }

  async startTask(taskId) {
    return await this.request('POST', `/tasks/${taskId}/start`);
  }

  async completeTask(taskId, data) {
    return await this.request('POST', `/tasks/${taskId}/complete`, data);
  }

  async healthCheck() {
    return await this.request('GET', '/health');
  }
}

// Usage Example
const client = new DesktopApiClient(
  'sk_abc123...',
  'secret_xyz...'
);

// Get available tasks
const tasks = await client.getAvailableTasks({ limit: 10, platform: 'instagram' });
 tasks:', tasks.data.tasks);

// Start a task
const started = await client.startTask('task-uuid');
console.log('Task started:', started.data);

// Complete a task
const completed = await client.completeTask('task-uuid', {
  screenshotUrl: 'https://...',
  notes: 'Task completed'
});
console.log('Task completed:', completed.data);
```

---

## Security Best Practices

### For Users:
1. ✅ Store API keys and secrets securely (use environment variables)
2. ✅ Never commit API keys to version control
3. ✅ Use IP whitelisting when possible
4. ✅ Set appropriate rate limits
5. ✅ Revoke unused or compromised keys immediately
6. ✅ Use key expiration for temporary access
7. ✅ Monitor key usage and request counts
8. ✅ Rotate keys periodically

### For Developers:
1. ✅ Always verify signatures
2. ✅ Validate timestamps (prevent replay attacks)
3. ✅ Implement rate limiting
4. ✅ Log all authentication failures
5. ✅ Use HTTPS in production
6. ✅ Never log API secrets
7. ✅ Implement proper error handling

---

## Error Responses

### Authentication Errors
```json
{
  "success": false,
  "error": "Invalid API key"
}
```

### Permission Errors
```json
{
  "success": false,
  "error": "Permission denied",
  "required": "completeTask"
}
```

### Rate Limit Errors
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "limit": 1000,
  "resetAt": "2025-10-28T01:00:00Z"
}
```

### Timestamp Errors
```json
{
  "success": false,
  "error": "Request timestamp expired",
  "message": "Request must be made within 5 minutes"
}
```

---

## Database Schema

### Table: `desktop_api_keys`

```sql
CREATE TABLE desktop_api_keys (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  api_key VARCHAR(64) NOT NULL UNIQUE, -- SHA256 hashed
  api_secret VARCHAR(128) NOT NULL, -- Encrypted
  permissions JSON DEFAULT '{"getTasks": true, ...}',
  rate_limit INTEGER DEFAULT 1000,
  ip_whitelist JSON DEFAULT '[]',
  last_used_at TIMESTAMP,
  last_used_ip VARCHAR(255),
  request_count INTEGER DEFAULT 0,
  status ENUM('active', 'suspended', 'revoked') DEFAULT 'active',
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Testing

### Test Authentication
```bash
# Generate signature manually
timestamp=$(date +%s)000
message="GET:/api/desktop/health:${timestamp}:"
signature=$(echo -n "$message" | openssl dgst -sha256 -hmac "$API_SECRET" | cut -d' ' -f2)

# Make request
curl -X GET "http://localhost:3000/api/desktop/health" \
  -H "X-API-Key: $API_KEY" \
  -H "X-Signature: $signature" \
  -H "X-Timestamp: $timestamp"
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-10-28T00:00:00.000Z",
    "apiKeyId": "key-uuid",
    "userId": "user-uuid",
    "requestCount": 1
  }
}
```

---

## Production Considerations

1. **Use Redis for Rate Limiting**: Current implementation uses in-memory Map. Use Redis in production for distributed rate limiting.

2. **HTTPS Only**: Enforce HTTPS in production to protect API keys and secrets in transit.

3. **Key Rotation**: Implement automatic key rotation policies.

4. **Audit Logging**: Log all API key usage for security auditing.

5. **DDoS Protection**: Use a CDN or DDoS protection service.

6. **API Versioning**: Version the API for backward compatibility.

---

## Support

For issues or questions, contact the development team or refer to the main documentation.
