#!/bin/bash
# File Permission Hardening Script
# Sets secure permissions for configuration files

echo "🔒 Fixing file permissions for security..."

# Set configuration files to 600 (owner read/write only)
echo "Setting configuration files to 600..."
chmod 600 config/railway.json 2>/dev/null || echo "⚠️  config/railway.json not found"
chmod 600 config/requirements.txt.python 2>/dev/null || echo "⚠️  config/requirements.txt.python not found"
chmod 600 railway.toml 2>/dev/null || echo "⚠️  railway.toml not found"
chmod 600 railway.json 2>/dev/null || echo "⚠️  railway.json not found"

# Set sensitive directories to 700 (owner only)
echo "Setting sensitive directories to 700..."
chmod 700 config/ 2>/dev/null || echo "⚠️  config/ directory not found"

# Set data directory to 755 (owner read/write/execute, group/other read/execute)
echo "Setting data directory to 755..."
chmod 755 data/ 2>/dev/null || echo "⚠️  data/ directory not found"

# Set Python files to 644 (owner read/write, group/other read)
echo "Setting Python files to 644..."
find src/ -name "*.py" -exec chmod 644 {} \; 2>/dev/null || echo "⚠️  No Python files found"

# Set JavaScript files to 644
echo "Setting JavaScript files to 644..."
find js/ -name "*.js" -exec chmod 644 {} \; 2>/dev/null || echo "⚠️  No JavaScript files found"

# Set HTML files to 644
echo "Setting HTML files to 644..."
find . -name "*.html" -exec chmod 644 {} \; 2>/dev/null || echo "⚠️  No HTML files found"

# Set executable scripts to 755
echo "Setting executable scripts to 755..."
chmod 755 bin/*.py 2>/dev/null || echo "⚠️  No executable scripts found"
chmod 755 diagnostics_suite/*.py 2>/dev/null || echo "⚠️  No diagnostic scripts found"

echo "✅ File permissions hardened successfully!"
echo ""
echo "📋 Permission Summary:"
echo "   Config files (600): Owner read/write only"
echo "   Sensitive dirs (700): Owner only access"
echo "   Data dir (755): Owner full, others read/execute"
echo "   Code files (644): Owner read/write, others read"
echo "   Executables (755): Owner full, others read/execute"
