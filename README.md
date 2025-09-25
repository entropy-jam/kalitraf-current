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
│   │   └── email_notifier.py    # SMTP email notifications
│   ├── scrapers/                # Scraper implementations
│   │   ├── local_scraper.py     # Local development scraper
│   │   └── github_scraper.py    # GitHub Actions scraper
│   └── utils/                   # Utility modules
├── data/                        # JSON data storage
│   ├── active_incidents_[CENTER].json  # Current incidents per center
│   ├── incident_deltas_[CENTER].json   # Change deltas per center
│   └── YYYY-MM-DD_incidents_[CENTER].json  # Daily archives per center
├── scrape_local.py             # Local scraper entry point
└── scrape_github.py           # GitHub Actions entry point
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
│   │   └── incident-service.js # Incident data operations
│   ├── controllers/            # Application controllers
│   │   └── app-controller.js   # Main application controller
│   ├── cache.js               # Legacy cache module
│   ├── virtual-scroll.js      # Virtual scrolling implementation
│   ├── data-manager.js        # Legacy data management
│   ├── ui-controller.js       # Legacy UI controller
│   └── app.js                 # Application entry point
├── styles.css                 # Separated CSS styles
└── index.html                 # Clean HTML structure
```

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run local scraper (once)
python scrape_local.py --once --center BCCC

# Run continuous monitoring
python scrape_local.py --center BCCC --interval 60 --iterations 10
```

### GitHub Actions
The system automatically runs every minute via GitHub Actions, scraping incidents and sending email notifications when changes are detected.

## 📧 Email Notifications

Configure email notifications by setting environment variables:
- `GMAIL_SENDER_EMAIL`: Your Gmail address
- `GMAIL_RECIPIENT_EMAIL`: Recipient email address  
- `GMAIL_APP_PASSWORD`: Gmail App Password (16 characters)

## 🎯 Features

- **Modular Design**: Clean separation of concerns
- **Real-time Monitoring**: Scrapes every minute
- **Email Alerts**: Instant notifications for new/resolved incidents
- **Data Persistence**: JSON storage with historical tracking
- **Multi-center Support**: BCCC, CCC, NCCC, SCCC
- **GitHub Pages**: Live web dashboard

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

## 🌐 GitHub Pages

Live dashboard available at: https://entropy-jam.github.io/chp-scraper/

Features:
- Real-time incident display
- Communication center selection
- Auto-refresh every 30 seconds
- Responsive design

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
3. Test locally with `scrape_local.py`
4. Update GitHub Actions workflow if needed

### Testing
```bash
# Test local scraper
python scrape_local.py --once --center BCCC

# Test GitHub scraper locally
COMMUNICATION_CENTER=BCCC python scrape_github.py
```

## 🗺️ Roadmap: Dynamic Hosting

**Current**: GitHub Pages (30-60s update delay)  
**Planned**: Vercel/Netlify with WebSockets (<1s updates)

- **1**: API backend + real-time frontend
- **2**: Advanced features + mobile app

**Benefits**: 10x faster updates, real-time notifications, better scalability

## 📄 License

MIT License - see LICENSE file for details.