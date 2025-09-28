#!/usr/bin/env python3
"""
SSE (Server-Sent Events) Diagnostics Script
Comprehensive testing suite for SSE implementation
"""

import asyncio
import aiohttp
import json
import time
import logging
from datetime import datetime
from typing import Dict, List, Any
import sys
import os

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

class SSEDiagnostics:
    def __init__(self):
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'tests': {},
            'summary': {}
        }
        self.setup_logging()
    
    def setup_logging(self):
        """Setup logging for diagnostics"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
    
    async def run_all_tests(self):
        """Run all SSE diagnostic tests"""
        self.logger.info("🚀 Starting SSE Diagnostics Suite")
        
        # Test 1: SSE Server Connection
        await self.test_sse_server_connection()
        
        # Test 2: SSE Message Broadcasting
        await self.test_sse_message_broadcasting()
        
        # Test 3: SSE Reconnection
        await self.test_sse_reconnection()
        
        # Test 4: SSE Data Format
        await self.test_sse_data_format()
        
        # Test 5: SSE Performance
        await self.test_sse_performance()
        
        # Test 6: Railway Server Testing
        await self.test_railway_server()
        
        # Test 7: Frontend Rendering Testing
        await self.test_frontend_rendering()
        
        # Test 8: Data Display Testing
        await self.test_data_display()
        
        # Test 9: UI Functionality Testing
        await self.test_ui_functionality()
        
        # Test 10: Incident Rendering Validation
        await self.test_incident_rendering()
        
        # Generate report
        self.generate_report()
    
    async def test_sse_server_connection(self):
        """Test basic SSE server connection"""
        self.logger.info("🔗 Testing SSE server connection...")
        
        test_result = {
            'name': 'SSE Server Connection',
            'status': 'unknown',
            'details': {},
            'errors': []
        }
        
        try:
            # Test local SSE endpoint (use PORT env var if available, fallback to 8081)
            port = os.environ.get('PORT', '8081')
            async with aiohttp.ClientSession() as session:
                async with session.get(f'http://localhost:{port}/api/incidents/stream') as response:
                    if response.status == 200:
                        test_result['status'] = 'success'
                        test_result['details']['status_code'] = response.status
                        test_result['details']['content_type'] = response.headers.get('content-type', 'unknown')
                        test_result['details']['connection_established'] = True
                        
                        # Read first few messages
                        messages = []
                        async for line in response.content:
                            if line:
                                line_str = line.decode('utf-8').strip()
                                if line_str.startswith('data: '):
                                    try:
                                        data = json.loads(line_str[6:])  # Remove 'data: ' prefix
                                        messages.append(data)
                                        if len(messages) >= 3:  # Read first 3 messages
                                            break
                                    except json.JSONDecodeError:
                                        pass
                        
                        test_result['details']['messages_received'] = len(messages)
                        test_result['details']['sample_messages'] = messages[:2]
                        
                    else:
                        test_result['status'] = 'failed'
                        test_result['errors'].append(f"HTTP {response.status}: {await response.text()}")
                        
        except Exception as e:
            test_result['status'] = 'failed'
            test_result['errors'].append(f"Connection error: {str(e)}")
        
        self.results['tests']['sse_connection'] = test_result
        self.logger.info(f"✅ SSE connection test: {test_result['status']}")
    
    async def test_sse_message_broadcasting(self):
        """Test SSE message broadcasting functionality"""
        self.logger.info("📡 Testing SSE message broadcasting...")
        
        test_result = {
            'name': 'SSE Message Broadcasting',
            'status': 'unknown',
            'details': {},
            'errors': []
        }
        
        try:
            # Connect to SSE stream
            port = os.environ.get('PORT', '8081')
            async with aiohttp.ClientSession() as session:
                async with session.get(f'http://localhost:{port}/api/incidents/stream') as response:
                    if response.status == 200:
                        # Monitor for different message types
                        message_types = set()
                        start_time = time.time()
                        timeout = 30  # 30 second timeout
                        
                        async for line in response.content:
                            if line:
                                line_str = line.decode('utf-8').strip()
                                if line_str.startswith('data: '):
                                    try:
                                        data = json.loads(line_str[6:])
                                        message_types.add(data.get('type', 'unknown'))
                                        
                                        # Check if we've received expected message types
                                        if 'incident_update' in message_types and 'scrape_summary' in message_types:
                                            break
                                            
                                    except json.JSONDecodeError:
                                        pass
                            
                            # Timeout check
                            if time.time() - start_time > timeout:
                                break
                        
                        test_result['details']['message_types_received'] = list(message_types)
                        test_result['details']['monitoring_duration'] = time.time() - start_time
                        
                        if 'incident_update' in message_types:
                            test_result['status'] = 'success'
                        else:
                            test_result['status'] = 'partial'
                            test_result['errors'].append("No incident_update messages received")
                            
                    else:
                        test_result['status'] = 'failed'
                        test_result['errors'].append(f"HTTP {response.status}")
                        
        except Exception as e:
            test_result['status'] = 'failed'
            test_result['errors'].append(f"Broadcasting test error: {str(e)}")
        
        self.results['tests']['sse_broadcasting'] = test_result
        self.logger.info(f"✅ SSE broadcasting test: {test_result['status']}")
    
    async def test_sse_reconnection(self):
        """Test SSE reconnection handling"""
        self.logger.info("🔄 Testing SSE reconnection...")
        
        test_result = {
            'name': 'SSE Reconnection',
            'status': 'unknown',
            'details': {},
            'errors': []
        }
        
        try:
            # Test multiple connections
            connections = []
            async with aiohttp.ClientSession() as session:
                # Create multiple connections
                port = os.environ.get('PORT', '8081')
                for i in range(3):
                    try:
                        response = await session.get(f'http://localhost:{port}/api/incidents/stream')
                        if response.status == 200:
                            connections.append(response)
                    except Exception as e:
                        test_result['errors'].append(f"Connection {i} failed: {str(e)}")
                
                test_result['details']['successful_connections'] = len(connections)
                test_result['details']['total_attempts'] = 3
                
                if len(connections) >= 2:
                    test_result['status'] = 'success'
                else:
                    test_result['status'] = 'failed'
                    test_result['errors'].append("Failed to establish multiple connections")
                
                # Close connections
                for conn in connections:
                    conn.close()
                    
        except Exception as e:
            test_result['status'] = 'failed'
            test_result['errors'].append(f"Reconnection test error: {str(e)}")
        
        self.results['tests']['sse_reconnection'] = test_result
        self.logger.info(f"✅ SSE reconnection test: {test_result['status']}")
    
    async def test_sse_data_format(self):
        """Test SSE data format and structure"""
        self.logger.info("📋 Testing SSE data format...")
        
        test_result = {
            'name': 'SSE Data Format',
            'status': 'unknown',
            'details': {},
            'errors': []
        }
        
        try:
            port = os.environ.get('PORT', '8081')
            async with aiohttp.ClientSession() as session:
                async with session.get(f'http://localhost:{port}/api/incidents/stream') as response:
                    if response.status == 200:
                        messages = []
                        start_time = time.time()
                        timeout = 20
                        
                        async for line in response.content:
                            if line:
                                line_str = line.decode('utf-8').strip()
                                if line_str.startswith('data: '):
                                    try:
                                        data = json.loads(line_str[6:])
                                        messages.append(data)
                                        
                                        # Check for required fields in incident_update messages
                                        if data.get('type') == 'incident_update':
                                            # Check the data field structure
                                            incident_data = data.get('data', {})
                                            required_fields = ['center', 'centerName', 'incidents', 'incidentCount', 'timestamp']
                                            missing_fields = [field for field in required_fields if field not in incident_data]
                                            if missing_fields:
                                                test_result['errors'].append(f"Missing fields in incident_update.data: {missing_fields}")
                                            else:
                                                # Additional validation for incident structure
                                                incidents = incident_data.get('incidents', [])
                                                if incidents and len(incidents) > 0:
                                                    sample_incident = incidents[0]
                                                    incident_required_fields = ['id', 'time', 'type', 'location', 'center_code']
                                                    incident_missing = [field for field in incident_required_fields if field not in sample_incident]
                                                    if incident_missing:
                                                        test_result['errors'].append(f"Missing fields in incident structure: {incident_missing}")
                                        
                                        if len(messages) >= 5:  # Analyze first 5 messages
                                            break
                                            
                                    except json.JSONDecodeError as e:
                                        test_result['errors'].append(f"JSON decode error: {str(e)}")
                            
                            if time.time() - start_time > timeout:
                                break
                        
                        test_result['details']['messages_analyzed'] = len(messages)
                        test_result['details']['sample_messages'] = messages[:3]
                        
                        if messages and not test_result['errors']:
                            test_result['status'] = 'success'
                        else:
                            test_result['status'] = 'failed'
                            
                    else:
                        test_result['status'] = 'failed'
                        test_result['errors'].append(f"HTTP {response.status}")
                        
        except Exception as e:
            test_result['status'] = 'failed'
            test_result['errors'].append(f"Data format test error: {str(e)}")
        
        self.results['tests']['sse_data_format'] = test_result
        self.logger.info(f"✅ SSE data format test: {test_result['status']}")
    
    async def test_sse_performance(self):
        """Test SSE performance and latency"""
        self.logger.info("⚡ Testing SSE performance...")
        
        test_result = {
            'name': 'SSE Performance',
            'status': 'unknown',
            'details': {},
            'errors': []
        }
        
        try:
            port = os.environ.get('PORT', '8081')
            async with aiohttp.ClientSession() as session:
                async with session.get(f'http://localhost:{port}/api/incidents/stream') as response:
                    if response.status == 200:
                        message_times = []
                        start_time = time.time()
                        timeout = 30
                        
                        async for line in response.content:
                            if line:
                                line_str = line.decode('utf-8').strip()
                                if line_str.startswith('data: '):
                                    message_time = time.time()
                                    message_times.append(message_time)
                                    
                                    if len(message_times) >= 10:  # Test with 10 messages
                                        break
                            
                            if time.time() - start_time > timeout:
                                break
                        
                        if message_times:
                            # Calculate performance metrics
                            total_time = message_times[-1] - start_time
                            message_count = len(message_times)
                            messages_per_second = message_count / total_time if total_time > 0 else 0
                            
                            # Calculate intervals between messages
                            intervals = [message_times[i] - message_times[i-1] for i in range(1, len(message_times))]
                            avg_interval = sum(intervals) / len(intervals) if intervals else 0
                            
                            test_result['details']['total_messages'] = message_count
                            test_result['details']['total_time'] = total_time
                            test_result['details']['messages_per_second'] = messages_per_second
                            test_result['details']['average_interval'] = avg_interval
                            
                            if messages_per_second > 0.1:  # At least 1 message per 10 seconds
                                test_result['status'] = 'success'
                            else:
                                test_result['status'] = 'failed'
                                test_result['errors'].append("Low message frequency")
                        else:
                            test_result['status'] = 'failed'
                            test_result['errors'].append("No messages received")
                            
                    else:
                        test_result['status'] = 'failed'
                        test_result['errors'].append(f"HTTP {response.status}")
                        
        except Exception as e:
            test_result['status'] = 'failed'
            test_result['errors'].append(f"Performance test error: {str(e)}")
        
        self.results['tests']['sse_performance'] = test_result
        self.logger.info(f"✅ SSE performance test: {test_result['status']}")
    
    async def test_railway_server(self):
        """Test Railway server endpoints and functionality"""
        self.logger.info("🚂 Testing Railway server...")
        
        test_result = {
            'name': 'Railway Server Testing',
            'status': 'unknown',
            'details': {},
            'errors': []
        }
        
        try:
            # Test endpoints
            port = os.environ.get('PORT', '8081')
            endpoints_to_test = [
                ('/', 'text/html', 'Frontend serving'),
                ('/health', 'application/json', 'Health check'),
                ('/api/incidents/stream', 'text/event-stream', 'SSE endpoint')
            ]
            
            results = {}
            async with aiohttp.ClientSession() as session:
                for endpoint, expected_content_type, description in endpoints_to_test:
                    try:
                        url = f'http://localhost:{port}{endpoint}'
                        async with session.get(url) as response:
                            content_type = response.headers.get('content-type', '').split(';')[0]
                            
                            results[endpoint] = {
                                'status_code': response.status,
                                'content_type': content_type,
                                'expected_content_type': expected_content_type,
                                'content_type_match': content_type == expected_content_type,
                                'description': description
                            }
                            
                            # Special handling for SSE endpoint
                            if endpoint == '/api/incidents/stream':
                                if response.status == 200 and 'event-stream' in content_type:
                                    # Test SSE headers
                                    sse_headers = {
                                        'Cache-Control': response.headers.get('Cache-Control'),
                                        'Connection': response.headers.get('Connection'),
                                        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin')
                                    }
                                    results[endpoint]['sse_headers'] = sse_headers
                                    
                                    # Test if we can read at least one message
                                    try:
                                        async for line in response.content:
                                            if line:
                                                line_str = line.decode('utf-8').strip()
                                                if line_str.startswith('data: '):
                                                    message_data = json.loads(line_str[6:])
                                                    results[endpoint]['sample_message'] = message_data
                                                    break
                                    except Exception as e:
                                        test_result['errors'].append(f"SSE message reading error: {str(e)}")
                            
                    except Exception as e:
                        results[endpoint] = {
                            'error': str(e),
                            'status_code': 'error',
                            'description': description
                        }
                        test_result['errors'].append(f"Error testing {endpoint}: {str(e)}")
            
            test_result['details']['endpoints'] = results
            
            # Determine overall status
            successful_endpoints = sum(1 for ep in results.values() if ep.get('status_code') == 200)
            total_endpoints = len(endpoints_to_test)
            
            if successful_endpoints == total_endpoints:
                test_result['status'] = 'success'
            elif successful_endpoints > 0:
                test_result['status'] = 'partial'
            else:
                test_result['status'] = 'failed'
            
            test_result['details']['successful_endpoints'] = successful_endpoints
            test_result['details']['total_endpoints'] = total_endpoints
            
        except Exception as e:
            test_result['status'] = 'failed'
            test_result['errors'].append(f"Railway server test error: {str(e)}")
        
        self.results['tests']['railway_server'] = test_result
        self.logger.info(f"✅ Railway server test: {test_result['status']}")
    
    async def test_frontend_rendering(self):
        """Test frontend rendering and HTML structure"""
        self.logger.info("🎨 Testing frontend rendering...")
        
        test_result = {
            'name': 'Frontend Rendering',
            'status': 'unknown',
            'details': {},
            'errors': []
        }
        
        try:
            port = os.environ.get('PORT', '8081')
            async with aiohttp.ClientSession() as session:
                # Test main page rendering
                async with session.get(f'http://localhost:{port}/') as response:
                    if response.status == 200:
                        html_content = await response.text()
                        
                        # Check for essential HTML elements
                        required_elements = [
                            '<html',
                            '<head>',
                            '<body>',
                            '<title>',
                            'CHP Traffic Monitor',
                            'incidents-container',
                            'controls',
                            'theme-toggle',
                            'connection-status'
                        ]
                        
                        missing_elements = []
                        for element in required_elements:
                            if element not in html_content:
                                missing_elements.append(element)
                        
                        # Check for JavaScript files
                        js_files = [
                            'app-railway.js',
                            'sse-service.js',
                            'incident-renderer.js',
                            'incident-service.js'
                        ]
                        
                        missing_js = []
                        for js_file in js_files:
                            if js_file not in html_content:
                                missing_js.append(js_file)
                        
                        # Check for CSS styling
                        css_indicators = [
                            'style',
                            'css',
                            'theme',
                            'dark-theme',
                            'light-theme'
                        ]
                        
                        css_present = any(indicator in html_content.lower() for indicator in css_indicators)
                        
                        test_result['details']['html_length'] = len(html_content)
                        test_result['details']['missing_elements'] = missing_elements
                        test_result['details']['missing_js_files'] = missing_js
                        test_result['details']['css_present'] = css_present
                        test_result['details']['has_incidents_container'] = 'incidents-container' in html_content
                        test_result['details']['has_controls'] = 'controls' in html_content
                        
                        if not missing_elements and not missing_js:
                            test_result['status'] = 'success'
                        elif len(missing_elements) <= 2 and len(missing_js) <= 1:
                            test_result['status'] = 'partial'
                        else:
                            test_result['status'] = 'failed'
                            test_result['errors'].extend([f"Missing HTML elements: {missing_elements}", f"Missing JS files: {missing_js}"])
                    else:
                        test_result['status'] = 'failed'
                        test_result['errors'].append(f"HTTP {response.status}")
                        
        except Exception as e:
            test_result['status'] = 'failed'
            test_result['errors'].append(f"Frontend rendering test error: {str(e)}")
        
        self.results['tests']['frontend_rendering'] = test_result
        self.logger.info(f"✅ Frontend rendering test: {test_result['status']}")
    
    async def test_data_display(self):
        """Test data display and incident rendering"""
        self.logger.info("📊 Testing data display...")
        
        test_result = {
            'name': 'Data Display',
            'status': 'unknown',
            'details': {},
            'errors': []
        }
        
        try:
            # Get sample incident data from SSE
            port = os.environ.get('PORT', '8081')
            sample_incidents = []
            async with aiohttp.ClientSession() as session:
                async with session.get(f'http://localhost:{port}/api/incidents/stream') as response:
                    if response.status == 200:
                        async for line in response.content:
                            if line:
                                line_str = line.decode('utf-8').strip()
                                if line_str.startswith('data: '):
                                    try:
                                        data = json.loads(line_str[6:])
                                        if data.get('type') == 'incident_update':
                                            sample_incidents.append(data.get('data', {}))
                                            if len(sample_incidents) >= 3:  # Get 3 samples
                                                break
                                    except json.JSONDecodeError:
                                        pass
                            
                            if len(sample_incidents) >= 3:
                                break
            
            if sample_incidents:
                # Analyze incident data structure
                incident_analysis = {
                    'total_samples': len(sample_incidents),
                    'centers_represented': list(set(inc.get('center', '') for inc in sample_incidents)),
                    'total_incidents': sum(inc.get('incidentCount', 0) for inc in sample_incidents),
                    'incident_types': set(),
                    'has_lane_blockage_info': False,
                    'has_timestamps': False,
                    'has_locations': False
                }
                
                for incident_data in sample_incidents:
                    incidents = incident_data.get('incidents', [])
                    for incident in incidents:
                        # Check incident structure
                        if 'type' in incident:
                            incident_analysis['incident_types'].add(incident['type'])
                        if 'lane_blockage' in incident:
                            incident_analysis['has_lane_blockage_info'] = True
                        if 'time' in incident:
                            incident_analysis['has_timestamps'] = True
                        if 'location' in incident:
                            incident_analysis['has_locations'] = True
                
                incident_analysis['incident_types'] = list(incident_analysis['incident_types'])
                
                test_result['details']['incident_analysis'] = incident_analysis
                
                # Check if data structure is complete for rendering
                required_for_rendering = [
                    'has_timestamps',
                    'has_locations',
                    'has_lane_blockage_info'
                ]
                
                missing_for_rendering = [field for field in required_for_rendering if not incident_analysis.get(field, False)]
                
                if not missing_for_rendering and incident_analysis['total_incidents'] > 0:
                    test_result['status'] = 'success'
                elif len(missing_for_rendering) <= 1:
                    test_result['status'] = 'partial'
                    test_result['errors'].append(f"Missing rendering data: {missing_for_rendering}")
                else:
                    test_result['status'] = 'failed'
                    test_result['errors'].append(f"Missing critical rendering data: {missing_for_rendering}")
            else:
                test_result['status'] = 'failed'
                test_result['errors'].append("No incident data received for analysis")
                
        except Exception as e:
            test_result['status'] = 'failed'
            test_result['errors'].append(f"Data display test error: {str(e)}")
        
        self.results['tests']['data_display'] = test_result
        self.logger.info(f"✅ Data display test: {test_result['status']}")
    
    async def test_ui_functionality(self):
        """Test UI functionality and JavaScript execution"""
        self.logger.info("🖥️ Testing UI functionality...")
        
        test_result = {
            'name': 'UI Functionality',
            'status': 'unknown',
            'details': {},
            'errors': []
        }
        
        try:
            # Test JavaScript file availability
            port = os.environ.get('PORT', '8081')
            js_files_to_test = [
                'js/app-railway.js',
                'js/services/sse-service.js',
                'js/renderers/incident-renderer.js',
                'js/services/incident-service.js',
                'js/controllers/app-controller.js',
                'js/ui-controller.js'
            ]
            
            js_availability = {}
            async with aiohttp.ClientSession() as session:
                for js_file in js_files_to_test:
                    try:
                        url = f'http://localhost:{port}/{js_file}'
                        async with session.get(url) as response:
                            if response.status == 200:
                                content = await response.text()
                                js_availability[js_file] = {
                                    'status': 'available',
                                    'size': len(content),
                                    'has_classes': 'class ' in content,
                                    'has_functions': 'function ' in content or '=>' in content
                                }
                            else:
                                js_availability[js_file] = {
                                    'status': 'unavailable',
                                    'error': f"HTTP {response.status}"
                                }
                    except Exception as e:
                        js_availability[js_file] = {
                            'status': 'error',
                            'error': str(e)
                        }
            
            # Test CSS file availability
            css_files_to_test = [
                'assets/styles.css'
            ]
            
            css_availability = {}
            for css_file in css_files_to_test:
                try:
                    url = f'http://localhost:{port}/{css_file}'
                    async with session.get(url) as response:
                        if response.status == 200:
                            content = await response.text()
                            css_availability[css_file] = {
                                'status': 'available',
                                'size': len(content),
                                'has_styles': '{' in content and '}' in content
                            }
                        else:
                            css_availability[css_file] = {
                                'status': 'unavailable',
                                'error': f"HTTP {response.status}"
                            }
                except Exception as e:
                    css_availability[css_file] = {
                        'status': 'error',
                        'error': str(e)
                    }
            
            # Analyze results
            available_js = sum(1 for js in js_availability.values() if js['status'] == 'available')
            total_js = len(js_files_to_test)
            available_css = sum(1 for css in css_availability.values() if css['status'] == 'available')
            total_css = len(css_files_to_test)
            
            test_result['details']['js_files'] = js_availability
            test_result['details']['css_files'] = css_availability
            test_result['details']['js_availability_ratio'] = f"{available_js}/{total_js}"
            test_result['details']['css_availability_ratio'] = f"{available_css}/{total_css}"
            
            # Check for critical files
            critical_files = [
                'js/app-railway.js',
                'js/services/sse-service.js'
            ]
            
            critical_available = all(
                js_availability.get(file, {}).get('status') == 'available' 
                for file in critical_files
            )
            
            if critical_available and available_js >= total_js * 0.8:  # 80% of JS files available
                test_result['status'] = 'success'
            elif critical_available and available_js >= total_js * 0.6:  # 60% of JS files available
                test_result['status'] = 'partial'
            else:
                test_result['status'] = 'failed'
                missing_critical = [f for f in critical_files if js_availability.get(f, {}).get('status') != 'available']
                test_result['errors'].append(f"Missing critical files: {missing_critical}")
                
        except Exception as e:
            test_result['status'] = 'failed'
            test_result['errors'].append(f"UI functionality test error: {str(e)}")
        
        self.results['tests']['ui_functionality'] = test_result
        self.logger.info(f"✅ UI functionality test: {test_result['status']}")
    
    async def test_incident_rendering(self):
        """Test incident rendering format and structure validation"""
        self.logger.info("🎯 Testing incident rendering...")
        
        test_result = {
            'name': 'Incident Rendering Validation',
            'status': 'unknown',
            'details': {},
            'errors': []
        }
        
        try:
            # Get sample incident data and validate rendering requirements
            port = os.environ.get('PORT', '8081')
            sample_incidents = []
            async with aiohttp.ClientSession() as session:
                async with session.get(f'http://localhost:{port}/api/incidents/stream') as response:
                    if response.status == 200:
                        async for line in response.content:
                            if line:
                                line_str = line.decode('utf-8').strip()
                                if line_str.startswith('data: '):
                                    try:
                                        data = json.loads(line_str[6:])
                                        if data.get('type') == 'incident_update':
                                            sample_incidents.append(data.get('data', {}))
                                            if len(sample_incidents) >= 2:  # Get 2 samples
                                                break
                                    except json.JSONDecodeError:
                                        pass
                            
                            if len(sample_incidents) >= 2:
                                break
            
            if sample_incidents:
                rendering_validation = {
                    'samples_analyzed': len(sample_incidents),
                    'rendering_requirements': {},
                    'data_consistency': {},
                    'format_compliance': {}
                }
                
                # Check rendering requirements
                required_fields = ['center', 'centerName', 'incidents', 'incidentCount', 'timestamp']
                incident_required_fields = ['id', 'time', 'type', 'location', 'center_code', 'lane_blockage']
                
                for i, incident_data in enumerate(sample_incidents):
                    # Check top-level fields
                    missing_top_level = [field for field in required_fields if field not in incident_data]
                    rendering_validation['rendering_requirements'][f'sample_{i+1}_top_level'] = {
                        'missing': missing_top_level,
                        'complete': len(missing_top_level) == 0
                    }
                    
                    # Check incident-level fields
                    incidents = incident_data.get('incidents', [])
                    if incidents:
                        sample_incident = incidents[0]
                        missing_incident_fields = [field for field in incident_required_fields if field not in sample_incident]
                        rendering_validation['rendering_requirements'][f'sample_{i+1}_incident_level'] = {
                            'missing': missing_incident_fields,
                            'complete': len(missing_incident_fields) == 0
                        }
                        
                        # Check lane blockage structure
                        lane_blockage = sample_incident.get('lane_blockage', {})
                        lane_blockage_valid = 'status' in lane_blockage and 'details' in lane_blockage
                        rendering_validation['format_compliance'][f'sample_{i+1}_lane_blockage'] = lane_blockage_valid
                        
                        # Check data types
                        data_types_valid = all([
                            isinstance(sample_incident.get('id'), str),
                            isinstance(sample_incident.get('time'), str),
                            isinstance(sample_incident.get('type'), str),
                            isinstance(sample_incident.get('location'), str),
                            isinstance(sample_incident.get('center_code'), str)
                        ])
                        rendering_validation['data_consistency'][f'sample_{i+1}_data_types'] = data_types_valid
                
                # Overall validation
                all_top_level_complete = all(
                    req.get('complete', False) 
                    for req in rendering_validation['rendering_requirements'].values() 
                    if 'top_level' in req
                )
                
                all_incident_level_complete = all(
                    req.get('complete', False) 
                    for req in rendering_validation['rendering_requirements'].values() 
                    if 'incident_level' in req
                )
                
                all_lane_blockage_valid = all(
                    rendering_validation['format_compliance'].values()
                )
                
                all_data_types_valid = all(
                    rendering_validation['data_consistency'].values()
                )
                
                test_result['details']['rendering_validation'] = rendering_validation
                test_result['details']['overall_completeness'] = {
                    'top_level_complete': all_top_level_complete,
                    'incident_level_complete': all_incident_level_complete,
                    'lane_blockage_valid': all_lane_blockage_valid,
                    'data_types_valid': all_data_types_valid
                }
                
                if all([all_top_level_complete, all_incident_level_complete, all_lane_blockage_valid, all_data_types_valid]):
                    test_result['status'] = 'success'
                elif all([all_top_level_complete, all_incident_level_complete]):
                    test_result['status'] = 'partial'
                    test_result['errors'].append("Minor formatting issues detected")
                else:
                    test_result['status'] = 'failed'
                    test_result['errors'].append("Critical rendering data missing or malformed")
            else:
                test_result['status'] = 'failed'
                test_result['errors'].append("No incident data available for rendering validation")
                
        except Exception as e:
            test_result['status'] = 'failed'
            test_result['errors'].append(f"Incident rendering test error: {str(e)}")
        
        self.results['tests']['incident_rendering'] = test_result
        self.logger.info(f"✅ Incident rendering test: {test_result['status']}")
    
    def generate_report(self):
        """Generate comprehensive diagnostic report"""
        self.logger.info("📋 Generating SSE diagnostic report...")
        
        # Calculate summary
        total_tests = len(self.results['tests'])
        successful_tests = sum(1 for test in self.results['tests'].values() if test['status'] == 'success')
        failed_tests = sum(1 for test in self.results['tests'].values() if test['status'] == 'failed')
        partial_tests = sum(1 for test in self.results['tests'].values() if test['status'] == 'partial')
        
        self.results['summary'] = {
            'total_tests': total_tests,
            'successful': successful_tests,
            'failed': failed_tests,
            'partial': partial_tests,
            'success_rate': (successful_tests / total_tests * 100) if total_tests > 0 else 0
        }
        
        # Generate markdown report
        report_content = f"""# 🔍 SSE Diagnostics Report
Generated: {self.results['timestamp']}

## 📊 Summary
- **Total Tests**: {total_tests}
- **Successful**: {successful_tests} ✅
- **Failed**: {failed_tests} ❌
- **Partial**: {partial_tests} ⚠️
- **Success Rate**: {self.results['summary']['success_rate']:.1f}%

## 🧪 Test Results

"""
        
        for test_name, test_result in self.results['tests'].items():
            status_emoji = "✅" if test_result['status'] == 'success' else "❌" if test_result['status'] == 'failed' else "⚠️"
            report_content += f"### {status_emoji} {test_result['name']}\n"
            report_content += f"**Status**: {test_result['status']}\n\n"
            
            if test_result['details']:
                report_content += "**Details**:\n"
                for key, value in test_result['details'].items():
                    report_content += f"- {key}: {value}\n"
                report_content += "\n"
            
            if test_result['errors']:
                report_content += "**Errors**:\n"
                for error in test_result['errors']:
                    report_content += f"- {error}\n"
                report_content += "\n"
        
        # Save report
        report_path = os.path.join(os.path.dirname(__file__), 'sse-diagnostics-report.md')
        with open(report_path, 'w') as f:
            f.write(report_content)
        
        # Save JSON results
        json_path = os.path.join(os.path.dirname(__file__), 'sse-diagnostics-results.json')
        with open(json_path, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        self.logger.info(f"📋 Report saved to: {report_path}")
        self.logger.info(f"📋 JSON results saved to: {json_path}")
        
        # Print summary
        print(f"\n🎯 SSE Diagnostics Complete!")
        print(f"✅ Successful: {successful_tests}/{total_tests}")
        print(f"❌ Failed: {failed_tests}/{total_tests}")
        print(f"⚠️ Partial: {partial_tests}/{total_tests}")
        print(f"📊 Success Rate: {self.results['summary']['success_rate']:.1f}%")

async def main():
    """Main entry point"""
    diagnostics = SSEDiagnostics()
    await diagnostics.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())
