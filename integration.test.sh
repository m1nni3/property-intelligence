#!/bin/bash
set -e

BASE_URL="${1:-http://localhost:8787}"
EMAIL="test@example.com"
PASSWORD="password123"

echo "🧪 Integration Tests for Property Intelligence API"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Login
echo "1️⃣  Testing /auth/login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  echo "$LOGIN_RESPONSE"
  exit 1
fi
echo "✅ Login successful, token: ${TOKEN:0:20}..."

# Test 2: Verify token
echo ""
echo "2️⃣  Testing /auth/verify..."
VERIFY=$(curl -s -X POST "$BASE_URL/auth/verify" \
  -H "Authorization: Bearer $TOKEN")
if echo "$VERIFY" | grep -q '"valid":true'; then
  echo "✅ Token verification successful"
else
  echo "❌ Token verification failed"
  echo "$VERIFY"
  exit 1
fi

# Test 3: Missing auth on /api/*
echo ""
echo "3️⃣  Testing missing auth on /api/properties..."
NO_AUTH=$(curl -s -X GET "$BASE_URL/api/properties")
if echo "$NO_AUTH" | grep -q '"error":"Missing authorization"'; then
  echo "✅ Correctly rejected unauthenticated request"
else
  echo "❌ Should have rejected unauthenticated request"
  echo "$NO_AUTH"
  exit 1
fi

# Test 4: List properties with pagination
echo ""
echo "4️⃣  Testing GET /api/properties with pagination..."
PROPS=$(curl -s -X GET "$BASE_URL/api/properties?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN")
if echo "$PROPS" | grep -q '"data"'; then
  echo "✅ Properties listed with pagination"
  echo "Response: $(echo $PROPS | cut -c1-100)..."
else
  echo "❌ Failed to list properties"
  echo "$PROPS"
  exit 1
fi

# Test 5: Create property (validation)
echo ""
echo "5️⃣  Testing POST /api/properties validation..."
INVALID=$(curl -s -X POST "$BASE_URL/api/properties" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"address": "123 Main"}')
if echo "$INVALID" | grep -q '"error"'; then
  echo "✅ Input validation working (rejected missing name)"
else
  echo "❌ Should have rejected invalid input"
  echo "$INVALID"
  exit 1
fi

# Test 6: Create property (valid)
echo ""
echo "6️⃣  Testing POST /api/properties (valid)..."
PROP_ID=$(date +%s%N | sha256sum | head -c 8)
CREATED=$(curl -s -X POST "$BASE_URL/api/properties" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Test Property $PROP_ID\"}")
if echo "$CREATED" | grep -q '"id"'; then
  echo "✅ Property created successfully"
  PROP_ID=$(echo $CREATED | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  echo "Property ID: $PROP_ID"
else
  echo "❌ Failed to create property"
  echo "$CREATED"
  exit 1
fi

# Test 7: Get property
echo ""
echo "7️⃣  Testing GET /api/properties/{id}..."
GET_PROP=$(curl -s -X GET "$BASE_URL/api/properties/$PROP_ID" \
  -H "Authorization: Bearer $TOKEN")
if echo "$GET_PROP" | grep -q '"name"'; then
  echo "✅ Property retrieved successfully"
else
  echo "❌ Failed to get property"
  echo "$GET_PROP"
  exit 1
fi

# Test 8: Update property
echo ""
echo "8️⃣  Testing PATCH /api/properties/{id}..."
UPDATED=$(curl -s -X PATCH "$BASE_URL/api/properties/$PROP_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}')
if echo "$UPDATED" | grep -q '"status":"active"'; then
  echo "✅ Property updated successfully"
else
  echo "❌ Failed to update property"
  echo "$UPDATED"
  exit 1
fi

# Test 9: Delete property
echo ""
echo "9️⃣  Testing DELETE /api/properties/{id}..."
DELETED=$(curl -s -X DELETE "$BASE_URL/api/properties/$PROP_ID" \
  -H "Authorization: Bearer $TOKEN")
if echo "$DELETED" | grep -q '"deleted":true'; then
  echo "✅ Property deleted successfully"
else
  echo "❌ Failed to delete property"
  echo "$DELETED"
  exit 1
fi

# Test 10: Verify soft delete
echo ""
echo "🔟 Testing soft delete (property should be hidden)..."
SOFT_DELETE=$(curl -s -X GET "$BASE_URL/api/properties/$PROP_ID" \
  -H "Authorization: Bearer $TOKEN")
if echo "$SOFT_DELETE" | grep -q '"error"'; then
  echo "✅ Soft delete working (property hidden from queries)"
else
  echo "❌ Soft delete failed (property still visible)"
  exit 1
fi

echo ""
echo "✅ All integration tests passed!"
