#!/bin/bash

# Vercel Deployment Debug Script (Shell Version)
# Comprehensive debugging tool for Vercel deployment issues

echo "🔍 Vercel Deployment Debug Script"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

log() {
    echo -e "${1}${2}${NC}"
}

# Check if file exists
check_file() {
    local file="$1"
    local desc="$2"
    
    if [ -f "$file" ]; then
        log "$GREEN" "✅ $desc: EXISTS"
        log "$CYAN" "   Size: $(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null) bytes"
        log "$CYAN" "   Modified: $(stat -f%Sm "$file" 2>/dev/null || stat -c%y "$file" 2>/dev/null)"
        return 0
    else
        log "$RED" "❌ $desc: MISSING"
        return 1
    fi
}

# Check if directory exists
check_dir() {
    local dir="$1"
    local desc="$2"
    
    if [ -d "$dir" ]; then
        log "$GREEN" "✅ $desc: EXISTS"
        local count=$(find "$dir" -name "*.js" 2>/dev/null | wc -l)
        log "$CYAN" "   JavaScript files: $count"
        return 0
    else
        log "$RED" "❌ $desc: MISSING"
        return 1
    fi
}

# Validate JSON file
validate_json() {
    local file="$1"
    local desc="$2"
    
    if [ -f "$file" ]; then
        if python3 -m json.tool "$file" >/dev/null 2>&1; then
            log "$GREEN" "✅ $desc: VALID JSON"
            return 0
        else
            log "$RED" "❌ $desc: INVALID JSON"
            return 1
        fi
    else
        log "$RED" "❌ $desc: FILE NOT FOUND"
        return 1
    fi
}

echo ""
log "$BOLD" "📋 Vercel Configuration Check"
log "$BLUE" "=============================="

# Check vercel.json
validate_json "vercel.json" "vercel.json"

# Check for conflicting configurations
if [ -f "vercel.json" ]; then
    if grep -q '"builds"' vercel.json && grep -q '"functions"' vercel.json; then
        log "$RED" "❌ CONFLICT: Both builds and functions are configured!"
        log "$YELLOW" "💡 Fix: Remove either builds or functions from vercel.json"
    else
        log "$GREEN" "✅ No conflicting configurations detected"
    fi
fi

echo ""
log "$BOLD" "📁 Project Structure Check"
log "$BLUE" "============================"

# Check required files
check_file "index.html" "Main HTML file"
check_file "styles.css" "CSS stylesheet"
check_file "vercel.json" "Vercel configuration"
check_file ".vercelignore" "Vercel ignore file"

# Check required directories
check_dir "js" "JavaScript directory"
check_dir "data" "Data directory"

# Count files
if [ -d "js" ]; then
    js_count=$(find js -name "*.js" | wc -l)
    log "$GREEN" "✅ JavaScript files: $js_count found"
fi

if [ -d "data" ]; then
    data_count=$(find data -name "*.json" | wc -l)
    log "$GREEN" "✅ Data files: $data_count found"
fi

echo ""
log "$BOLD" "🌿 Git Status Check"
log "$BLUE" "===================="

# Check git status
if git status --porcelain | grep -q .; then
    log "$YELLOW" "⚠️  Uncommitted changes detected:"
    git status --porcelain
    log "$YELLOW" "💡 Consider committing changes before deployment"
else
    log "$GREEN" "✅ Working directory is clean"
fi

# Check current branch
current_branch=$(git branch --show-current 2>/dev/null)
if [ $? -eq 0 ]; then
    log "$GREEN" "✅ Current branch: $current_branch"
else
    log "$RED" "❌ Not a git repository"
fi

# Check remote
remote_url=$(git remote get-url origin 2>/dev/null)
if [ $? -eq 0 ]; then
    log "$GREEN" "✅ Remote origin: $remote_url"
else
    log "$RED" "❌ No remote origin configured"
fi

echo ""
log "$BOLD" "⚡ Vercel CLI Check"
log "$BLUE" "==================="

# Check if Vercel CLI is installed
if command -v vercel >/dev/null 2>&1; then
    vercel_version=$(vercel --version 2>/dev/null)
    log "$GREEN" "✅ Vercel CLI installed: $vercel_version"
else
    log "$RED" "❌ Vercel CLI not installed"
    log "$YELLOW" "💡 Install with: npm install -g vercel"
fi

echo ""
log "$BOLD" "🔐 Environment Variables Check"
log "$BLUE" "==============================="

# Check required environment variables
if [ -n "$VERCEL_TOKEN" ]; then
    log "$GREEN" "✅ VERCEL_TOKEN: SET"
else
    log "$RED" "❌ VERCEL_TOKEN: NOT SET"
fi

if [ -n "$GITHUB_TOKEN" ]; then
    log "$GREEN" "✅ GITHUB_TOKEN: SET"
else
    log "$YELLOW" "⚠️  GITHUB_TOKEN: NOT SET (optional)"
fi

echo ""
log "$BOLD" "🚀 Deployment Commands"
log "$BLUE" "======================="

log "$CYAN" "Manual deployment:"
log "$NC" "vercel --prod --yes"

log "$CYAN" "\nWith token:"
log "$NC" "VERCEL_TOKEN=your_token vercel --prod --yes"

log "$CYAN" "\nDebug deployment:"
log "$NC" "vercel --debug --prod --yes"

log "$CYAN" "\nCheck deployment status:"
log "$NC" "vercel ls"

echo ""
log "$BOLD" "🛠️  Troubleshooting Tips"
log "$BLUE" "========================="

log "$YELLOW" "1. Check Vercel Dashboard:"
log "$NC" "   - Go to vercel.com/dashboard"
log "$NC" "   - Look for deployment errors"

log "$YELLOW" "\n2. Check GitHub Webhooks:"
log "$NC" "   - Go to GitHub repo → Settings → Webhooks"
log "$NC" "   - Verify Vercel webhook exists"

log "$YELLOW" "\n3. Check GitHub Actions:"
log "$NC" "   - Go to GitHub repo → Actions tab"
log "$NC" "   - Look for failed workflow runs"

log "$YELLOW" "\n4. Manual deployment test:"
log "$NC" "   - Run: vercel --prod --yes"
log "$NC" "   - Check for error messages"

log "$YELLOW" "\n5. Check file permissions:"
log "$NC" "   - Ensure all files are readable"
log "$NC" "   - Check .vercelignore exclusions"

echo ""
log "$BOLD" "✨ Debug script complete!"
