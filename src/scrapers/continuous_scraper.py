#!/usr/bin/env python3
"""
Continuous Railway Scraper
Runs 24/7 with 5-second intervals for real-time updates
"""
import asyncio
import logging
import os
import sys
import json
import aiohttp
from aiohttp import web
from datetime import datetime
from typing import Dict, List, Any

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from core.data_manager import DataManager
from core.email_notifier import EmailNotifier
from scrapers.http_scraper import HTTPScraper

class RailwayWebSocketServer:
    """Built-in WebSocket server for Railway deployment"""
    
    def __init__(self, port=8080):
        self.port = port
        self.clients = set()
        self.server = None
        self.app = None
    
    async def register_client(self, websocket):
        """Register a new WebSocket client"""
        self.clients.add(websocket)
        print(f"📡 Client connected. Total clients: {len(self.clients)}")
    
    async def unregister_client(self, websocket):
        """Unregister a WebSocket client"""
        self.clients.discard(websocket)
        print(f"📡 Client disconnected. Total clients: {len(self.clients)}")
    
    async def broadcast_incidents(self, incidents_data: Dict[str, Any]):
        """Broadcast incident data to all connected clients"""
        if not self.clients:
            return
        
        message = json.dumps(incidents_data)
        disconnected = set()
        
        for client in self.clients:
            try:
                await client.send(message)
            except Exception as e:
                print(f"📡 WebSocket send error: {e}")
                disconnected.add(client)
        
        # Remove disconnected clients
        self.clients -= disconnected
        
        if self.clients:
            print(f"📡 Broadcasted to {len(self.clients)} clients")
    
    def setup_http_routes(self):
        """Set up HTTP routes for serving frontend"""
        self.app = web.Application()
        
        # Add explicit route for index.html
        async def serve_index(request):
            try:
                print(f"📁 Serving index.html from {os.getcwd()}")
                print(f"📁 Files in current directory: {os.listdir('.')}")
                with open('index.html', 'r') as f:
                    content = f.read()
                return web.Response(text=content, content_type='text/html')
            except FileNotFoundError as e:
                print(f"❌ Index file not found: {e}")
                return web.Response(text='Index file not found', status=404)
            except Exception as e:
                print(f"❌ Error serving index: {e}")
                return web.Response(text=f'Error: {e}', status=500)
        
        self.app.router.add_get('/', serve_index)
        
        # Serve static files (JS, CSS, assets)
        self.app.router.add_static('/js/', path='js/', name='js')
        self.app.router.add_static('/assets/', path='assets/', name='assets')
        self.app.router.add_static('/data/', path='data/', name='data')
        
        # Health check endpoint
        async def health_check(request):
            return web.json_response({
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'websocket_clients': len(self.clients)
            })
        
        self.app.router.add_get('/health', health_check)
        
        # WebSocket endpoint - Railway format
        async def websocket_handler(request):
            # Get Railway WebSocket parameters
            upgrade_wait = request.query.get('upgrade_wait', '0s')
            first_msg_wait = request.query.get('first_msg_wait', '0s')
            
            print(f"🔌 WebSocket upgrade request - upgrade_wait: {upgrade_wait}, first_msg_wait: {first_msg_wait}")
            
            ws = web.WebSocketResponse()
            await ws.prepare(request)
            
            await self.register_client(ws)
            
            # Send initial message after first_msg_wait
            if first_msg_wait != '0s':
                try:
                    wait_seconds = float(first_msg_wait.replace('s', ''))
                    await asyncio.sleep(wait_seconds)
                except:
                    pass
            
            # Send welcome message
            await ws.send_str(json.dumps({
                'type': 'welcome',
                'message': 'Connected to CHP Traffic Monitor WebSocket',
                'timestamp': datetime.now().isoformat(),
                'upgrade_wait': upgrade_wait,
                'first_msg_wait': first_msg_wait
            }))
            
            try:
                async for msg in ws:
                    if msg.type == aiohttp.WSMsgType.TEXT:
                        # Handle incoming messages
                        try:
                            data = json.loads(msg.data)
                            print(f"📨 Received message: {data}")
                        except json.JSONDecodeError:
                            print(f"📨 Received text: {msg.data}")
                    elif msg.type == aiohttp.WSMsgType.ERROR:
                        print(f"❌ WebSocket error: {ws.exception()}")
            finally:
                await self.unregister_client(ws)
            
            return ws
        
        self.app.router.add_get('/ws', websocket_handler)
        
        # Enable CORS for WebSocket connections
        async def cors_handler(request):
            response = web.Response()
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
            return response
        
        self.app.router.add_options('/ws', cors_handler)
    
    async def start_server(self):
        """Start the HTTP and WebSocket server"""
        print(f"🚀 Starting HTTP and WebSocket server on port {self.port}")
        
        # Set up HTTP routes
        self.setup_http_routes()
        
        # Start the server
        runner = web.AppRunner(self.app)
        await runner.setup()
        site = web.TCPSite(runner, "0.0.0.0", self.port)
        await site.start()
        
        print(f"✅ HTTP server running on http://0.0.0.0:{self.port}")
        print(f"✅ WebSocket server running on ws://0.0.0.0:{self.port}/ws")

class ContinuousRailwayScraper:
    """Continuous scraper for Railway deployment using HTTP requests"""
    
    def __init__(self):
        # All 25 CHP communication centers
        self.centers = [
            'BFCC', 'BSCC', 'BICC', 'BCCC', 'CCCC', 'CHCC', 'ECCC', 'FRCC', 'GGCC', 'HMCC',
            'ICCC', 'INCC', 'LACC', 'MRCC', 'MYCC', 'OCCC', 'RDCC', 'SACC', 'SLCC', 'SKCCSTCC',
            'SUCC', 'TKCC', 'UKCC', 'VTCC', 'YKCC'
        ]
        self.center_info = {
            'BFCC': {'name': 'Bakersfield', 'channel': 'chp-incidents-bfcc'},
            'BSCC': {'name': 'Barstow', 'channel': 'chp-incidents-bscc'},
            'BICC': {'name': 'Bishop', 'channel': 'chp-incidents-bicc'},
            'BCCC': {'name': 'Border', 'channel': 'chp-incidents-bccc'},
            'CCCC': {'name': 'Capitol', 'channel': 'chp-incidents-cccc'},
            'CHCC': {'name': 'Chico', 'channel': 'chp-incidents-chcc'},
            'ECCC': {'name': 'El Centro', 'channel': 'chp-incidents-eccc'},
            'FRCC': {'name': 'Fresno', 'channel': 'chp-incidents-frcc'},
            'GGCC': {'name': 'Golden Gate', 'channel': 'chp-incidents-ggcc'},
            'HMCC': {'name': 'Humboldt', 'channel': 'chp-incidents-hmcc'},
            'ICCC': {'name': 'Indio', 'channel': 'chp-incidents-iccc'},
            'INCC': {'name': 'Inland', 'channel': 'chp-incidents-incc'},
            'LACC': {'name': 'Los Angeles', 'channel': 'chp-incidents-lacc'},
            'MRCC': {'name': 'Merced', 'channel': 'chp-incidents-mrcc'},
            'MYCC': {'name': 'Monterey', 'channel': 'chp-incidents-mycc'},
            'OCCC': {'name': 'Orange County', 'channel': 'chp-incidents-occc'},
            'RDCC': {'name': 'Redding', 'channel': 'chp-incidents-rdcc'},
            'SACC': {'name': 'Sacramento', 'channel': 'chp-incidents-sacc'},
            'SLCC': {'name': 'San Luis Obispo', 'channel': 'chp-incidents-slcc'},
            'SKCCSTCC': {'name': 'Stockton', 'channel': 'chp-incidents-skccstcc'},
            'SUCC': {'name': 'Susanville', 'channel': 'chp-incidents-succ'},
            'TKCC': {'name': 'Truckee', 'channel': 'chp-incidents-tkcc'},
            'UKCC': {'name': 'Ukiah', 'channel': 'chp-incidents-ukcc'},
            'VTCC': {'name': 'Ventura', 'channel': 'chp-incidents-vtcc'},
            'YKCC': {'name': 'Yreka', 'channel': 'chp-incidents-ykcc'}
        }
        self.websocket_server = RailwayWebSocketServer()
        self.scrape_interval = 5  # 5-second intervals
        self.is_running = False
        self.http_scraper = HTTPScraper(mode="railway")
        
        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
    
    async def scrape_center(self, center_code: str) -> Dict[str, Any]:
        """Scrape a single communication center using HTTP requests"""
        try:
            print(f"🔄 Scraping {center_code} ({self.center_info[center_code]['name']})...")
            
            # Initialize data manager
            data_manager = DataManager(center_code)
            previous_incidents = data_manager.load_previous_incidents()
            
            # Use HTTP scraper
            result = self.http_scraper.scrape_center_sync(center_code, previous_incidents)
            
            if result['status'] == 'success' and result['incidents']:
                # Convert to the format expected by data_manager
                incidents_data = result['incidents']
                
                # Compare with previous incidents
                changes = data_manager.compare_incidents(incidents_data)
                has_changes = (len(changes.get('new_incidents', [])) > 0 or 
                              len(changes.get('removed_incidents', [])) > 0)
                
                # Save data
                file_updated = data_manager.save_active_incidents(incidents_data)
                data_manager.save_delta_updates(changes)
                data_manager.append_daily_incidents(incidents_data)
                
                # Update previous incidents
                data_manager.update_previous_incidents(incidents_data)
                
                # Prepare WebSocket data
                incidents_json = data_manager.incidents_to_json(incidents_data)
                
                result = {
                    'center': center_code,
                    'centerName': self.center_info[center_code]['name'],
                    'incidents': incidents_json['incidents'],
                    'incidentCount': incidents_json['incident_count'],
                    'timestamp': datetime.now().isoformat(),
                    'hasChanges': has_changes,
                    'changes': changes,
                    'status': 'success'
                }
                
                print(f"✅ {center_code}: {len(incidents_data)} incidents, {len(changes.get('new_incidents', []))} new")
                return result
            else:
                print(f"⚠️ {center_code}: No incidents found")
                return {
                    'center': center_code,
                    'centerName': self.center_info[center_code]['name'],
                    'incidents': [],
                    'incidentCount': 0,
                    'timestamp': datetime.now().isoformat(),
                    'hasChanges': False,
                    'status': 'no_data'
                }
                
        except Exception as e:
            print(f"❌ Error scraping {center_code}: {e}")
            return {
                'center': center_code,
                'centerName': self.center_info[center_code]['name'],
                'error': str(e),
                'timestamp': datetime.now().isoformat(),
                'status': 'error'
            }
    
    async def scrape_all_centers(self) -> List[Dict[str, Any]]:
        """Scrape all communication centers using async HTTP requests"""
        print(f"🚀 Starting parallel HTTP scrape of {len(self.centers)} centers...")
        
        # Use HTTP scraper for async parallel processing
        results = await self.http_scraper.scrape_all_centers_async(self.centers)
        
        # Process results to match expected format
        processed_results = []
        for result in results:
            if result['status'] == 'success':
                # Convert to the format expected by data_manager
                center_code = result['center']
                data_manager = DataManager(center_code)
                previous_incidents = data_manager.load_previous_incidents()
                
                incidents_data = result['incidents']
                
                # Compare with previous incidents
                changes = data_manager.compare_incidents(incidents_data)
                has_changes = (len(changes.get('new_incidents', [])) > 0 or 
                              len(changes.get('removed_incidents', [])) > 0)
                
                # Save data
                file_updated = data_manager.save_active_incidents(incidents_data)
                data_manager.save_delta_updates(changes)
                data_manager.append_daily_incidents(incidents_data)
                
                # Update previous incidents
                data_manager.update_previous_incidents(incidents_data)
                
                # Prepare WebSocket data
                incidents_json = data_manager.incidents_to_json(incidents_data)
                
                processed_result = {
                    'center': center_code,
                    'centerName': self.center_info[center_code]['name'],
                    'incidents': incidents_json['incidents'],
                    'incidentCount': incidents_json['incident_count'],
                    'timestamp': datetime.now().isoformat(),
                    'hasChanges': has_changes,
                    'changes': changes,
                    'status': 'success'
                }
                
                print(f"✅ {center_code}: {len(incidents_data)} incidents, {len(changes.get('new_incidents', []))} new")
            else:
                processed_result = {
                    'center': result['center'],
                    'centerName': self.center_info[result['center']]['name'],
                    'incidents': [],
                    'incidentCount': 0,
                    'timestamp': datetime.now().isoformat(),
                    'hasChanges': False,
                    'status': 'error',
                    'error': result.get('error', 'Unknown error')
                }
                print(f"❌ {result['center']}: {result.get('error', 'Unknown error')}")
            
            processed_results.append(processed_result)
        
        return processed_results
    
    async def broadcast_results(self, results: List[Dict[str, Any]]):
        """Broadcast scraping results to WebSocket clients"""
        for result in results:
            if result['status'] == 'success' and result.get('hasChanges', False):
                # Broadcast individual center updates
                await self.websocket_server.broadcast_incidents({
                    'type': 'incident_update',
                    'data': result
                })
        
        # Broadcast summary
        summary = {
            'type': 'scrape_summary',
            'data': {
                'timestamp': datetime.now().isoformat(),
                'centers': len(results),
                'totalIncidents': sum(r.get('incidentCount', 0) for r in results),
                'results': results
            }
        }
        await self.websocket_server.broadcast_incidents(summary)
    
    async def run_forever(self):
        """Main continuous scraping loop"""
        print("🚀 Starting Continuous Railway Scraper")
        print(f"📡 Scraping {len(self.centers)} centers every {self.scrape_interval} seconds")
        print(f"🌐 WebSocket server will run on port {self.websocket_server.port}")
        print(f"🎯 Centers: {', '.join(self.centers)}")
        
        # Start WebSocket server
        await self.websocket_server.start_server()
        
        self.is_running = True
        iteration = 0
        
        while self.is_running:
            try:
                iteration += 1
                print(f"\n🔄 Iteration {iteration} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                
                # Scrape all centers
                results = await self.scrape_all_centers()
                
                # Broadcast results
                await self.broadcast_results(results)
                
                # Wait for next iteration
                print(f"⏳ Waiting {self.scrape_interval} seconds until next scrape...")
                await asyncio.sleep(self.scrape_interval)
                
            except KeyboardInterrupt:
                print("\n🛑 Received interrupt signal, shutting down...")
                self.is_running = False
                break
            except Exception as e:
                print(f"❌ Error in main loop: {e}")
                print("⏳ Waiting 30 seconds before retry...")
                await asyncio.sleep(30)
        
        # Cleanup
        if self.websocket_server.server:
            self.websocket_server.server.close()
            await self.websocket_server.server.wait_closed()
        
        print("✅ Continuous scraper stopped")

async def main():
    """Main entry point"""
    scraper = ContinuousRailwayScraper()
    await scraper.run_forever()

if __name__ == "__main__":
    asyncio.run(main())
