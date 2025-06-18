#!/bin/bash

# Luna AI Journaling Companion - Vercel Deployment Script
# This script automates the deployment process to Vercel

set -e  # Exit on any error

echo "🌙 Luna AI Journaling Companion - Vercel Deployment"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
else
    echo "✅ Vercel CLI is already installed"
fi

# Run pre-deployment tests
echo ""
echo "🧪 Running pre-deployment tests..."

echo "  📋 Type checking..."
if npm run type-check; then
    echo "  ✅ TypeScript compilation successful"
else
    echo "  ❌ TypeScript errors found. Please fix them before deploying."
    exit 1
fi

echo "  🔨 Building project..."
if npm run build; then
    echo "  ✅ Build successful"
else
    echo "  ❌ Build failed. Please fix build errors before deploying."
    exit 1
fi

echo ""
echo "🚀 Starting deployment to Vercel..."

# Login to Vercel if not already logged in
echo "  🔐 Checking Vercel authentication..."
if vercel whoami &> /dev/null; then
    echo "  ✅ Already logged in to Vercel"
else
    echo "  🔑 Please log in to Vercel..."
    vercel login
fi

# Deploy to Vercel
echo "  📤 Deploying to Vercel..."
vercel --prod

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Post-deployment checklist:"
echo "  1. ✅ Set GEMINI_API_KEY environment variable in Vercel dashboard"
echo "  2. ✅ Test the live application"
echo "  3. ✅ Verify voice features work (requires HTTPS)"
echo "  4. ✅ Test on mobile devices"
echo "  5. ✅ Check PWA installation"
echo ""
echo "💡 To set environment variables:"
echo "   vercel env add GEMINI_API_KEY"
echo ""
echo "🔗 Visit your Vercel dashboard to manage your deployment:"
echo "   https://vercel.com/dashboard"
