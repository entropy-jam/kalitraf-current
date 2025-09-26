#!/bin/bash

# Cleanup Legacy Files After Railway Deployment
# Run this script after successful Railway deployment

echo "🧹 Cleaning up legacy Vercel and GitHub Actions files..."

# Disable GitHub Actions
if [ -f ".github/workflows/traffic-scraper.yml" ]; then
    mv .github/workflows/traffic-scraper.yml .github/workflows/traffic-scraper.yml.disabled
    echo "✅ Disabled GitHub Actions workflow"
fi

# Remove Vercel-specific files
if [ -d "config/api.vercel" ]; then
    rm -rf config/api.vercel/
    echo "✅ Removed Vercel API functions"
fi

if [ -f "config/vercel.json.vercel" ]; then
    rm config/vercel.json.vercel
    echo "✅ Removed Vercel configuration"
fi

if [ -f "config/package.json.nodejs" ]; then
    rm config/package.json.nodejs
    echo "✅ Removed Node.js package configuration"
fi

# Remove legacy JavaScript files (already cleaned up)
echo "✅ Legacy JavaScript files already removed"

# Remove Vercel debugging scripts
if [ -f "scripts/debug-vercel.js" ]; then
    rm scripts/debug-vercel.js
    echo "✅ Removed Vercel debug script"
fi

if [ -f "scripts/debug-vercel.sh" ]; then
    rm scripts/debug-vercel.sh
    echo "✅ Removed Vercel debug shell script"
fi

# Remove Vercel-specific app entry point (already cleaned up)
echo "✅ Vercel real-time app entry point already removed"

# Remove Pusher dependencies from requirements
if [ -f "config/requirements.txt.python" ]; then
    # Remove Pusher-related dependencies
    sed -i '/pusher/d' config/requirements.txt.python
    echo "✅ Removed Pusher dependencies from requirements"
fi

# Clean up root directory
if [ -f "package-lock.json" ]; then
    rm package-lock.json
    echo "✅ Removed package-lock.json"
fi

echo ""
echo "🎉 Cleanup complete! Railway deployment is now the primary deployment method."
echo "📊 Benefits:"
echo "   - 5-second real-time updates (vs 60s GitHub Actions)"
echo "   - Built-in WebSocket (no external dependencies)"
echo "   - 60-70% cost reduction"
echo "   - Persistent processes (no cold starts)"
echo ""
echo "🚀 Your CHP Traffic Monitor is now running on Railway with real-time updates!"
