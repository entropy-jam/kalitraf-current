#!/usr/bin/env node

/**
 * Vercel Deployment Debug Script
 * Comprehensive debugging tool for Vercel deployment issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Vercel Deployment Debug Script');
console.log('=====================================\n');

// Color codes for better output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  try {
    const exists = fs.existsSync(filePath);
    const stats = exists ? fs.statSync(filePath) : null;
    log(exists ? 'green' : 'red', `✅ ${description}: ${exists ? 'EXISTS' : 'MISSING'}`);
    if (exists) {
      log('cyan', `   Size: ${stats.size} bytes`);
      log('cyan', `   Modified: ${stats.mtime.toISOString()}`);
    }
    return exists;
  } catch (error) {
    log('red', `❌ Error checking ${description}: ${error.message}`);
    return false;
  }
}

function validateJson(filePath, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    log('green', `✅ ${description}: VALID JSON`);
    return { valid: true, content: parsed };
  } catch (error) {
    log('red', `❌ ${description}: INVALID JSON - ${error.message}`);
    return { valid: false, error: error.message };
  }
}

function checkVercelConfig() {
  log('bold', '\n📋 Vercel Configuration Check');
  log('blue', '==============================');
  
  const vercelJson = validateJson('./vercel.json', 'vercel.json');
  if (!vercelJson.valid) return false;
  
  const config = vercelJson.content;
  
  // Check for conflicting configurations
  const hasBuilds = config.builds && Array.isArray(config.builds);
  const hasFunctions = config.functions && typeof config.functions === 'object';
  
  log(hasBuilds ? 'green' : 'red', `Builds configuration: ${hasBuilds ? 'PRESENT' : 'MISSING'}`);
  log(hasFunctions ? 'yellow' : 'green', `Functions configuration: ${hasFunctions ? 'PRESENT (POTENTIAL CONFLICT)' : 'ABSENT (GOOD)'}`);
  
  if (hasBuilds && hasFunctions) {
    log('red', '❌ CONFLICT: Both builds and functions are configured!');
    log('yellow', '💡 Fix: Remove either builds or functions from vercel.json');
    return false;
  }
  
  // Check builds configuration
  if (hasBuilds) {
    log('green', `✅ Builds count: ${config.builds.length}`);
    config.builds.forEach((build, index) => {
      log('cyan', `   Build ${index + 1}: ${build.src} → ${build.use}`);
    });
  }
  
  // Check routes
  if (config.routes) {
    log('green', `✅ Routes count: ${config.routes.length}`);
    config.routes.forEach((route, index) => {
      log('cyan', `   Route ${index + 1}: ${route.src} → ${route.dest}`);
    });
  }
  
  // Check headers
  if (config.headers) {
    log('green', `✅ Headers count: ${config.headers.length}`);
    config.headers.forEach((header, index) => {
      log('cyan', `   Header ${index + 1}: ${header.source}`);
    });
  }
  
  return true;
}

function checkProjectStructure() {
  log('bold', '\n📁 Project Structure Check');
  log('blue', '============================');
  
  const requiredFiles = [
    { path: './index.html', desc: 'Main HTML file' },
    { path: './styles.css', desc: 'CSS stylesheet' },
    { path: './vercel.json', desc: 'Vercel configuration' },
    { path: './.vercelignore', desc: 'Vercel ignore file' }
  ];
  
  const requiredDirs = [
    { path: './js', desc: 'JavaScript directory' },
    { path: './data', desc: 'Data directory' }
  ];
  
  let allGood = true;
  
  requiredFiles.forEach(file => {
    if (!checkFile(file.path, file.desc)) allGood = false;
  });
  
  requiredDirs.forEach(dir => {
    if (!checkFile(dir.path, dir.desc)) allGood = false;
  });
  
  // Check JS files
  if (fs.existsSync('./js')) {
    const jsFiles = fs.readdirSync('./js').filter(f => f.endsWith('.js'));
    log('green', `✅ JavaScript files: ${jsFiles.length} found`);
    jsFiles.forEach(file => {
      log('cyan', `   - ${file}`);
    });
  }
  
  // Check data files
  if (fs.existsSync('./data')) {
    const dataFiles = fs.readdirSync('./data').filter(f => f.endsWith('.json'));
    log('green', `✅ Data files: ${dataFiles.length} found`);
  }
  
  return allGood;
}

function checkGitStatus() {
  log('bold', '\n🌿 Git Status Check');
  log('blue', '====================');
  
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      log('yellow', '⚠️  Uncommitted changes detected:');
      log('cyan', status);
      log('yellow', '💡 Consider committing changes before deployment');
    } else {
      log('green', '✅ Working directory is clean');
    }
    
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    log('green', `✅ Current branch: ${branch}`);
    
    const remote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    log('green', `✅ Remote origin: ${remote}`);
    
    return true;
  } catch (error) {
    log('red', `❌ Git error: ${error.message}`);
    return false;
  }
}

function checkVercelCLI() {
  log('bold', '\n⚡ Vercel CLI Check');
  log('blue', '===================');
  
  try {
    const version = execSync('vercel --version', { encoding: 'utf8' }).trim();
    log('green', `✅ Vercel CLI installed: ${version}`);
    return true;
  } catch (error) {
    log('red', '❌ Vercel CLI not installed');
    log('yellow', '💡 Install with: npm install -g vercel');
    return false;
  }
}

function checkEnvironmentVariables() {
  log('bold', '\n🔐 Environment Variables Check');
  log('blue', '===============================');
  
  const requiredVars = [
    'VERCEL_TOKEN',
    'GITHUB_TOKEN'
  ];
  
  const optionalVars = [
    'VERCEL_ORG_ID',
    'VERCEL_PROJECT_ID'
  ];
  
  let allRequired = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      log('green', `✅ ${varName}: SET`);
    } else {
      log('red', `❌ ${varName}: NOT SET`);
      allRequired = false;
    }
  });
  
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      log('green', `✅ ${varName}: SET`);
    } else {
      log('yellow', `⚠️  ${varName}: NOT SET (optional)`);
    }
  });
  
  return allRequired;
}

function generateDeploymentCommand() {
  log('bold', '\n🚀 Deployment Commands');
  log('blue', '=======================');
  
  log('cyan', 'Manual deployment:');
  log('white', 'vercel --prod --yes');
  
  log('cyan', '\nWith token:');
  log('white', 'vercel --token $VERCEL_TOKEN --prod --yes');
  
  log('cyan', '\nDebug deployment:');
  log('white', 'vercel --debug --prod --yes');
  
  log('cyan', '\nCheck deployment status:');
  log('white', 'vercel ls');
}

function generateTroubleshootingTips() {
  log('bold', '\n🛠️  Troubleshooting Tips');
  log('blue', '=========================');
  
  log('yellow', '1. Check Vercel Dashboard:');
  log('white', '   - Go to vercel.com/dashboard');
  log('white', '   - Look for deployment errors');
  
  log('yellow', '\n2. Check GitHub Webhooks:');
  log('white', '   - Go to GitHub repo → Settings → Webhooks');
  log('white', '   - Verify Vercel webhook exists');
  
  log('yellow', '\n3. Check GitHub Actions:');
  log('white', '   - Go to GitHub repo → Actions tab');
  log('white', '   - Look for failed workflow runs');
  
  log('yellow', '\n4. Manual deployment test:');
  log('white', '   - Run: vercel --prod --yes');
  log('white', '   - Check for error messages');
  
  log('yellow', '\n5. Check file permissions:');
  log('white', '   - Ensure all files are readable');
  log('white', '   - Check .vercelignore exclusions');
}

// Main execution
async function main() {
  log('bold', 'Starting Vercel deployment diagnostics...\n');
  
  const checks = [
    { name: 'Project Structure', fn: checkProjectStructure },
    { name: 'Vercel Configuration', fn: checkVercelConfig },
    { name: 'Git Status', fn: checkGitStatus },
    { name: 'Vercel CLI', fn: checkVercelCLI },
    { name: 'Environment Variables', fn: checkEnvironmentVariables }
  ];
  
  const results = checks.map(check => ({
    name: check.name,
    passed: check.fn()
  }));
  
  log('bold', '\n📊 Summary');
  log('blue', '===========');
  
  results.forEach(result => {
    log(result.passed ? 'green' : 'red', 
        `${result.passed ? '✅' : '❌'} ${result.name}: ${result.passed ? 'PASS' : 'FAIL'}`);
  });
  
  const allPassed = results.every(r => r.passed);
  
  if (allPassed) {
    log('green', '\n🎉 All checks passed! Your project should deploy successfully.');
  } else {
    log('red', '\n⚠️  Some checks failed. Review the issues above.');
  }
  
  generateDeploymentCommand();
  generateTroubleshootingTips();
  
  log('bold', '\n✨ Debug script complete!');
}

// Run the script
main().catch(error => {
  log('red', `❌ Script error: ${error.message}`);
  process.exit(1);
});
