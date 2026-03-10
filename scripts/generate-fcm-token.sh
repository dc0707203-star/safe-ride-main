#!/bin/bash

# Firebase Access Token Generator
# This script generates a short-lived access token for Firebase Cloud Messaging

# Usage: ./scripts/generate-fcm-token.sh <path-to-service-account-key.json>

if [ $# -eq 0 ]; then
  echo "Firebase FCM Access Token Generator"
  echo "===================================="
  echo ""
  echo "Usage: $0 <path-to-service-account-key.json>"
  echo ""
  echo "Steps to get your service account key:"
  echo "1. Go to Firebase Console (console.firebase.google.com)"
  echo "2. Select your project"
  echo "3. Go to Project Settings → Service Accounts"
  echo "4. Click 'Generate New Private Key'"
  echo "5. Save the downloaded JSON file"
  echo ""
  echo "Then run: $0 /path/to/downloaded/key.json"
  exit 1
fi

SERVICE_ACCOUNT_FILE="$1"

if [ ! -f "$SERVICE_ACCOUNT_FILE" ]; then
  echo "Error: File '$SERVICE_ACCOUNT_FILE' not found"
  exit 1
fi

# Extract necessary values from service account key
PRIVATE_KEY=$(jq -r '.private_key' "$SERVICE_ACCOUNT_FILE")
PROJECT_ID=$(jq -r '.project_id' "$SERVICE_ACCOUNT_FILE")
CLIENT_EMAIL=$(jq -r '.client_email' "$SERVICE_ACCOUNT_FILE")

if [ -z "$PRIVATE_KEY" ] || [ "$PRIVATE_KEY" == "null" ]; then
  echo "Error: Could not extract private_key from service account file"
  exit 1
fi

echo "Firebase Project ID: $PROJECT_ID"
echo "Service Account Email: $CLIENT_EMAIL"
echo ""
echo "Generating access token..."
echo ""

# Create JWT header
HEADER=$(echo -n '{"alg":"RS256","typ":"JWT"}' | base64 -w 0 | tr '+/' '-_' | tr -d '=')

# Create JWT claims
NOW=$(date +%s)
EXP=$((NOW + 3600))
CLAIMS=$(echo -n "{
  \"iss\":\"$CLIENT_EMAIL\",
  \"scope\":\"https://www.googleapis.com/auth/firebase.messaging\",
  \"aud\":\"https://oauth2.googleapis.com/token\",
  \"exp\":$EXP,
  \"iat\":$NOW
}" | base64 -w 0 | tr '+/' '-_' | tr -d '=')

# Create signature
SIGNATURE=$(echo -n "$HEADER.$CLAIMS" | openssl dgst -sha256 -sign <(echo "$PRIVATE_KEY") | base64 -w 0 | tr '+/' '-_' | tr -d '=')

# Create JWT
JWT="$HEADER.$CLAIMS.$SIGNATURE"

# Exchange JWT for access token
RESPONSE=$(curl -s -X POST "https://oauth2.googleapis.com/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=$JWT")

ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.access_token')

if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "Error: Could not generate access token"
  echo "Response: $RESPONSE"
  exit 1
fi

echo "✓ Access token generated successfully!"
echo ""
echo "Add these to your environment:"
echo ""
echo "FIREBASE_PROJECT_ID=$PROJECT_ID"
echo "FIREBASE_ACCESS_TOKEN=$ACCESS_TOKEN"
echo ""
echo "Expiration: $(date -d @$EXP)"
echo ""
echo "Note: This token expires in 1 hour. For production, use a more robust token refresh mechanism."
