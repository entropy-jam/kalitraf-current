# WebSocket Troubleshooting Guide

## 🔍 Understanding Your Diagnostic Results

The diagnostic tool is working correctly! The connection failures you're seeing indicate that **no WebSocket server is running on port 8080**. This is expected behavior when the server isn't started.

### What the Errors Mean

- **Error: WebSocket connection failed** - No server listening on port 8080
- **Closed: 1006** - Connection closed abnormally (server not available)
- **Duration: 53ms** - Quick failure indicates no server response

## 🚀 Solutions

### Option 1: Start the Railway WebSocket Server (Recommended)

The project includes a Railway WebSocket server in `src/scrapers/continuous_scraper.py`. To start it:

```bash
# Install dependencies first
pip install aiohttp websockets

# Start the Railway WebSocket server
python start-websocket-server.py
```

This will start the actual Railway WebSocket server on port 8080.

### Option 2: Start the Test WebSocket Server

For testing purposes, you can use the simple test server:

```bash
# Install websockets if not already installed
pip install websockets

# Start the test server
python test-websocket-server.py
```

This will start a minimal WebSocket server for testing connections.

### Option 3: Check if Server is Already Running

Check if something is already running on port 8080:

```bash
# Check what's running on port 8080
lsof -i :8080

# Or use netstat
netstat -an | grep 8080
```

## 🧪 Testing the Fix

1. **Start a WebSocket server** (Option 1 or 2 above)
2. **Refresh your browser** on the diagnostic page
3. **Click "Run Full Diagnostic"** again
4. **You should now see**:
   - ✅ Successful connections
   - ✅ Server status showing "WebSocket server is running"
   - ✅ Detailed connection information

## 📊 Expected Results After Fix

### Before (No Server):
```
❌ Railway WS: error (53ms)
❌ Local WS: error (74ms)
🚨 STATUS: No WebSocket server detected on port 8080
```

### After (Server Running):
```
✅ Railway WS: success (45ms)
✅ Local WS: success (32ms)
✅ STATUS: Railway WebSocket server is running
```

## 🔧 Your Project's WebSocket Architecture

Your project has a sophisticated WebSocket setup:

1. **Railway WebSocket Server** (`src/scrapers/continuous_scraper.py`)
   - Runs on port 8080
   - Handles real-time incident updates
   - Supports Railway deployment parameters
   - Includes HTTP routes for serving the frontend

2. **Frontend WebSocket Client** (`js/services/railway-websocket-service.js`)
   - Connects to the Railway server
   - Handles reconnection logic
   - Processes incident updates

3. **Diagnostic Tool** (`js/websocket-diagnostic.js`)
   - Tests WebSocket connections
   - Analyzes protocol compatibility
   - Provides troubleshooting guidance

## 🚨 Common Issues and Solutions

### Issue: "Failed to construct 'WebSocket': An insecure WebSocket connection may not be initiated from a page loaded over HTTPS"

**Solution**: ✅ **FIXED** - The code now automatically detects HTTPS and uses `wss://` instead of `ws://`

### Issue: "WebSocket connection failed"

**Solution**: Start the WebSocket server using one of the options above

### Issue: "Closed: 1006"

**Solution**: This indicates the server closed the connection abnormally. Usually means the server isn't running or crashed.

### Issue: Export button not working

**Solution**: ✅ **FIXED** - The export functionality now works properly

## 🎯 Next Steps

1. **Start the WebSocket server** using Option 1 or 2 above
2. **Test the connections** with the diagnostic tool
3. **Verify your main application** works with WebSocket connections
4. **Deploy to Railway** when ready (the server is designed for Railway deployment)

## 📝 Notes

- The diagnostic tool is working perfectly - it's correctly identifying that no server is running
- Your WebSocket client code is properly configured
- The protocol detection and URL generation are working correctly
- You just need to start the server to complete the setup

The "errors" you're seeing are actually the diagnostic tool doing its job - telling you that the WebSocket server isn't running, which is exactly what you need to know!
