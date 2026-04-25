#!/bin/bash

# Deployment helper script for Event Notes Web

echo "=== Event Notes Web Deployment ==="
echo ""

# Check if AGENT_API_KEY is set
if [ -z "$AGENT_API_KEY" ]; then
    echo "WARNING: AGENT_API_KEY environment variable not set."
    echo "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    echo ""
fi

# Check which deployment platform
if command -v railway &> /dev/null; then
    echo "Detected Railway CLI. Deploying..."
    railway link
    railway deploy
elif command -v vercel &> /dev/null; then
    echo "Detected Vercel CLI. Deploying..."
    vercel --prod
elif command -v flyctl &> /dev/null; then
    echo "Detected Fly.io CLI. Deploying..."
    flyctl deploy
else
    echo "No deployment CLI detected."
    echo ""
    echo "Choose your platform:"
    echo "1. Railway: npm i -g @railway/cli && railway login && railway new && railway deploy"
    echo "2. Vercel: npm i -g vercel && vercel --prod"
    echo "3. Fly.io: curl -L https://fly.io/install.sh | sh && flyctl launch && flyctl deploy"
fi
