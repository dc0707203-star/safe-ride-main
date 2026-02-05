#!/bin/bash

# Firebase Credentials Setup Script
# This script helps you format and add Firebase credentials to your environment variables

set -e

echo "================================================"
echo "Firebase Credentials Setup for Safe Ride"
echo "================================================"
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "⚠️  jq is not installed. Please install it to use this script:"
    echo "   Ubuntu/Debian: sudo apt-get install jq"
    echo "   macOS: brew install jq"
    echo ""
    echo "Alternatively, you can manually set the environment variables."
    exit 1
fi

# Prompt for the service account JSON file path
read -p "Enter the path to your Firebase service account JSON file: " SERVICE_ACCOUNT_PATH

if [ ! -f "$SERVICE_ACCOUNT_PATH" ]; then
    echo "❌ File not found: $SERVICE_ACCOUNT_PATH"
    exit 1
fi

# Validate JSON
if ! jq . "$SERVICE_ACCOUNT_PATH" > /dev/null 2>&1; then
    echo "❌ Invalid JSON file"
    exit 1
fi

# Extract project ID
PROJECT_ID=$(jq -r '.project_id' "$SERVICE_ACCOUNT_PATH")
echo "✓ Firebase Project ID: $PROJECT_ID"

# Create escaped JSON for environment variable
ESCAPED_JSON=$(jq -c . "$SERVICE_ACCOUNT_PATH" | sed 's/"/\\"/g')

echo ""
echo "================================================"
echo "Environment Variables to Set:"
echo "================================================"
echo ""
echo "For supabase/.env.local (Local Development):"
echo "---"
echo "FIREBASE_PROJECT_ID=$PROJECT_ID"
echo "FIREBASE_SERVICE_ACCOUNT='$ESCAPED_JSON'"
echo ""
echo "================================================"
echo "Next Steps:"
echo "================================================"
echo ""
echo "1. Create or update supabase/.env.local with the above variables"
echo "2. Start Supabase: supabase start"
echo "3. Test push notifications"
echo ""
echo "For Production:"
echo "1. Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets"
echo "2. Add both environment variables there"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - DO NOT commit supabase/.env.local to Git"
echo "   - DO NOT share these credentials"
echo "   - DO NOT paste them in public channels"
echo ""

# Optionally write to file
read -p "Would you like to create supabase/.env.local with these variables? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Check if file exists and create backup
    if [ -f "supabase/.env.local" ]; then
        cp "supabase/.env.local" "supabase/.env.local.backup"
        echo "✓ Backed up existing .env.local to .env.local.backup"
    fi
    
    # Write to file
    {
        echo "# Firebase Configuration"
        echo "FIREBASE_PROJECT_ID=$PROJECT_ID"
        echo "FIREBASE_SERVICE_ACCOUNT='$ESCAPED_JSON'"
    } > "supabase/.env.local"
    
    echo "✓ Created supabase/.env.local"
    echo ""
    echo "⚠️  Make sure .env.local is in your .gitignore!"
    
    # Check if .gitignore exists and contains .env.local
    if [ -f "supabase/.gitignore" ]; then
        if grep -q "\.env\.local" "supabase/.gitignore"; then
            echo "✓ supabase/.gitignore already ignores .env.local"
        else
            echo ".env.local" >> "supabase/.gitignore"
            echo "✓ Added .env.local to supabase/.gitignore"
        fi
    else
        echo ".env.local" > "supabase/.gitignore"
        echo "✓ Created supabase/.gitignore"
    fi
else
    echo "Skipped creating .env.local"
fi

echo ""
echo "✓ Setup complete!"
