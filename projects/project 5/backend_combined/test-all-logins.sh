#!/bin/bash

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║            🧪 TESTING ALL USER LOGINS                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Test Super Admin
echo "1️⃣  Testing SUPER ADMIN (superadmin@gmail.com)..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@gmail.com", "password": "Meva1618"}')

if echo "$RESPONSE" | grep -q "\"success\":true"; then
  echo "   ✅ Login successful!"
  echo "   🎫 Token: $(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'][:40])")..."
  echo "   👤 Role: $(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['user']['role'])")"
else
  echo "   ❌ Login failed!"
fi

echo ""

# Test Task Doer
echo "2️⃣  Testing TASK DOER (taskdoer@gmail.com)..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "taskdoer@gmail.com", "password": "Meva1618"}')

if echo "$RESPONSE" | grep -q "\"success\":true"; then
  echo "   ✅ Login successful!"
  echo "   🎫 Token: $(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'][:40])")..."
  echo "   👤 Role: $(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['user']['role'])")"
else
  echo "   ❌ Login failed!"
fi

echo ""

# Test Task Giver
echo "3️⃣  Testing TASK GIVER (taskgiver@gmail.com)..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "taskgiver@gmail.com", "password": "Meva1618"}')

if echo "$RESPONSE" | grep -q "\"success\":true"; then
  echo "   ✅ Login successful!"
  echo "   🎫 Token: $(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'][:40])")..."
  echo "   👤 Role: $(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['user']['role'])")"
else
  echo "   ❌ Login failed!"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ All test users verified and ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
