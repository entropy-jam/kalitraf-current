#!/usr/bin/env python3
"""
HTTP-based CHP Traffic Scraper
High-performance scraper using HTTP requests instead of WebDriver
Supports all 25 CHP communication centers with parallel processing
"""

import asyncio
import aiohttp
import requests
import time
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from bs4 import BeautifulSoup
import sys
import os

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from core.center_mapper import CenterMapper
from core.incident_parser import IncidentParser

class HTTPScraper:
    """High-performance HTTP-based CHP scraper"""
    
    def __init__(self, mode="railway"):
        self.mode = mode
        self.base_url = "https://cad.chp.ca.gov/Traffic.aspx"
        self.center_mapper = CenterMapper()
        self.incident_parser = IncidentParser()
        
        # All 25 CHP communication centers
        self.all_centers = self.center_mapper.get_available_centers()
        self.production_centers = ['BCCC', 'LACC', 'OCCC', 'SACC']
        
        # Setup logging
        self.setup_logging()
        
    def setup_logging(self):
        """Setup comprehensive logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
    
    def create_session(self) -> requests.Session:
        """Create HTTP session with proper headers"""
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (compatible; CHP-Traffic-Monitor/1.0)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        return session
    
    def scrape_center_sync(self, center_code: str, previous_incidents: List[Dict] = None) -> Dict[str, Any]:
        """Scrape single center using synchronous HTTP requests"""
        start_time = time.time()
        center_name = self.center_mapper.get_center_name(center_code)
        previous_incidents = previous_incidents or []
        previous_ids = {inc.get('id', '') for inc in previous_incidents}
        
        try:
            self.logger.info(f"🔄 Scraping {center_code} ({center_name}) with HTTP...")
            
            session = self.create_session()
            
            # Step 1: GET the initial page
            response = session.get(self.base_url, timeout=30)
            if response.status_code != 200:
                raise Exception(f"HTTP {response.status_code}: Failed to load page")
            
            # Step 2: Parse form data
            soup = BeautifulSoup(response.text, 'html.parser')
            form_data = self.extract_form_data(soup, center_code)
            
            # Step 3: POST the form
            response = session.post(self.base_url, data=form_data, timeout=30)
            if response.status_code != 200:
                raise Exception(f"HTTP {response.status_code}: Failed to submit form")
            
            # Step 4: Parse incidents
            incidents = self.parse_incidents(response.text, center_code)
            
            # Step 5: Apply smart processing
            enhanced_incidents = self.apply_smart_processing(incidents, previous_ids)
            
            response_time = time.time() - start_time
            
            self.logger.info(f"✅ {center_code}: {len(enhanced_incidents)} incidents in {response_time:.2f}s")
            
            return {
                'center': center_code,
                'centerName': center_name,
                'incidents': enhanced_incidents,
                'incidentCount': len(enhanced_incidents),
                'timestamp': datetime.now().isoformat(),
                'hasChanges': len(enhanced_incidents) != len(previous_incidents),
                'status': 'success',
                'responseTime': response_time
            }
            
        except Exception as e:
            response_time = time.time() - start_time
            self.logger.error(f"❌ Error scraping {center_code}: {e}")
            
            return {
                'center': center_code,
                'centerName': center_name,
                'incidents': [],
                'incidentCount': 0,
                'timestamp': datetime.now().isoformat(),
                'hasChanges': False,
                'status': 'error',
                'error': str(e),
                'responseTime': response_time
            }
    
    async def scrape_center_async(self, session: aiohttp.ClientSession, center_code: str, previous_incidents: List[Dict] = None) -> Dict[str, Any]:
        """Scrape single center using asynchronous HTTP requests"""
        start_time = time.time()
        center_name = self.center_mapper.get_center_name(center_code)
        previous_incidents = previous_incidents or []
        previous_ids = {inc.get('id', '') for inc in previous_incidents}
        
        try:
            self.logger.info(f"🔄 Scraping {center_code} ({center_name}) with async HTTP...")
            
            # Step 1: GET the initial page
            async with session.get(self.base_url) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}: Failed to load page")
                html = await response.text()
            
            # Step 2: Parse form data
            soup = BeautifulSoup(html, 'html.parser')
            form_data = self.extract_form_data(soup, center_code)
            
            # Step 3: POST the form
            async with session.post(self.base_url, data=form_data) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}: Failed to submit form")
                html = await response.text()
            
            # Step 4: Parse incidents
            incidents = self.parse_incidents(html, center_code)
            
            # Step 5: Apply smart processing
            enhanced_incidents = self.apply_smart_processing(incidents, previous_ids)
            
            response_time = time.time() - start_time
            
            self.logger.info(f"✅ {center_code}: {len(enhanced_incidents)} incidents in {response_time:.2f}s")
            
            return {
                'center': center_code,
                'centerName': center_name,
                'incidents': enhanced_incidents,
                'incidentCount': len(enhanced_incidents),
                'timestamp': datetime.now().isoformat(),
                'hasChanges': len(enhanced_incidents) != len(previous_incidents),
                'status': 'success',
                'responseTime': response_time
            }
            
        except Exception as e:
            response_time = time.time() - start_time
            self.logger.error(f"❌ Error scraping {center_code}: {e}")
            
            return {
                'center': center_code,
                'centerName': center_name,
                'incidents': [],
                'incidentCount': 0,
                'timestamp': datetime.now().isoformat(),
                'hasChanges': False,
                'status': 'error',
                'error': str(e),
                'responseTime': response_time
            }
    
    def extract_form_data(self, soup: BeautifulSoup, center_code: str) -> Dict[str, str]:
        """Extract form data including hidden fields"""
        form_data = {
            'ddlComCenter': center_code,
            'btnCCGo': 'OK'
        }
        
        # Add any hidden form fields (CSRF tokens, etc.)
        for hidden_input in soup.find_all('input', type='hidden'):
            name = hidden_input.get('name')
            value = hidden_input.get('value', '')
            if name:
                form_data[name] = value
        
        return form_data
    
    def parse_incidents(self, html: str, center_code: str) -> List[Dict[str, Any]]:
        """Parse incidents from HTML table"""
        soup = BeautifulSoup(html, 'html.parser')
        incidents = []
        
        # Find the incidents table
        table = soup.find('table')
        if not table:
            return incidents
        
        rows = table.find_all('tr')[1:]  # Skip header row
        
        for row in rows:
            cells = row.find_all('td')
            if len(cells) >= 7:  # Ensure we have all columns
                incident = {
                    'id': cells[1].get_text(strip=True),
                    'time': cells[2].get_text(strip=True),
                    'type': cells[3].get_text(strip=True),
                    'location': cells[4].get_text(strip=True),
                    'area': cells[5].get_text(strip=True),
                    'details': cells[6].get_text(strip=True),
                    'center_code': center_code
                }
                incidents.append(incident)
        
        return incidents
    
    def apply_smart_processing(self, incidents: List[Dict[str, Any]], previous_ids: set) -> List[Dict[str, Any]]:
        """Apply smart processing to incidents (relevance filtering, new detection)"""
        processed_incidents = []
        
        for incident in incidents:
            # Check if incident is new
            incident['is_new'] = incident['id'] not in previous_ids
            
            # Check if incident is relevant (basic filtering)
            incident['is_relevant'] = self.is_relevant_incident(incident)
            
            # Add lane blockage parsing (simplified for HTTP)
            incident['lane_blockage'] = self.parse_lane_blockage(incident['details'])
            
            processed_incidents.append(incident)
        
        return processed_incidents
    
    def is_relevant_incident(self, incident: Dict[str, Any]) -> bool:
        """Check if incident is relevant based on category and location"""
        incident_type = incident['type']
        location = incident['location']
        
        # Relevant categories
        relevant_categories = [
            'Trfc Collision', 'Traffic Hazard', 'Car Fire', 'Vehicle Fire',
            'Traffic Break', 'Road Blocked', 'Fatality', 'Hit and Run',
            'Hit & Run', 'SIG Alert', 'Sig Alert', 'Report of Fire'
        ]
        
        # Check if it's a relevant category
        if not any(cat in incident_type for cat in relevant_categories):
            return False
        
        # Highway indicators
        highway_indicators = [
            'I-', 'I5', 'I8', 'I10', 'I15', 'I40', 'I80', 'I805', 'I215',
            'SR-', 'Sr', 'STATE ROUTE', 'STATE RT', 'US-', 'US ', 'US HIGHWAY',
            'HWY', 'HIGHWAY', 'FREEWAY', 'INTERSTATE', 'CON', 'CONNECTOR', 'CONN'
        ]
        
        # Check if it's on a highway
        location_text = f"{location}".upper()
        if not any(indicator in location_text for indicator in highway_indicators):
            return False
        
        return True
    
    def parse_lane_blockage(self, details_text: str) -> Dict[str, Any]:
        """Parse lane blockage information from details"""
        if not details_text:
            return {'status': 'unknown', 'details': []}
        
        lines = details_text.split(' | ')
        blockage_info = []
        
        # Resolved status keywords
        resolved_keywords = ['NEG BLOCKING', 'NEG BLK', 'CLEARED', 'RESOLVED']
        
        # Lane blockage keywords
        blockage_keywords = [
            'BLKG', 'BLOCKING', '#1 LN', 'SLOW LN', 'MIDDLE LN', 
            'RHS', 'RS', 'CD', 'LANE', 'LN', 'VEH IN', 'DEBRIS'
        ]
        
        for line in lines:
            line_upper = line.upper()
            
            # Check for resolved status
            if any(resolved in line_upper for resolved in resolved_keywords):
                return {'status': 'resolved', 'details': [line]}
            
            # Check for lane blockage keywords
            if any(keyword in line_upper for keyword in blockage_keywords):
                blockage_info.append(line)
        
        if blockage_info:
            return {'status': 'blocking', 'details': blockage_info}
        else:
            return {'status': 'no_blockage', 'details': []}
    
    def scrape_all_centers_sync(self, centers: List[str] = None, previous_incidents_map: Dict[str, List[Dict]] = None) -> List[Dict[str, Any]]:
        """Scrape all specified centers using synchronous requests"""
        centers = centers or self.production_centers
        previous_incidents_map = previous_incidents_map or {}
        
        self.logger.info(f"🚀 Starting synchronous HTTP scraping of {len(centers)} centers...")
        
        results = []
        for center in centers:
            previous_incidents = previous_incidents_map.get(center, [])
            result = self.scrape_center_sync(center, previous_incidents)
            results.append(result)
            
            # Small delay to be respectful to CHP servers
            time.sleep(0.1)
        
        return results
    
    async def scrape_all_centers_async(self, centers: List[str] = None, previous_incidents_map: Dict[str, List[Dict]] = None) -> List[Dict[str, Any]]:
        """Scrape all specified centers using asynchronous requests"""
        centers = centers or self.production_centers
        previous_incidents_map = previous_incidents_map or {}
        
        self.logger.info(f"🚀 Starting asynchronous HTTP scraping of {len(centers)} centers...")
        
        connector = aiohttp.TCPConnector(limit=25, limit_per_host=10)
        timeout = aiohttp.ClientTimeout(total=30)
        
        async with aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={
                'User-Agent': 'Mozilla/5.0 (compatible; CHP-Traffic-Monitor/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive'
            }
        ) as session:
            
            # Create tasks for all centers
            tasks = [
                self.scrape_center_async(session, center, previous_incidents_map.get(center, []))
                for center in centers
            ]
            
            # Execute all tasks in parallel
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            processed_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    center = centers[i]
                    processed_results.append({
                        'center': center,
                        'centerName': self.center_mapper.get_center_name(center),
                        'incidents': [],
                        'incidentCount': 0,
                        'timestamp': datetime.now().isoformat(),
                        'hasChanges': False,
                        'status': 'error',
                        'error': str(result),
                        'responseTime': 0
                    })
                else:
                    processed_results.append(result)
            
            return processed_results
    
    def get_center_summary(self) -> Dict[str, Any]:
        """Get summary of all available centers"""
        return {
            'total_centers': len(self.all_centers),
            'production_centers': self.production_centers,
            'all_centers': self.all_centers,
            'center_names': {code: self.center_mapper.get_center_name(code) for code in self.all_centers}
        }

# Convenience functions for backward compatibility
def scrape_center_http(center_code: str, previous_incidents: List[Dict] = None) -> Dict[str, Any]:
    """Convenience function to scrape a single center"""
    scraper = HTTPScraper()
    return scraper.scrape_center_sync(center_code, previous_incidents)

def scrape_all_centers_http(centers: List[str] = None, previous_incidents_map: Dict[str, List[Dict]] = None) -> List[Dict[str, Any]]:
    """Convenience function to scrape all centers"""
    scraper = HTTPScraper()
    return scraper.scrape_all_centers_sync(centers, previous_incidents_map)

async def scrape_all_centers_http_async(centers: List[str] = None, previous_incidents_map: Dict[str, List[Dict]] = None) -> List[Dict[str, Any]]:
    """Convenience function to scrape all centers asynchronously"""
    scraper = HTTPScraper()
    return await scraper.scrape_all_centers_async(centers, previous_incidents_map)

if __name__ == "__main__":
    """Test the HTTP scraper"""
    import argparse
    
    parser = argparse.ArgumentParser(description='CHP HTTP Traffic Scraper')
    parser.add_argument('--center', default='BCCC', 
                       choices=['BCCC', 'LACC', 'OCCC', 'SACC'] + [c for c in CenterMapper().get_available_centers() if c not in ['BCCC', 'LACC', 'OCCC', 'SACC']],
                       help='Communication center to scrape')
    parser.add_argument('--async-mode', action='store_true',
                       help='Use asynchronous scraping')
    parser.add_argument('--all', action='store_true',
                       help='Scrape all production centers')
    
    args = parser.parse_args()
    
    scraper = HTTPScraper()
    
    if args.all:
        if args.async_mode:
            results = asyncio.run(scraper.scrape_all_centers_async())
        else:
            results = scraper.scrape_all_centers_sync()
        
        print(f"\n📊 Scraped {len(results)} centers:")
        for result in results:
            status = "✅" if result['status'] == 'success' else "❌"
            print(f"  {status} {result['center']}: {result['incidentCount']} incidents")
    else:
        result = scraper.scrape_center_sync(args.center)
        status = "✅" if result['status'] == 'success' else "❌"
        print(f"{status} {result['center']}: {result['incidentCount']} incidents")
