# CHP Traffic Incident Scraper

A modular, automated system for monitoring California Highway Patrol traffic incidents with real-time email notifications.

## 🏗️ Project Structure

### Backend (Python)
```
├── src/
│   ├── core/                    # Core modules
│   │   ├── webdriver_manager.py # WebDriver management
│   │   ├── incident_extractor.py # Data extraction
│   │   ├── data_manager.py      # JSON storage & comparison
│   │   ├── email_notifier.py    # SMTP email notifications
│   │   ├── multi_center_manager.py # Multi-center coordination
│   │   └── websocket_publisher.py # WebSocket publishing
│   ├── scrapers/                # Scraper implementations
│   │   ├── local_scraper.py     # Local development scraper
│   │   ├── batch_scraper.py      # Batch data collection scraper
│   │   └── continuous_scraper.py # Railway continuous scraper
│   └── utils/                   # Utility modules
├── data/                        # JSON data storage
│   ├── active_incidents_[CENTER].json  # Current incidents per center
│   ├── incident_deltas_[CENTER].json   # Change deltas per center
│   ├── YYYY-MM-DD_incidents_[CENTER].json  # Daily archives per center
│   └── timestamp.json          # Last update timestamp
├── bin/                         # Entry point scripts
│   ├── scrape_local.py         # Local scraper entry point
│   └── scrape_batch.py         # Batch scraper entry point
├── config/                      # Configuration files
│   ├── railway.json            # Railway service configuration
│   ├── railway.toml            # Railway deployment config
│   └── requirements.txt.python # Python dependencies
└── assets/                      # Static assets
    ├── chromedriver-mac-arm64/  # Chrome driver for local dev
    └── styles.css              # CSS styles
├── testing_suite/               # WebSocket testing tools
    ├── test-websocket-server.py # Simple WebSocket test server
    ├── start-websocket-server.py # Railway WebSocket server starter
    ├── websocket-test.html      # Interactive diagnostic page
    ├── WEBSOCKET_TROUBLESHOOTING.md # Troubleshooting guide
    └── TESTING_SUITE.md         # Testing suite documentation
```

### Frontend (JavaScript - SOLID Architecture)
```
├── js/
│   ├── interfaces.js           # Interface definitions (SOLID)
│   ├── config-manager.js       # Configuration management
│   ├── storage/                # Storage implementations
│   │   └── local-storage.js    # localStorage adapter
│   ├── fetchers/               # Data fetching implementations
│   │   └── http-fetcher.js     # HTTP client
│   ├── renderers/              # UI rendering implementations
│   │   └── incident-renderer.js # Incident display logic
│   ├── services/               # Business logic services
│   │   ├── incident-service.js # Incident data operations
│   │   ├── delta-service.js    # Change detection service
│   │   ├── filter-service.js   # Data filtering service
│   │   ├── multi-center-service.js # Multi-center coordination
│   │   └── railway-websocket-service.js # Railway WebSocket service
│   ├── controllers/            # Application controllers
│   │   └── app-controller.js   # Main application controller
│   ├── config/                 # Configuration files
│   │   └── websocket-config.js # WebSocket configuration
│   ├── modules/                # Utility modules
│   │   └── copy-to-clipboard.js # Clipboard functionality
│   └── app-railway.js         # Railway application entry point
├── assets/styles.css          # CSS styles
├── index.html                 # Main HTML structure
├── railway.toml               # Railway deployment configuration
└── railway.json               # Railway service configuration
```

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
pip install -r config/requirements.txt.python

# Run local scraper (once)
python bin/scrape_local.py --once --center BCCC

# Run continuous monitoring
python bin/scrape_local.py --center BCCC --interval 60 --iterations 10

# Run Railway continuous scraper with WebSocket
python src/scrapers/continuous_scraper.py
```

### Railway Deployment
The system runs continuously on Railway with built-in WebSocket server for real-time updates:
- **Scraper**: Runs every 5 seconds with WebSocket broadcasting
- **Frontend**: Serves static files with WebSocket client
- **WebSocket**: Built-in server (no external dependencies)

### Batch Data Collection
The system includes a batch scraper for one-time data collection:
```bash
# Run batch scraper for data collection
COMMUNICATION_CENTER=BCCC python bin/scrape_batch.py
```

## 📧 Email Notifications

Configure email notifications by setting environment variables:
- `GMAIL_SENDER_EMAIL`: Your Gmail address
- `GMAIL_RECIPIENT_EMAIL`: Recipient email address  
- `GMAIL_APP_PASSWORD`: Gmail App Password (16 characters)

## 🎯 Features

- **Modular Design**: Clean separation of concerns with SOLID architecture
- **Real-time Monitoring**: Scrapes every 5 seconds with WebSocket broadcasting
- **Built-in WebSocket**: No external dependencies (replaces Pusher)
- **Email Alerts**: Instant notifications for new/resolved incidents
- **Data Persistence**: JSON storage with historical tracking
- **Multi-center Support**: BCCC, LACC, OCCC, SACC
- **Railway Deployment**: Live web dashboard with real-time updates
- **Cost Effective**: $5-15/month (vs $35-40/month for Vercel Pro + Pusher)

## 🔧 Configuration

### Communication Centers
- `BCCC`: Border Communications Center
- `CCC`: Central Communications Center  
- `NCCC`: Northern Communications Center
- `SCCC`: Southern Communications Center

### Environment Variables
- `COMMUNICATION_CENTER`: Center to scrape (default: BCCC)
- `ENABLE_EMAIL_NOTIFICATIONS`: Enable/disable emails (default: false)
- `GMAIL_SENDER_EMAIL`: Sender email address
- `GMAIL_RECIPIENT_EMAIL`: Recipient email address
- `GMAIL_APP_PASSWORD`: Gmail App Password

## 🔧 Scraper Architecture

### **Three Scraper Types:**

1. **🚀 Continuous Scraper** (`src/scrapers/continuous_scraper.py`)
   - **Primary production scraper** for Railway deployment
   - Runs every 5 seconds with built-in WebSocket server
   - Handles all 4 centers (BCCC, LACC, OCCC, SACC)
   - Real-time broadcasting to frontend clients

2. **🛠️ Local Scraper** (`src/scrapers/local_scraper.py`)
   - **Development and testing** scraper
   - Entry point: `bin/scrape_local.py`
   - Good for local development and debugging
   - Supports continuous monitoring with intervals

3. **📦 Batch Scraper** (`src/scrapers/batch_scraper.py`)
   - **One-time data collection** scraper
   - Entry point: `bin/scrape_batch.py`
   - Useful for manual data collection
   - No continuous monitoring

### **WebDriver Usage:**
All scrapers use WebDriver to access CHP website data:
- **CHP doesn't provide a public API** for traffic incidents
- **WebDriver simulates browser** to scrape dynamic content
- **WebSocket broadcasts** scraped data to frontend clients
- **WebDriver + WebSocket work together** for real-time updates

## 🌐 WebSocket Implementation

### Built-in WebSocket Server
The system uses a built-in WebSocket server (`RailwayWebSocketServer`) that eliminates external dependencies:

```python
# Built-in WebSocket server (no external Pusher needed)
class RailwayWebSocketServer:
    async def broadcast_incidents(self, incidents_data):
        # Broadcast to all connected clients
        for client in self.clients:
            await client.send(json.dumps(incidents_data))
```

### Real-time Updates
- **Scraping Interval**: Every 5 seconds
- **WebSocket Broadcasting**: Immediate updates to all connected clients
- **Message Types**: 
  - `incident_update`: Individual center updates
  - `scrape_summary`: Complete scraping results
  - `delta_update`: New/removed incidents

### Frontend Integration
The frontend connects to the WebSocket server for real-time updates:

```javascript
// Railway WebSocket Service
class RailwayWebSocketService {
    connect() {
        this.ws = new WebSocket(RAILWAY_CONFIG.websocket.url);
        // Handle real-time incident updates
    }
}
```

## 📊 Data Format

### Active Incidents (`data/active_incidents_[CENTER].json`)
```json
{
  "center_code": "BCCC",
  "center_name": "Border",
  "incident_count": 18,
  "incidents": [...],
  "last_updated": "2025-09-23T17:45:19.641000"
}
```

### Daily Archive (`data/YYYY-MM-DD_incidents_[CENTER].json`)
```json
{
  "center_code": "BCCC", 
  "center_name": "Border",
  "date": "2025-09-23",
  "total_incidents": 22,
  "incidents": [...],
  "last_updated": "2025-09-23T17:45:19.641000"
}
```

### Backward Compatibility (`active_incidents.json`)
The root-level `active_incidents.json` file is maintained for backward compatibility and contains BCCC data.

## 🌐 Live Deployment

### Railway (Primary) 🚀
**Live dashboard**: [Deploy to Railway](https://railway.app/template)

**Features**:
- ⚡ Real-time WebSocket updates
- 🔄 Live incident display with sub-second updates
- 📱 Communication center selection
- 🔄 Built-in WebSocket server (no external dependencies)
- 📱 Responsive design
- 🎯 Cost-effective deployment ($5-15/month)

### GitHub Pages (Legacy)
**Legacy dashboard**: https://entropy-jam.github.io/chp-scraper/

**Migration Status**: ✅ **Complete** - Migrated to Railway for real-time WebSocket support

## 🔒 Security

- All sensitive credentials stored in GitHub Secrets
- Gmail App Password used instead of OAuth
- No API keys exposed in code
- Secure SMTP authentication

## 📝 Logging

- Local: `chp_scraper_debug.log`
- GitHub Actions: Built-in logging
- Structured logging with timestamps

## 🛠️ Development

### Adding New Features
1. Create new modules in `src/core/` or `src/utils/`
2. Update scrapers in `src/scrapers/`
3. Test locally with `bin/scrape_local.py`
4. Test Railway scraper with `src/scrapers/continuous_scraper.py`
5. Update Railway configuration if needed

### Testing
```bash
# Test local scraper
python bin/scrape_local.py --once --center BCCC

# Test batch scraper locally
COMMUNICATION_CENTER=BCCC python bin/scrape_batch.py

# Test Railway continuous scraper
python src/scrapers/continuous_scraper.py

# Test WebSocket server
# Frontend will connect to ws://localhost:8080
```

### WebSocket Testing Suite
The `testing_suite/` directory contains comprehensive WebSocket testing tools:

```bash
# Start simple test WebSocket server
python testing_suite/test-websocket-server.py

# Start Railway WebSocket server
python testing_suite/start-websocket-server.py

# Open interactive diagnostic page
open testing_suite/websocket-test.html
```

**Testing Tools:**
- **`test-websocket-server.py`** - Simple WebSocket server for connection testing
- **`start-websocket-server.py`** - Starts the actual Railway WebSocket server
- **`websocket-test.html`** - Interactive diagnostic page with real-time testing
- **`WEBSOCKET_TROUBLESHOOTING.md`** - Comprehensive troubleshooting guide
- **`TESTING_SUITE.md`** - Complete testing suite documentation

## 🗺️ Deployment & Migration

### ✅ **Migration Complete**
- **Status**: Successfully migrated from GitHub Pages/Vercel to Railway
- **Performance**: Real-time WebSocket updates every 5 seconds
- **Configuration**: Optimized `railway.toml` and `railway.json`
- **Framework**: Full-stack deployment with built-in WebSocket server
- **Cost**: $5-15/month (vs $35-40/month for Vercel Pro + Pusher)

### 🚀 **Current Architecture**
- **Continuous Scraper**: Runs every 5 seconds with WebSocket broadcasting
- **Built-in WebSocket**: No external dependencies (replaces Pusher)
- **Real-time Updates**: Sub-second latency for frontend clients
- **Multi-center Support**: BCCC, LACC, OCCC, SACC

### 📈 **Benefits Achieved**
- **12x faster updates** (5s vs 60s intervals)
- **No external dependencies** (built-in WebSocket server)
- **Cost effective** ($5-15/month vs $35-40/month)
- **Real-time updates** with sub-second latency
- **Preserved functionality** (email notifications, data persistence)

## 📄 License

MIT License - see LICENSE file for details.