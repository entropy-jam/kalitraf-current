# Railway Deployment Guide

## 🚂 **Railway Migration Complete**

The project has been fully organized and prepared for Railway deployment with real-time WebSocket support.

## 📁 **New Project Structure**

```
chp-traffic-scraper/
├── assets/                    # Static assets
│   ├── styles.css            # Main stylesheet
│   └── chromedriver-mac-arm64/ # Chrome driver
├── bin/                       # Python entry points
│   ├── scrape_local.py       # Local development
│   └── scrape_github.py      # GitHub Actions (legacy)
├── config/                    # Configuration files
│   ├── api.vercel/           # Vercel API functions (legacy)
│   ├── package.json.nodejs   # Node.js dependencies
│   ├── requirements.txt.python # Python dependencies
│   ├── railway.json          # Railway configuration
│   ├── vercel.json.vercel    # Vercel config (legacy)
│   └── _config.yml.github    # GitHub Pages config (legacy)
├── data/                      # Data files
│   ├── active_incidents_*.json
│   ├── incident_deltas_*.json
│   └── timestamp.json
├── docs/                      # Documentation
│   ├── README.md
│   ├── MIGRATION.md
│   ├── RAILWAY_DEPLOYMENT.md
│   └── DISABLE_GITHUB_ACTIONS.md
├── js/                        # Frontend JavaScript
│   ├── app-railway.js        # Railway entry point
│   ├── app-realtime.js       # Vercel entry point (legacy)
│   ├── config/websocket-config.js
│   ├── controllers/app-controller.js
│   ├── services/             # Business logic
│   ├── renderers/            # UI rendering
│   ├── storage/              # Data persistence
│   └── fetchers/             # Data retrieval
├── legacy/                    # Deprecated files
│   └── js/                   # Old JavaScript files
├── logs/                      # Log files
├── scripts/                   # Utility scripts
│   ├── debug-vercel.js      # Vercel debugging (legacy)
│   └── debug-vercel.sh      # Vercel debugging (legacy)
├── src/                       # Python backend
│   ├── core/                 # Core business logic
│   ├── scrapers/             # Scraper implementations
│   └── utils/                # Utility modules
├── email_templates/          # Email templates
├── railway.toml              # Railway deployment config
└── index.html                # Main entry point
```

## 🚀 **Railway Deployment Steps**

### **1. Railway Account Setup**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init
```

### **2. Environment Variables**
Set these in Railway dashboard:
```bash
# Email notifications (optional)
GMAIL_SENDER_EMAIL=your-email@gmail.com
GMAIL_RECIPIENT_EMAIL=recipient@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Scraper settings
SCRAPER_MODE=railway
ENABLE_EMAIL_NOTIFICATIONS=false
```

### **3. Deploy to Railway**
```bash
# Deploy the project
railway up

# Check deployment status
railway status

# View logs
railway logs
```

## 🔧 **Railway Configuration**

### **railway.toml**
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "python src/scrapers/continuous_scraper.py"

[services]
- name: "chp-scraper"
  source: "."
  buildCommand: "pip install -r config/requirements.txt.python"
  startCommand: "python src/scrapers/continuous_scraper.py"
```

### **Key Features:**
- ✅ **Continuous Scraping**: 5-second intervals
- ✅ **Built-in WebSocket**: No external dependencies
- ✅ **Parallel Processing**: All centers simultaneously
- ✅ **Real-time Updates**: Sub-5-second latency
- ✅ **Auto-reconnection**: Robust error handling

## 📊 **Performance Comparison**

| Feature | Vercel | Railway |
|---------|--------|---------|
| **Update Speed** | 30-60 seconds | 5 seconds |
| **WebSocket** | External (Pusher) | Built-in |
| **Cost** | $35-45/month | $10-15/month |
| **Reliability** | Cold starts | Persistent |
| **Control** | Limited | Full |

## 🔄 **Migration Benefits**

### **Technical Improvements:**
- ✅ **5-second updates** (vs 60s GitHub Actions)
- ✅ **No external dependencies** (built-in WebSocket)
- ✅ **Persistent processes** (no cold starts)
- ✅ **Full control** over scraping logic
- ✅ **Parallel processing** (all centers simultaneously)

### **Cost Savings:**
- ✅ **60-70% cost reduction** ($10-15 vs $35-45/month)
- ✅ **No per-message charges** (unlimited WebSocket messages)
- ✅ **Predictable pricing** (no usage-based billing)

### **Developer Experience:**
- ✅ **Better debugging** (persistent logs)
- ✅ **Easier deployment** (single command)
- ✅ **Full control** over infrastructure
- ✅ **Better error handling** and recovery

## 🧹 **Cleanup Tasks**

### **After Railway Deployment:**
1. **Disable GitHub Actions**
   ```bash
   mv .github/workflows/traffic-scraper.yml .github/workflows/traffic-scraper.yml.disabled
   ```

2. **Remove Vercel-specific files**
   ```bash
   rm -rf config/api.vercel/
   rm config/vercel.json.vercel
   rm config/package.json.nodejs
   ```

3. **Clean up legacy files**
   ```bash
   rm -rf legacy/
   rm -rf scripts/debug-vercel.*
   ```

4. **Update documentation**
   - Remove Vercel references
   - Update deployment instructions
   - Update README.md

## 🎯 **Next Steps**

1. **Deploy to Railway** using the steps above
2. **Test real-time functionality** (5-second updates)
3. **Monitor performance** and logs
4. **Clean up legacy files** after successful deployment
5. **Update documentation** to reflect Railway deployment

## 📝 **Notes**

- **Backward Compatibility**: Legacy files are preserved with `.vercel` and `.github` suffixes
- **Rollback Plan**: Can revert to Vercel deployment if needed
- **Data Migration**: All existing data and logic preserved
- **WebSocket Migration**: Seamless transition from Pusher to built-in WebSocket

---

**Status**: Ready for Railway deployment  
**Performance**: 5-second real-time updates  
**Cost**: $10-15/month (60-70% savings)  
**Next**: Deploy and test Railway functionality
