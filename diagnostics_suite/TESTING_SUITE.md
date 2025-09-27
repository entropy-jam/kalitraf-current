# WebSocket & HTTP Testing Suite

This directory contains tools and scripts for testing WebSocket connections and HTTP-based scraping in the CHP Traffic Monitor project.

## 📁 Files

### Test Scripts
- **`test-websocket-server.py`** - Simple WebSocket test server for debugging connections
- **`start-websocket-server.py`** - Starts the actual Railway WebSocket server from the project
- **`websocket-test.html`** - Interactive diagnostic page for testing WebSocket connections
- **`app-diagnostic.js`** - Comprehensive application initialization diagnostic script
- **`app-diagnostic-test.html`** - Interactive diagnostic page for testing application initialization
- **`server-test.html`** - Comprehensive server-side functionality testing suite
- **`http-scraper-test.py`** - HTTP-based scraper testing for all 25 communication centers
- **`http-server-test.py`** - Production-like server testing and load testing
- **`railway-http-diagnostic.py`** - Railway-specific HTTP testing through actual Railway deployment

### Documentation
- **`WEBSOCKET_TROUBLESHOOTING.md`** - Comprehensive troubleshooting guide for WebSocket issues

## 🚀 Quick Start

### 1. Test WebSocket Connections
```bash
# Start the test server
python test-websocket-server.py

# In another terminal, open the diagnostic page
open websocket-test.html
```

### 2. Start the Railway WebSocket Server
```bash
# Start the actual project WebSocket server
python start-websocket-server.py
```

### 3. Run Diagnostics
Open `websocket-test.html` in your browser to run comprehensive WebSocket diagnostics.

### 4. Test Application Initialization
Open `app-diagnostic-test.html` in your browser to run comprehensive application initialization diagnostics.

### 5. Test Server-Side Functionality
Open `server-test.html` in your browser to run comprehensive server-side functionality tests including:
- Data endpoints accessibility
- WebSocket connection validation
- Static file serving verification
- Server performance measurement

### 6. Test HTTP-Based Scraping
```bash
# Test all 25 communication centers with HTTP requests
python http-scraper-test.py

# Test production-like server conditions
python http-server-test.py

# Test HTTP requests through Railway deployment
python railway-http-diagnostic.py
```

## 🔧 Usage

### Test Server (`test-websocket-server.py`)
- Runs on `ws://localhost:8080`
- Sends periodic heartbeat messages
- Echoes back any messages sent to it
- Useful for testing WebSocket client connections

### Railway Server (`start-websocket-server.py`)
- Starts the actual Railway WebSocket server
- Includes HTTP routes for serving the frontend
- Handles real-time incident updates
- Production-ready server

### Diagnostic Page (`websocket-test.html`)
- Interactive WebSocket connection testing
- Environment analysis
- Protocol detection
- Connection status monitoring
- Export diagnostic results

### Application Diagnostic (`app-diagnostic.js`)
- Comprehensive application initialization testing
- Dependency checking
- Service initialization testing
- DOM element validation
- Script loading verification
- Application controller testing

### Application Diagnostic Page (`app-diagnostic-test.html`)
- Interactive application initialization testing
- Visual dependency status
- Service initialization results
- Application controller status
- Detailed error reporting
- Export diagnostic results

### HTTP Scraper Test (`http-scraper-test.py`)
- Tests all 25 CHP communication centers with HTTP requests
- Synchronous and asynchronous testing modes
- Comprehensive incident parsing and validation
- Details link functionality testing
- Performance benchmarking
- Migration viability assessment
- Detailed JSON report generation

### HTTP Server Test (`http-server-test.py`)
- Production-like load testing
- 25-center scalability testing
- Rate limiting detection
- Connection pooling optimization
- Resource requirement estimation
- Production readiness assessment
- Scaling recommendations

### Railway HTTP Diagnostic (`railway-http-diagnostic.py`)
- Tests HTTP requests through actual Railway deployment
- Railway environment connectivity testing
- Railway-specific network conditions
- Railway IP address testing
- Railway resource constraints validation
- Production deployment readiness assessment
- Railway CLI integration testing

## 📊 Diagnostic Results

The diagnostic tool will show:
- ✅ **Success**: WebSocket server is running and accepting connections
- ❌ **Error**: No server running or connection issues
- 🔍 **Analysis**: Detailed environment and protocol information

## 🚨 Troubleshooting

See `WEBSOCKET_TROUBLESHOOTING.md` for detailed troubleshooting information.

Common issues:
- **"WebSocket connection failed"** → Start a WebSocket server
- **"Insecure WebSocket connection"** → Use `wss://` for HTTPS pages
- **"Closed: 1006"** → Server not running or crashed

## 🎯 Next Steps

1. **Local Development**: Use `test-websocket-server.py` for testing
2. **Production**: Use `start-websocket-server.py` for the full server
3. **Debugging**: Use `websocket-test.html` for connection diagnostics
4. **Deployment**: The Railway server is ready for production deployment
