#!/usr/bin/env python3
"""
Start Railway WebSocket Server
Starts the actual Railway WebSocket server from the continuous scraper
"""

import asyncio
import sys
import os
import logging

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def main():
    """Start the Railway WebSocket server"""
    try:
        from scrapers.continuous_scraper import RailwayWebSocketServer
        
        logger.info("🚀 Starting Railway WebSocket Server...")
        
        # Create and start the WebSocket server
        ws_server = RailwayWebSocketServer(port=8080)
        await ws_server.start_server()
        
        logger.info("✅ Railway WebSocket Server started successfully!")
        logger.info("📋 Server endpoints:")
        logger.info("   - HTTP: http://localhost:8080")
        logger.info("   - WebSocket: ws://localhost:8080/ws")
        logger.info("   - Health check: http://localhost:8080/health")
        logger.info("   - Press Ctrl+C to stop the server")
        
        # Keep the server running
        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            logger.info("🛑 Shutting down Railway WebSocket Server...")
            
    except ImportError as e:
        logger.error(f"❌ Failed to import Railway WebSocket Server: {e}")
        logger.error("Make sure you're in the project root directory")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Failed to start Railway WebSocket Server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🚀 Railway WebSocket Server Starter")
    print("====================================")
    print("This will start the actual Railway WebSocket server.")
    print("Make sure you have all dependencies installed.")
    print()
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
