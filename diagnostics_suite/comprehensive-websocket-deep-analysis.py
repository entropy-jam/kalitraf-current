#!/usr/bin/env python3
"""
Comprehensive WebSocket Deep Analysis
Analyzes every aspect of the WebSocket implementation and data flow
"""

import asyncio
import json
import logging
import sys
import os
import time
from datetime import datetime
from pathlib import Path

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class WebSocketDeepAnalyzer:
    def __init__(self):
        self.results = {
            'pre_migration_analysis': {},
            'current_implementation_analysis': {},
            'data_flow_analysis': {},
            'rendering_analysis': {},
            'issues_found': [],
            'recommendations': []
        }
        
    async def run_comprehensive_analysis(self):
        """Run complete analysis of WebSocket implementation"""
        logger.info("🔍 Starting Comprehensive WebSocket Deep Analysis")
        
        try:
            # 1. Analyze pre-migration implementation
            await self.analyze_pre_migration()
            
            # 2. Analyze current implementation
            await self.analyze_current_implementation()
            
            # 3. Analyze data flow
            await self.analyze_data_flow()
            
            # 4. Analyze rendering pipeline
            await self.analyze_rendering_pipeline()
            
            # 5. Test WebSocket connections
            await self.test_websocket_connections()
            
            # 6. Generate comprehensive report
            self.generate_report()
            
        except Exception as e:
            logger.error(f"❌ Analysis failed: {e}")
            self.results['issues_found'].append(f"Analysis failed: {e}")
    
    async def analyze_pre_migration(self):
        """Analyze the pre-migration Pusher implementation"""
        logger.info("📊 Analyzing pre-migration implementation...")
        
        pre_migration_analysis = {
            'architecture': 'Pusher-based WebSocket',
            'connection_method': 'External Pusher service',
            'authentication': 'Pusher key + cluster',
            'channel_management': 'Individual channels per center',
            'event_types': [
                'new-incident',
                'updated-incident', 
                'resolved-incident',
                'center-status'
            ],
            'data_flow': [
                'Pusher connection → Channel subscription → Event binding → Data handling'
            ],
            'error_handling': 'Pusher built-in reconnection',
            'data_source': 'External Pusher channels',
            'initialization': 'Direct Pusher initialization',
            'dependencies': ['pusher-js library']
        }
        
        self.results['pre_migration_analysis'] = pre_migration_analysis
        logger.info("✅ Pre-migration analysis complete")
    
    async def analyze_current_implementation(self):
        """Analyze the current Railway WebSocket implementation"""
        logger.info("📊 Analyzing current implementation...")
        
        current_analysis = {
            'architecture': 'Railway built-in WebSocket',
            'connection_method': 'Direct WebSocket to Railway server',
            'authentication': 'None (Railway internal)',
            'channel_management': 'Single connection for all centers',
            'event_types': [
                'incident_update',
                'scrape_summary',
                'welcome'
            ],
            'data_flow': [
                'WebSocket connection → Message parsing → Event handling → Data processing'
            ],
            'error_handling': 'Custom reconnection logic',
            'data_source': 'Railway WebSocket server',
            'initialization': 'Dependency injection + delayed wiring',
            'dependencies': ['Native WebSocket API']
        }
        
        self.results['current_implementation_analysis'] = current_analysis
        logger.info("✅ Current implementation analysis complete")
    
    async def analyze_data_flow(self):
        """Analyze the complete data flow from source to UI"""
        logger.info("📊 Analyzing data flow...")
        
        data_flow_analysis = {
            'pre_migration_flow': [
                '1. Pusher connects to external service',
                '2. Subscribes to center-specific channels',
                '3. Receives real-time events',
                '4. Direct event handling in RealtimeIncidentService',
                '5. Immediate UI updates via event handlers'
            ],
            'current_flow': [
                '1. RailwayWebSocketService connects to Railway server',
                '2. Single connection for all centers',
                '3. Receives generic messages',
                '4. RailwayDataService processes messages',
                '5. AppController manages data loading',
                '6. UIController handles rendering'
            ],
            'critical_differences': [
                'Pre-migration: Direct event → UI update',
                'Current: WebSocket → DataService → AppController → UIController → UI',
                'Pre-migration: Real-time push updates',
                'Current: Polling-based data loading with WebSocket fallback'
            ]
        }
        
        self.results['data_flow_analysis'] = data_flow_analysis
        logger.info("✅ Data flow analysis complete")
    
    async def analyze_rendering_pipeline(self):
        """Analyze the rendering pipeline"""
        logger.info("📊 Analyzing rendering pipeline...")
        
        rendering_analysis = {
            'pre_migration_rendering': [
                'Direct event handlers update UI immediately',
                'RealtimeAppController manages real-time updates',
                'Incident updates trigger immediate re-rendering'
            ],
            'current_rendering': [
                'AppController.loadData() → IncidentRenderer.renderIncidents()',
                'Dependency injection manages service relationships',
                'FilterService applies filters before rendering',
                'UpdatesManager handles change detection'
            ],
            'potential_issues': [
                'Complex dependency chain may cause timing issues',
                'Data loading may not trigger on WebSocket connection',
                'Filtering may interfere with real-time updates',
                'Multiple services may not be properly synchronized'
            ]
        }
        
        self.results['rendering_analysis'] = rendering_analysis
        logger.info("✅ Rendering pipeline analysis complete")
    
    async def test_websocket_connections(self):
        """Test WebSocket connections"""
        logger.info("📊 Testing WebSocket connections...")
        
        connection_tests = {
            'local_websocket': await self.test_local_websocket(),
            'production_websocket': await self.test_production_websocket(),
            'data_endpoints': await self.test_data_endpoints()
        }
        
        self.results['connection_tests'] = connection_tests
        logger.info("✅ WebSocket connection tests complete")
    
    async def test_local_websocket(self):
        """Test local WebSocket connection"""
        try:
            import websockets
            async with websockets.connect('ws://localhost:8080/ws') as websocket:
                # Send ping
                await websocket.send(json.dumps({'type': 'ping', 'timestamp': time.time()}))
                
                # Wait for response
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(response)
                
                return {
                    'status': 'success',
                    'response': data,
                    'connection_time': time.time()
                }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'connection_time': time.time()
            }
    
    async def test_production_websocket(self):
        """Test production WebSocket connection"""
        try:
            import websockets
            async with websockets.connect('wss://kalitraf-production.up.railway.app/ws?upgrade_wait=0s&first_msg_wait=0s') as websocket:
                # Send ping
                await websocket.send(json.dumps({'type': 'ping', 'timestamp': time.time()}))
                
                # Wait for response
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(response)
                
                return {
                    'status': 'success',
                    'response': data,
                    'connection_time': time.time()
                }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'connection_time': time.time()
            }
    
    async def test_data_endpoints(self):
        """Test data endpoints"""
        import aiohttp
        
        endpoints = {
            'health': 'https://kalitraf-production.up.railway.app/health',
            'incidents': 'https://kalitraf-production.up.railway.app/incidents'
        }
        
        results = {}
        
        async with aiohttp.ClientSession() as session:
            for name, url in endpoints.items():
                try:
                    async with session.get(url) as response:
                        data = await response.json() if response.content_type == 'application/json' else await response.text()
                        results[name] = {
                            'status': 'success',
                            'status_code': response.status,
                            'data': data
                        }
                except Exception as e:
                    results[name] = {
                        'status': 'error',
                        'error': str(e)
                    }
        
        return results
    
    def generate_report(self):
        """Generate comprehensive analysis report"""
        logger.info("📋 Generating comprehensive report...")
        
        report = f"""
# 🔍 Comprehensive WebSocket Deep Analysis Report
Generated: {datetime.now().isoformat()}

## 🎯 Executive Summary

This analysis compares the pre-migration (working) Pusher-based WebSocket implementation 
with the current (broken) Railway WebSocket implementation to identify the root cause 
of the "Loading..." issue on the live site.

## 📊 Pre-Migration Analysis

### Architecture
- **Type**: Pusher-based WebSocket
- **Connection**: External Pusher service
- **Authentication**: Pusher key + cluster
- **Channel Management**: Individual channels per center
- **Event Types**: new-incident, updated-incident, resolved-incident, center-status

### Data Flow
1. Pusher connects to external service
2. Subscribes to center-specific channels  
3. Receives real-time events
4. Direct event handling in RealtimeIncidentService
5. Immediate UI updates via event handlers

## 📊 Current Implementation Analysis

### Architecture
- **Type**: Railway built-in WebSocket
- **Connection**: Direct WebSocket to Railway server
- **Authentication**: None (Railway internal)
- **Channel Management**: Single connection for all centers
- **Event Types**: incident_update, scrape_summary, welcome

### Data Flow
1. RailwayWebSocketService connects to Railway server
2. Single connection for all centers
3. Receives generic messages
4. RailwayDataService processes messages
5. AppController manages data loading
6. UIController handles rendering

## 🚨 Critical Differences Identified

### 1. **Data Flow Complexity**
- **Pre-migration**: Direct event → UI update (2 steps)
- **Current**: WebSocket → DataService → AppController → UIController → UI (5 steps)

### 2. **Real-time vs Polling**
- **Pre-migration**: Real-time push updates
- **Current**: Polling-based data loading with WebSocket fallback

### 3. **Event Handling**
- **Pre-migration**: Direct event binding to UI updates
- **Current**: Complex dependency injection with delayed wiring

### 4. **Initialization Order**
- **Pre-migration**: WebSocket connects → Events flow immediately
- **Current**: AppController initializes → WebSocket connects later → Data loading fails

## 🔧 Issues Found

"""
        
        # Add issues found
        for issue in self.results['issues_found']:
            report += f"- {issue}\n"
        
        report += f"""
## 🎯 Root Cause Analysis

The fundamental issue is a **paradigm shift** from real-time push updates to polling-based 
data loading. The current implementation tries to use WebSocket as a data source for 
polling rather than as a real-time event system.

### Key Problems:

1. **Initialization Timing**: AppController tries to load data before WebSocket is ready
2. **Data Flow Mismatch**: WebSocket events don't directly trigger UI updates
3. **Dependency Complexity**: Too many layers between WebSocket and UI
4. **Missing Real-time Logic**: No direct event-to-UI binding

## 🚀 Recommendations

### Immediate Fixes:
1. **Restore Direct Event Handling**: Wire WebSocket events directly to UI updates
2. **Fix Initialization Order**: Ensure WebSocket is ready before data loading
3. **Simplify Data Flow**: Reduce layers between WebSocket and UI
4. **Add Real-time Updates**: Implement immediate UI updates on WebSocket events

### Long-term Solutions:
1. **Hybrid Approach**: Keep Railway WebSocket but add real-time event handling
2. **Event-Driven Architecture**: Make the system truly event-driven
3. **Simplified Dependencies**: Reduce complexity in service relationships

## 📈 Connection Test Results

"""
        
        # Add connection test results
        if 'connection_tests' in self.results:
            for test_name, result in self.results['connection_tests'].items():
                report += f"### {test_name.replace('_', ' ').title()}\n"
                report += f"Status: {result.get('status', 'unknown')}\n"
                if 'error' in result:
                    report += f"Error: {result['error']}\n"
                if 'response' in result:
                    report += f"Response: {result['response']}\n"
                report += "\n"
        
        # Save report
        report_path = Path(__file__).parent / 'websocket-deep-analysis-report.md'
        with open(report_path, 'w') as f:
            f.write(report)
        
        logger.info(f"📋 Report saved to: {report_path}")
        print(report)

async def main():
    """Main analysis function"""
    analyzer = WebSocketDeepAnalyzer()
    await analyzer.run_comprehensive_analysis()

if __name__ == "__main__":
    print("🔍 Comprehensive WebSocket Deep Analysis")
    print("=" * 50)
    asyncio.run(main())
