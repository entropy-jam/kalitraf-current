# CHP Traffic Incident Scraper - SSE Edition

A real-time California Highway Patrol traffic incident monitoring system using **Server-Sent Events (SSE)** for live updates. This is a streamlined, SSE-only implementation that eliminates file dependencies and provides instant real-time updates.

## 🏗️ Architecture Overview

### **SSE-Only Design**
- **Backend**: Python scraper with built-in HTTP server and SSE streaming
- **Frontend**: JavaScript client that connects via SSE for real-time updates
- **Data Flow**: Scraper → HTTP Server → SSE Stream → Frontend (no file storage)
- **Deployment**: Railway with automatic scaling and zero configuration

### **Key Features**
- ⚡ **Real-time Updates**: SSE streaming with sub-second latency
- 🚫 **No File Dependencies**: Data flows directly from scraper to frontend
- 🌐 **Railway Deployment**: One-click deployment with automatic scaling
- 📱 **Responsive UI**: Modern, mobile-friendly interface
- 🔄 **Auto-reconnection**: Robust SSE connection handling
- 💰 **Cost Effective**: $5-15/month (vs $35-40/month for WebSocket alternatives)

## 📁 Project Structure

```
/Users/jace/Desktop/nick traffic/
├── src/                           # Python Backend (SSE-only)
│   ├── core/                      # Core modules
│   │   ├── data_manager.py        # Data management (SSE streaming)
│   │   ├── incident_parser.py     # CHP data parsing
│   │   ├── center_mapper.py       # Center code mapping
│   │   └── ...                    # Other core modules
│   └── scrapers/
│       └── continuous_scraper.py  # Main SSE scraper
├── js/                            # JavaScript Frontend (SSE-only)
│   ├── app-railway.js            # Main Railway app entry point
│   ├── config/
│   │   └── railway-dependency-config.js  # SSE-only dependency injection
│   ├── controllers/
│   │   └── railway-app-controller.js     # SSE-only app controller
│   ├── services/
│   │   ├── sse-service.js         # SSE connection handling
│   │   ├── incident-realtime-service.js  # Real-time data processing
│   │   ├── incident-data-service.js      # Data caching
│   │   └── ...                    # Other SSE services
│   └── ...                        # UI components and utilities
├── assets/                        # Static assets
│   ├── styles.css                # CSS styles
│   └── chromedriver-mac-arm64/   # Chrome driver (local dev only)
├── diagnostics_suite/             # Testing and diagnostics
├── email_templates/               # Email notification templates
├── docs/                          # Documentation
├── index.html                     # Main HTML file
├── package.json                   # Node.js dependencies (minimal)
├── requirements.txt               # Python dependencies
├── railway.toml                   # Railway deployment config
├── Dockerfile                     # Docker configuration
└── docker-compose.yml             # Docker Compose config
```

## 🚀 Quick Start

### **Railway Deployment (Recommended)**
1. **Fork this repository**
2. **Connect to Railway**: [Deploy to Railway](https://railway.app/template)
3. **Deploy**: Railway automatically builds and deploys
4. **Access**: Your live dashboard will be available at `https://your-app.railway.app`

### **Local Development**
```bash
# Clone the repository
git clone https://github.com/your-username/chp-traffic-scraper.git
cd chp-traffic-scraper

# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies (minimal)
npm install

# Run the SSE scraper locally
python src/scrapers/continuous_scraper.py

# Open in browser
open http://localhost:8080
```

### **Docker Development**
```bash
# Build and run with Docker
./docker-commands.sh build
./docker-commands.sh run

# Access the application
open http://localhost:8080
```

## 🔧 Configuration

### **Environment Variables**
- `COMMUNICATION_CENTER`: Center to scrape (default: BCCC)
- `ENABLE_EMAIL_NOTIFICATIONS`: Enable/disable emails (default: false)
- `GMAIL_SENDER_EMAIL`: Sender email address
- `GMAIL_RECIPIENT_EMAIL`: Recipient email address
- `GMAIL_APP_PASSWORD`: Gmail App Password

### **Communication Centers**
The system supports all 25 CHP Communication Centers:
- **BCCC**: Border Communications Center
- **LACC**: Los Angeles Communications Center
- **SACC**: Sacramento Communications Center
- **OCCC**: Orange County Communications Center
- **GGCC**: Golden Gate Communications Center
- **FRCC**: Fresno Communications Center
- **CHCC**: Chico Communications Center
- **HMCC**: Humboldt Communications Center
- **INCC**: Inland Communications Center
- **ICCC**: Indio Communications Center
- **MRCC**: Merced Communications Center
- **MYCC**: Monterey Communications Center
- **RDCC**: Redding Communications Center
- **SLCC**: San Luis Obispo Communications Center
- **SKCCSTCC**: Stockton Communications Center
- **SUCC**: Susanville Communications Center
- **TKCC**: Truckee Communications Center
- **UKCC**: Ukiah Communications Center
- **VTCC**: Ventura Communications Center
- **YKCC**: Yreka Communications Center
- **BFCC**: Bakersfield Communications Center
- **BSCC**: Barstow Communications Center
- **BICC**: Bishop Communications Center
- **CCCC**: Capitol Communications Center
- **ECCC**: El Centro Communications Center

## 🌐 SSE Implementation

### **Backend SSE Server**
The Python scraper includes a built-in HTTP server with SSE streaming:

```python
# SSE endpoint for real-time updates
@app.get('/api/incidents/stream')
async def stream_incidents(request):
    async def event_generator():
        while True:
            # Scrape data every 5 seconds
            incidents = await scrape_incidents()
            
            # Stream to all connected clients
            yield f"data: {json.dumps(incidents)}\n\n"
            await asyncio.sleep(5)
    
    return StreamingResponse(event_generator(), media_type='text/plain')
```

### **Frontend SSE Client**
The JavaScript frontend connects via SSE for real-time updates:

```javascript
// SSE connection for real-time updates
class SSEService {
    connect() {
        this.eventSource = new EventSource('/api/incidents/stream');
        
        this.eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleIncidentUpdate(data);
        };
    }
}
```

### **Data Flow**
1. **Scraper**: Runs every 5 seconds, scrapes CHP website
2. **HTTP Server**: Receives scraped data, streams via SSE
3. **SSE Stream**: Real-time data stream to all connected clients
4. **Frontend**: Receives updates, updates UI instantly

## 📊 Data Format

### **SSE Message Format**
```json
{
  "type": "incident_update",
  "center": "BCCC",
  "data": {
    "center_code": "BCCC",
    "center_name": "Border",
    "incident_count": 18,
    "incidents": [
      {
        "id": "240928-001",
        "time": "2025-09-28T14:30:00",
        "location": "I-5 N at Border",
        "description": "Traffic collision",
        "severity": "Moderate"
      }
    ],
    "last_updated": "2025-09-28T17:45:19.641000"
  }
}
```

### **Message Types**
- `incident_update`: Individual center updates
- `initial_data`: Complete data on connection
- `scrape_summary`: Scraping results summary
- `delta_update`: New/removed incidents

## 🎯 Features

### **Real-time Monitoring**
- ⚡ **5-second intervals**: Scrapes CHP website every 5 seconds
- 🔄 **Live updates**: SSE streaming with sub-second latency
- 📱 **Multi-center**: All 25 CHP Communication Centers
- 🔄 **Auto-reconnection**: Robust connection handling

### **Modern UI**
- 📱 **Responsive design**: Works on desktop, tablet, and mobile
- 🎨 **Dark/Light theme**: Automatic theme switching
- 🔍 **Real-time filtering**: Filter by center, type, location
- 📋 **Copy to clipboard**: Easy incident sharing

### **Email Notifications**
- 📧 **Instant alerts**: New incident notifications
- 🔔 **Resolved alerts**: Incident resolution notifications
- ⚙️ **Configurable**: Enable/disable via environment variables

### **Deployment**
- 🚀 **Railway**: One-click deployment with automatic scaling
- 🐳 **Docker**: Containerized deployment option
- 🔧 **Zero config**: Works out of the box

## 🔒 Security

- **No API keys**: No external API dependencies
- **Environment variables**: All sensitive data in environment variables
- **HTTPS**: Automatic HTTPS on Railway
- **CSP headers**: Content Security Policy for XSS protection

## 🛠️ Development

### **Adding New Features**
1. **Backend**: Add modules in `src/core/` or `src/scrapers/`
2. **Frontend**: Add services in `js/services/`
3. **UI**: Add components in `js/` directory
4. **Testing**: Use `diagnostics_suite/` for testing

### **Testing**
```bash
# Test SSE scraper locally
python src/scrapers/continuous_scraper.py

# Test with diagnostics
open diagnostics_suite/sse-diagnostics.py

# Test Docker deployment
./docker-commands.sh dev
```

### **Debugging**
- **SSE Connection**: Check browser Network tab for SSE stream
- **Scraper**: Check console logs for scraping status
- **Data Flow**: Use `diagnostics_suite/` tools

## 📈 Performance

### **SSE vs WebSocket**
- **SSE**: Simpler, more reliable, better browser support
- **WebSocket**: More complex, requires connection management
- **Choice**: SSE chosen for simplicity and reliability

### **Scraping Performance**
- **Interval**: 5 seconds (configurable)
- **Centers**: All 25 centers in parallel
- **Latency**: Sub-second from scrape to UI update
- **Reliability**: Auto-retry on failures

## 🗺️ Deployment Options

### **Railway (Recommended)**
- **Cost**: $5-15/month
- **Features**: Automatic scaling, HTTPS, zero config
- **Deployment**: One-click from GitHub
- **URL**: `https://your-app.railway.app`

### **Docker**
- **Local**: `docker-compose up`
- **Production**: Deploy to any Docker host
- **Ports**: 8080 (HTTP/SSE), 3000 (Frontend)

### **Local Development**
- **Python**: `python src/scrapers/continuous_scraper.py`
- **Frontend**: Served by Python HTTP server
- **URL**: `http://localhost:8080`

## 📝 Migration from WebSocket

### **What Changed**
- ✅ **WebSocket → SSE**: Simpler, more reliable
- ✅ **File storage → Direct streaming**: No file dependencies
- ✅ **Multi-center → SSE-only**: Streamlined architecture
- ✅ **Complex setup → Zero config**: Railway deployment

### **What Stayed**
- ✅ **Real-time updates**: Still sub-second latency
- ✅ **All 25 centers**: Full CHP coverage
- ✅ **Email notifications**: Still supported
- ✅ **Responsive UI**: Same modern interface

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** with `diagnostics_suite/`
5. **Submit** a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- **CHP**: California Highway Patrol for providing incident data
- **Railway**: For seamless deployment platform
- **Community**: For feedback and contributions

---

**Live Demo**: [Deploy to Railway](https://railway.app/template) | **Issues**: [GitHub Issues](https://github.com/your-username/chp-traffic-scraper/issues) | **Documentation**: [Full Docs](docs/README.md)
