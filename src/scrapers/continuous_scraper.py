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

class SSEServer:
    """Server-Sent Events server for Railway deployment"""
    
    def __init__(self, port=8080):
        print(f"🔧 SSEServer.__init__() called with port={port}")
        self.port = port
        self.clients = set()  # Store SSE response objects
        self.server = None
        print("🔧 Creating web.Application()...")
        self.app = web.Application()
        print(f"✅ SSEServer initialized successfully. App type: {type(self.app)}")
    
    async def register_client(self, response):
        """Register a new SSE client"""
        self.clients.add(response)
        print(f"📡 SSE client connected. Total clients: {len(self.clients)}")
    
    async def unregister_client(self, response):
        """Unregister an SSE client"""
        self.clients.discard(response)
        print(f"📡 SSE client disconnected. Total clients: {len(self.clients)}")
    
    async def broadcast_update(self, data: Dict[str, Any]):
        """Broadcast data to all connected SSE clients"""
        print(f"📡 [BROADCAST] Starting broadcast to {len(self.clients)} clients")
        print(f"📡 [BROADCAST] Data type: {data.get('type', 'unknown')}")
        
        if not self.clients:
            print(f"⚠️ [BROADCAST] No clients connected, skipping broadcast")
            return
        
        message = f"data: {json.dumps(data)}\n\n"
        disconnected = set()
        successful_sends = 0
        
        for i, client in enumerate(self.clients):
            try:
                print(f"📤 [BROADCAST] Sending to client {i+1}/{len(self.clients)}")
                await client.write(message.encode())
                successful_sends += 1
                print(f"✅ [BROADCAST] Client {i+1} sent successfully")
            except Exception as e:
                print(f"❌ [BROADCAST] Client {i+1} send error: {e}")
                print(f"❌ [BROADCAST] Error type: {type(e).__name__}")
                disconnected.add(client)
        
        # Remove disconnected clients
        if disconnected:
            print(f"🔌 [BROADCAST] Removing {len(disconnected)} disconnected clients")
            self.clients -= disconnected
        
        print(f"📡 [BROADCAST] Completed: {successful_sends} successful, {len(disconnected)} failed")
        print(f"📡 [BROADCAST] Remaining clients: {len(self.clients)}")
    
    async def get_initial_incident_data(self):
        """Get current incident data for new SSE clients"""
        try:
            print("🔍 Fetching initial incident data for SSE client")
            
            # Get the current incident data from all centers
            all_incidents = {}
            total_incidents = 0
            
            # Data loading disabled for SSE-only implementation
            # All data comes from SSE, no file loading needed
            for center in ['BFCC', 'BSCC', 'BICC', 'BCCC', 'CCCC', 'CHCC', 'ECCC', 'FRCC', 'GGCC', 'HMCC',
                          'ICCC', 'INCC', 'LACC', 'MRCC', 'MYCC', 'OCCC', 'RDCC', 'SACC', 'SLCC', 'SKCCSTCC',
                          'SUCC', 'TKCC', 'UKCC', 'VTCC', 'YKCC']:
                all_incidents[center] = []
            
            # Format as initial data message
            initial_data = {
                'type': 'initial_data',
                'data': {
                    'timestamp': datetime.now().isoformat(),
                    'centers': len(all_incidents),
                    'totalIncidents': total_incidents,
                    'incidents': all_incidents
                }
            }
            
            print(f"✅ Prepared initial data: {len(all_incidents)} centers, {total_incidents} total incidents")
            return initial_data
            
        except Exception as e:
            print(f"❌ Error getting initial incident data: {e}")
            return {
                'type': 'initial_data',
                'data': {
                    'timestamp': datetime.now().isoformat(),
                    'centers': 0,
                    'totalIncidents': 0,
                    'incidents': {},
                    'error': str(e)
                }
            }
    
    def setup_http_routes(self):
        """Set up HTTP routes for serving frontend"""
        print("🔧 setup_http_routes() called")
        print(f"🔧 App object before: {self.app}")
        print(f"🔧 App type: {type(self.app)}")
        
        # Don't recreate the app - use the one from __init__
        if self.app is None:
            print("⚠️  App is None, creating new web.Application()")
            self.app = web.Application()
        else:
            print("✅ Using existing web.Application()")
        
        print(f"🔧 App object after: {self.app}")
        print(f"🔧 App router: {self.app.router}")
        
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
        
        # Static file serving removed - SSE-only implementation
        # All data comes from SSE, no file dependencies
        
        # Health check endpoint
        async def health_check(request):
            return web.json_response({
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'sse_clients': len(self.clients)
            })
        
        self.app.router.add_get('/health', health_check)
        
        # SSE endpoint for real-time updates
        async def sse_endpoint(request):
            connection_id = id(request)
            print(f"🔗 [SSE-{connection_id}] New connection from {request.remote}")
            print(f"🔗 [SSE-{connection_id}] User-Agent: {request.headers.get('User-Agent', 'Unknown')}")
            print(f"🔗 [SSE-{connection_id}] Accept: {request.headers.get('Accept', 'Unknown')}")
            
            response = web.StreamResponse()
            response.headers['Content-Type'] = 'text/event-stream'
            response.headers['Cache-Control'] = 'no-cache'
            response.headers['Connection'] = 'keep-alive'
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Headers'] = 'Cache-Control'
            
            print(f"📡 [SSE-{connection_id}] Preparing response headers")
            await response.prepare(request)
            print(f"📡 [SSE-{connection_id}] Response prepared successfully")
            
            print(f"🔌 [SSE-{connection_id}] Registering client")
            await self.register_client(response)
            print(f"✅ [SSE-{connection_id}] Client registered, total clients: {len(self.clients)}")
            
            try:
                # Send welcome message
                print(f"📤 [SSE-{connection_id}] Sending welcome message")
                welcome_data = {
                    'type': 'welcome',
                    'message': 'Connected to CHP Traffic Monitor SSE',
                    'timestamp': datetime.now().isoformat(),
                    'connection_id': connection_id
                }
                welcome_msg = f"data: {json.dumps(welcome_data)}\n\n"
                await response.write(welcome_msg.encode())
                print(f"✅ [SSE-{connection_id}] Welcome message sent")
                
                # Send initial data immediately
                print(f"📡 [SSE-{connection_id}] Preparing initial incident data")
                try:
                    initial_data = await self.get_initial_incident_data()
                    print(f"📊 [SSE-{connection_id}] Initial data prepared: {len(initial_data.get('data', {}).get('results', []))} centers")
                    
                    initial_msg = f"data: {json.dumps(initial_data)}\n\n"
                    await response.write(initial_msg.encode())
                    print(f"✅ [SSE-{connection_id}] Initial data sent successfully")
                    
                except Exception as initial_error:
                    print(f"❌ [SSE-{connection_id}] Initial data failed: {initial_error}")
                    import traceback
                    print(f"❌ [SSE-{connection_id}] Initial data traceback: {traceback.format_exc()}")
                    
                    error_data = {
                        'type': 'initial_data_error',
                        'message': str(initial_error),
                        'error_type': type(initial_error).__name__
                    }
                    error_msg = f"data: {json.dumps(error_data)}\n\n"
                    await response.write(error_msg.encode())
                
                # Keep connection alive with heartbeat
                heartbeat_count = 0
                while True:
                    await asyncio.sleep(30)  # Send heartbeat every 30 seconds
                    heartbeat_count += 1
                    print(f"💓 [SSE-{connection_id}] Sending heartbeat #{heartbeat_count}")
                    
                    try:
                        heartbeat_data = {
                            'type': 'heartbeat',
                            'timestamp': datetime.now().isoformat(),
                            'count': heartbeat_count,
                            'connection_id': connection_id
                        }
                        heartbeat_msg = f"data: {json.dumps(heartbeat_data)}\n\n"
                        await response.write(heartbeat_msg.encode())
                        print(f"✅ [SSE-{connection_id}] Heartbeat #{heartbeat_count} sent")
                        
                    except Exception as heartbeat_error:
                        print(f"❌ [SSE-{connection_id}] Heartbeat #{heartbeat_count} failed: {heartbeat_error}")
                        break
                    
            except Exception as e:
                print(f"❌ [SSE-{connection_id}] Connection error: {e}")
                print(f"❌ [SSE-{connection_id}] Error type: {type(e).__name__}")
                import traceback
                print(f"❌ [SSE-{connection_id}] Traceback: {traceback.format_exc()}")
            finally:
                print(f"🔌 [SSE-{connection_id}] Unregistering client")
                await self.unregister_client(response)
                print(f"✅ [SSE-{connection_id}] Client unregistered, remaining clients: {len(self.clients)}")
            
            return response
        
        self.app.router.add_get('/api/incidents/stream', sse_endpoint)
        
        # Enable CORS for SSE connections
        async def cors_handler(request):
            response = web.Response()
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Cache-Control'
            return response
        
        self.app.router.add_options('/api/incidents/stream', cors_handler)
    
    async def start_server(self):
        """Start the HTTP and SSE server"""
        print(f"🚀 Starting HTTP and SSE server on port {self.port}")
        print(f"🔧 Current working directory: {os.getcwd()}")
        print(f"🔧 Files in current directory: {os.listdir('.')}")
        
        try:
            # Set up HTTP routes
            print("🔧 Setting up HTTP routes...")
            print(f"🔧 App before setup: {self.app}")
            self.setup_http_routes()
            print("✅ HTTP routes configured")
            print(f"🔧 App after setup: {self.app}")
            
            # Start the server
            print("🔧 Creating web app runner...")
            print(f"🔧 App for runner: {self.app}")
            print(f"🔧 App type: {type(self.app)}")
            runner = web.AppRunner(self.app)
            print("🔧 AppRunner created, calling setup()...")
            await runner.setup()
            print("✅ Web app runner setup complete")
            
            print("🔧 Starting TCP site...")
            print(f"🔧 Binding to 0.0.0.0:{self.port}")
            site = web.TCPSite(runner, "0.0.0.0", self.port)
            print("🔧 TCPSite created, calling start()...")
            await site.start()
            print("✅ TCP site started")
            
            # Store the runner for cleanup
            self.server = runner
            
            print(f"✅ HTTP server running on http://0.0.0.0:{self.port}")
            print(f"✅ SSE server running on http://0.0.0.0:{self.port}/api/incidents/stream")
            print("🎉 Server startup completed successfully!")
            
        except Exception as e:
            print(f"❌ Failed to start HTTP/SSE server: {e}")
            print(f"❌ Error type: {type(e).__name__}")
            import traceback
            print(f"❌ Traceback: {traceback.format_exc()}")
            raise

class ContinuousRailwayScraper:
    """Continuous scraper for Railway deployment using HTTP requests"""
    
    def __init__(self):
        print("🔧 ContinuousRailwayScraper.__init__() called")
        # All 25 CHP communication centers
        self.centers = [
            'BFCC', 'BSCC', 'BICC', 'BCCC', 'CCCC', 'CHCC', 'ECCC', 'FRCC', 'GGCC', 'HMCC',
            'ICCC', 'INCC', 'LACC', 'MRCC', 'MYCC', 'OCCC', 'RDCC', 'SACC', 'SLCC', 'SKCCSTCC',
            'SUCC', 'TKCC', 'UKCC', 'VTCC', 'YKCC'
        ]
        print(f"✅ Centers initialized: {len(self.centers)} centers")
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
        # Use Railway's PORT environment variable, fallback to 8081 for local development
        port = int(os.environ.get('PORT', 8081))
        print(f"🔧 Using port: {port} (from PORT env var: {os.environ.get('PORT', 'not set')})")
        print("🔧 Creating SSEServer...")
        self.sse_server = SSEServer(port=port)
        print("✅ SSEServer created")
        self.scrape_interval = 5  # 5-second intervals
        self.is_running = False
        print("🔧 Creating HTTPScraper...")
        self.http_scraper = HTTPScraper(mode="railway")
        print("✅ HTTPScraper created")
        
        # Setup logging
        print("🔧 Setting up logging...")
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        print("✅ Logging configured")
        print("🎉 ContinuousRailwayScraper initialization completed!")
    
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
                
                # Save data - DISABLED for SSE-only implementation
                # file_updated = data_manager.save_active_incidents(incidents_data)
                # data_manager.save_delta_updates(changes)
                # data_manager.append_daily_incidents(incidents_data)
                file_updated = True  # Always consider updated for SSE
                
                # Update previous incidents
                data_manager.update_previous_incidents(incidents_data)
                
                # Prepare SSE data
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
        print(f"🚀 [SCRAPE] Starting parallel HTTP scrape of {len(self.centers)} centers...")
        print(f"🚀 [SCRAPE] Centers: {', '.join(self.centers[:5])}... (showing first 5)")
        
        start_time = datetime.now()
        
        try:
            # Use HTTP scraper for async parallel processing
            print(f"📡 [SCRAPE] Calling http_scraper.scrape_all_centers_async()")
            results = await self.http_scraper.scrape_all_centers_async(self.centers)
            print(f"✅ [SCRAPE] HTTP scraper returned {len(results)} results")
            
        except Exception as scrape_error:
            print(f"❌ [SCRAPE] HTTP scraper failed: {scrape_error}")
            print(f"❌ [SCRAPE] Error type: {type(scrape_error).__name__}")
            import traceback
            print(f"❌ [SCRAPE] Traceback: {traceback.format_exc()}")
            return []
        
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
                
                # Save data - DISABLED for SSE-only implementation
                # file_updated = data_manager.save_active_incidents(incidents_data)
                # data_manager.save_delta_updates(changes)
                # data_manager.append_daily_incidents(incidents_data)
                file_updated = True  # Always consider updated for SSE
                
                # Update previous incidents
                data_manager.update_previous_incidents(incidents_data)
                
                # Prepare SSE data
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
        """Broadcast scraping results to SSE clients"""
        for result in results:
            if result['status'] == 'success' and result.get('hasChanges', False):
                # Broadcast individual center updates
                await self.sse_server.broadcast_update({
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
        await self.sse_server.broadcast_update(summary)
    
    async def run_forever(self):
        """Main continuous scraping loop"""
        print("🚀 Starting Continuous Railway Scraper")
        print(f"📡 Scraping {len(self.centers)} centers every {self.scrape_interval} seconds")
        print(f"🌐 SSE server will run on port {self.sse_server.port}")
        print(f"🎯 Centers: {', '.join(self.centers)}")
        print(f"🔧 SSE server object: {self.sse_server}")
        print(f"🔧 SSE server type: {type(self.sse_server)}")
        
        # Start SSE server
        try:
            print("🔧 Starting SSE server...")
            print(f"🔧 About to call start_server() on {self.sse_server}")
            await self.sse_server.start_server()
            print("✅ SSE server started successfully")
        except Exception as e:
            print(f"❌ Failed to start SSE server: {e}")
            print(f"❌ Error type: {type(e).__name__}")
            import traceback
            print(f"❌ Traceback: {traceback.format_exc()}")
            print("❌ Continuing without SSE server...")
            # Don't raise - continue with scraping only
        
        self.is_running = True
        iteration = 0
        
        while self.is_running:
            try:
                iteration += 1
                print(f"\n🔄 [MAIN-{iteration}] Starting iteration at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"🔄 [MAIN-{iteration}] SSE clients connected: {len(self.sse_server.clients)}")
                
                # Scrape all centers
                print(f"🔄 [MAIN-{iteration}] Starting scrape_all_centers()")
                scrape_start = datetime.now()
                results = await self.scrape_all_centers()
                scrape_duration = (datetime.now() - scrape_start).total_seconds()
                print(f"✅ [MAIN-{iteration}] Scraping completed in {scrape_duration:.2f}s")
                
                # Broadcast results
                if results:
                    print(f"📡 [MAIN-{iteration}] Broadcasting {len(results)} results to {len(self.sse_server.clients)} clients")
                    broadcast_start = datetime.now()
                    await self.broadcast_results(results)
                    broadcast_duration = (datetime.now() - broadcast_start).total_seconds()
                    print(f"✅ [MAIN-{iteration}] Broadcasting completed in {broadcast_duration:.2f}s")
                else:
                    print(f"⚠️ [MAIN-{iteration}] No results to broadcast")
                
                # Wait for next iteration
                print(f"⏳ [MAIN-{iteration}] Waiting {self.scrape_interval}s until next iteration")
                await asyncio.sleep(self.scrape_interval)
                
            except KeyboardInterrupt:
                print(f"\n🛑 [MAIN-{iteration}] Received interrupt signal, shutting down...")
                self.is_running = False
                break
            except Exception as e:
                print(f"❌ [MAIN-{iteration}] Error in main loop: {e}")
                print(f"❌ [MAIN-{iteration}] Error type: {type(e).__name__}")
                import traceback
                print(f"❌ [MAIN-{iteration}] Traceback: {traceback.format_exc()}")
                print(f"⏳ [MAIN-{iteration}] Waiting 30s before retry...")
                await asyncio.sleep(30)
        
        # Cleanup
        if self.sse_server.server:
            self.sse_server.server.close()
            await self.sse_server.server.wait_closed()
        
        print("✅ Continuous scraper stopped")

async def main():
    """Main entry point"""
    print("🚀 Starting main() function")
    print("🔧 Creating ContinuousRailwayScraper...")
    scraper = ContinuousRailwayScraper()
    print("✅ ContinuousRailwayScraper created")
    print("🔧 Starting run_forever()...")
    await scraper.run_forever()

if __name__ == "__main__":
    print("🚀 Script started - __name__ == '__main__'")
    print("🔧 Running asyncio.run(main())...")
    asyncio.run(main())
