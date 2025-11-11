#!/bin/bash

# DataNexus - Quick Deploy to Vercel
# Simple one-command deployment script

set -e

echo "🚀 DataNexus - Quick Deploy to Vercel"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Login if needed
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel..."
    vercel login
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build
echo "🏗️  Building project..."
npm run build

# Deploy
echo ""
echo "Choose deployment type:"
echo "  1) Preview (testing)"
echo "  2) Production"
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        echo "🚀 Deploying to preview..."
        vercel
        ;;
    2)
        echo "🚀 Deploying to production..."
        vercel --prod
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment complete!"
echo ""
echo "⚠️  Don't forget to:"
echo "  1. Set environment variables in Vercel Dashboard"
echo "  2. Run database migrations"
echo ""

