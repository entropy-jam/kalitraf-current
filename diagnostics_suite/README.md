# WebSocket Testing Suite

This directory contains tools and scripts for testing WebSocket connections in the CHP Traffic Monitor project.

## 📁 Files

### Test Scripts
- **`test-websocket-server.py`** - Simple WebSocket test server for debugging connections
- **`start-websocket-server.py`** - Starts the actual Railway WebSocket server from the project
- **`websocket-test.html`** - Interactive diagnostic page for testing WebSocket connections

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
