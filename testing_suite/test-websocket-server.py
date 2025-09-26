#!/usr/bin/env python3
"""
Simple WebSocket Test Server
A minimal WebSocket server for testing WebSocket connections on port 8080
"""

import asyncio
import websockets
import json
import logging
from datetime import datetime
import signal
import sys

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TestWebSocketServer:
    def __init__(self, host="localhost", port=8080):
        self.host = host
        self.port = port
        self.clients = set()
        self.server = None
        self.running = False
        
    async def register_client(self, websocket):
        """Register a new WebSocket client"""
        self.clients.add(websocket)
        logger.info(f"📡 Client connected from {websocket.remote_address}. Total clients: {len(self.clients)}")
        
        # Send welcome message
        welcome_msg = {
            "type": "welcome",
            "message": "Connected to Test WebSocket Server",
            "timestamp": datetime.now().isoformat(),
            "server": "test-websocket-server",
            "version": "1.0.0"
        }
        await websocket.send(json.dumps(welcome_msg))
        
    async def unregister_client(self, websocket):
        """Unregister a WebSocket client"""
        self.clients.discard(websocket)
        logger.info(f"📡 Client disconnected from {websocket.remote_address}. Total clients: {len(self.clients)}")
        
    async def handle_client(self, websocket, path):
        """Handle a WebSocket client connection"""
        await self.register_client(websocket)
        
        try:
            # Send periodic test messages
            message_count = 0
            while self.running:
                try:
                    # Wait for incoming messages
                    message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                    
                    try:
                        data = json.loads(message)
                        logger.info(f"📨 Received JSON: {data}")
                        
                        # Echo back with timestamp
                        response = {
                            "type": "echo",
                            "original": data,
                            "timestamp": datetime.now().isoformat(),
                            "message_count": message_count
                        }
                        await websocket.send(json.dumps(response))
                        
                    except json.JSONDecodeError:
                        logger.info(f"📨 Received text: {message}")
                        # Echo back text
                        await websocket.send(f"Echo: {message}")
                        
                except asyncio.TimeoutError:
                    # Send periodic heartbeat
                    message_count += 1
                    heartbeat = {
                        "type": "heartbeat",
                        "timestamp": datetime.now().isoformat(),
                        "message_count": message_count,
                        "clients_connected": len(self.clients)
                    }
                    await websocket.send(json.dumps(heartbeat))
                    
                except websockets.exceptions.ConnectionClosed:
                    break
                    
        except Exception as e:
            logger.error(f"❌ Error handling client: {e}")
        finally:
            await self.unregister_client(websocket)
            
    async def broadcast_message(self, message):
        """Broadcast a message to all connected clients"""
        if not self.clients:
            return
            
        message_str = json.dumps(message) if isinstance(message, dict) else message
        disconnected = set()
        
        for client in self.clients:
            try:
                await client.send(message_str)
            except websockets.exceptions.ConnectionClosed:
                disconnected.add(client)
                
        # Remove disconnected clients
        self.clients -= disconnected
        
        if self.clients:
            logger.info(f"📢 Broadcasted message to {len(self.clients)} clients")
            
    async def start_server(self):
        """Start the WebSocket server"""
        logger.info(f"🚀 Starting Test WebSocket Server on {self.host}:{self.port}")
        
        self.running = True
        self.server = await websockets.serve(
            self.handle_client,
            self.host,
            self.port,
            ping_interval=20,
            ping_timeout=10
        )
        
        logger.info(f"✅ Test WebSocket Server running on ws://{self.host}:{self.port}")
        logger.info("📋 Available endpoints:")
        logger.info("   - ws://localhost:8080 (WebSocket connection)")
        logger.info("   - Send JSON messages to get echo responses")
        logger.info("   - Server sends periodic heartbeat messages")
        logger.info("   - Press Ctrl+C to stop the server")
        
        # Set up signal handlers for graceful shutdown
        def signal_handler(signum, frame):
            logger.info("🛑 Received shutdown signal")
            self.running = False
            
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        try:
            # Keep the server running
            await self.server.wait_closed()
        except KeyboardInterrupt:
            logger.info("🛑 Keyboard interrupt received")
        finally:
            await self.stop_server()
            
    async def stop_server(self):
        """Stop the WebSocket server"""
        logger.info("🛑 Stopping Test WebSocket Server...")
        self.running = False
        
        if self.server:
            self.server.close()
            await self.server.wait_closed()
            
        logger.info("✅ Test WebSocket Server stopped")

async def main():
    """Main function to run the test server"""
    server = TestWebSocketServer()
    
    try:
        await server.start_server()
    except Exception as e:
        logger.error(f"❌ Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🔍 WebSocket Test Server")
    print("========================")
    print("This server will help you test WebSocket connections.")
    print("Run this in a separate terminal and then test with the diagnostic tool.")
    print()
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
