#!/usr/bin/env python3
"""
HTTP Scraper Testing Suite
Tests HTTP-based scraping for all 25 CHP communication centers
Follows system principles: SOLID, dependency injection, comprehensive logging
"""

import asyncio
import aiohttp
import requests
import time
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from bs4 import BeautifulSoup
import sys
import os

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from core.center_mapper import CenterMapper

@dataclass
class TestResult:
    """Test result data structure"""
    center_code: str
    center_name: str
    success: bool
    incident_count: int
    response_time: float
    error_message: Optional[str] = None
    http_status: Optional[int] = None
    incidents: List[Dict[str, Any]] = None
    details_links_working: bool = False
    form_data_extracted: Dict[str, str] = None

class HTTPScraperTester:
    """HTTP-based scraper tester following system principles"""
    
    def __init__(self):
        self.base_url = "https://cad.chp.ca.gov/Traffic.aspx"
        self.center_mapper = CenterMapper()
        self.all_centers = self.center_mapper.get_available_centers()
        self.session = None
        self.results = []
        
        # Setup logging
        self.setup_logging()
        
    def setup_logging(self):
        """Setup comprehensive logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('http_test_results.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def test_single_center_sync(self, center_code: str) -> TestResult:
        """Test single center using synchronous requests"""
        start_time = time.time()
        center_name = self.center_mapper.get_center_name(center_code)
        
        try:
            self.logger.info(f"🔄 Testing {center_code} ({center_name}) with HTTP requests...")
            
            # Create session with proper headers
            session = requests.Session()
            session.headers.update({
                'User-Agent': 'Mozilla/5.0 (compatible; CHP-Traffic-Monitor/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            })
            
            # Step 1: GET the initial page
            response = session.get(self.base_url, timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code != 200:
                return TestResult(
                    center_code=center_code,
                    center_name=center_name,
                    success=False,
                    incident_count=0,
                    response_time=response_time,
                    error_message=f"HTTP {response.status_code}: Failed to load page",
                    http_status=response.status_code
                )
            
            # Step 2: Parse form data
            soup = BeautifulSoup(response.text, 'html.parser')
            form_data = self.extract_form_data(soup, center_code)
            
            # Step 3: POST the form
            post_start = time.time()
            response = session.post(self.base_url, data=form_data, timeout=30)
            post_time = time.time() - post_start
            
            if response.status_code != 200:
                return TestResult(
                    center_code=center_code,
                    center_name=center_name,
                    success=False,
                    incident_count=0,
                    response_time=response_time + post_time,
                    error_message=f"HTTP {response.status_code}: Failed to submit form",
                    http_status=response.status_code,
                    form_data_extracted=form_data
                )
            
            # Step 4: Parse incidents
            incidents = self.parse_incidents(response.text, center_code)
            
            # Step 5: Test details links
            details_working = self.test_details_links(response.text, center_code)
            
            total_time = time.time() - start_time
            
            self.logger.info(f"✅ {center_code}: {len(incidents)} incidents in {total_time:.2f}s")
            
            return TestResult(
                center_code=center_code,
                center_name=center_name,
                success=True,
                incident_count=len(incidents),
                response_time=total_time,
                http_status=response.status_code,
                incidents=incidents,
                details_links_working=details_working,
                form_data_extracted=form_data
            )
            
        except Exception as e:
            response_time = time.time() - start_time
            self.logger.error(f"❌ {center_code}: Error - {str(e)}")
            
            return TestResult(
                center_code=center_code,
                center_name=center_name,
                success=False,
                incident_count=0,
                response_time=response_time,
                error_message=str(e)
            )
    
    async def test_single_center_async(self, session: aiohttp.ClientSession, center_code: str) -> TestResult:
        """Test single center using asynchronous requests"""
        start_time = time.time()
        center_name = self.center_mapper.get_center_name(center_code)
        
        try:
            self.logger.info(f"🔄 Testing {center_code} ({center_name}) with async HTTP requests...")
            
            # Step 1: GET the initial page
            async with session.get(self.base_url) as response:
                response_time = time.time() - start_time
                
                if response.status != 200:
                    return TestResult(
                        center_code=center_code,
                        center_name=center_name,
                        success=False,
                        incident_count=0,
                        response_time=response_time,
                        error_message=f"HTTP {response.status}: Failed to load page",
                        http_status=response.status
                    )
                
                html = await response.text()
            
            # Step 2: Parse form data
            soup = BeautifulSoup(html, 'html.parser')
            form_data = self.extract_form_data(soup, center_code)
            
            # Step 3: POST the form
            post_start = time.time()
            async with session.post(self.base_url, data=form_data) as response:
                post_time = time.time() - post_start
                
                if response.status != 200:
                    return TestResult(
                        center_code=center_code,
                        center_name=center_name,
                        success=False,
                        incident_count=0,
                        response_time=response_time + post_time,
                        error_message=f"HTTP {response.status}: Failed to submit form",
                        http_status=response.status,
                        form_data_extracted=form_data
                    )
                
                html = await response.text()
            
            # Step 4: Parse incidents
            incidents = self.parse_incidents(html, center_code)
            
            # Step 5: Test details links
            details_working = self.test_details_links(html, center_code)
            
            total_time = time.time() - start_time
            
            self.logger.info(f"✅ {center_code}: {len(incidents)} incidents in {total_time:.2f}s")
            
            return TestResult(
                center_code=center_code,
                center_name=center_name,
                success=True,
                incident_count=len(incidents),
                response_time=total_time,
                http_status=response.status,
                incidents=incidents,
                details_links_working=details_working,
                form_data_extracted=form_data
            )
            
        except Exception as e:
            response_time = time.time() - start_time
            self.logger.error(f"❌ {center_code}: Error - {str(e)}")
            
            return TestResult(
                center_code=center_code,
                center_name=center_name,
                success=False,
                incident_count=0,
                response_time=response_time,
                error_message=str(e)
            )
    
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
    
    def test_details_links(self, html: str, center_code: str) -> bool:
        """Test if details links are present and accessible"""
        soup = BeautifulSoup(html, 'html.parser')
        
        # Look for Details links
        details_links = soup.find_all('a', string=lambda text: text and 'Details' in text)
        
        if not details_links:
            return False
        
        # Check if links have href attributes (direct links)
        for link in details_links:
            href = link.get('href')
            if href and not href.startswith('#'):
                return True
        
        # Check if links have onclick attributes (JavaScript)
        for link in details_links:
            onclick = link.get('onclick')
            if onclick:
                return True
        
        return False
    
    def test_all_centers_sync(self) -> List[TestResult]:
        """Test all centers using synchronous requests"""
        self.logger.info(f"🚀 Starting synchronous HTTP testing for {len(self.all_centers)} centers...")
        
        results = []
        for i, center_code in enumerate(self.all_centers, 1):
            self.logger.info(f"📊 Progress: {i}/{len(self.all_centers)}")
            result = self.test_single_center_sync(center_code)
            results.append(result)
            
            # Small delay to be respectful to CHP servers
            time.sleep(0.5)
        
        self.results = results
        return results
    
    async def test_all_centers_async(self) -> List[TestResult]:
        """Test all centers using asynchronous requests"""
        self.logger.info(f"🚀 Starting asynchronous HTTP testing for {len(self.all_centers)} centers...")
        
        connector = aiohttp.TCPConnector(limit=10, limit_per_host=5)
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
                self.test_single_center_async(session, center_code)
                for center_code in self.all_centers
            ]
            
            # Execute all tasks in parallel
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            processed_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    center_code = self.all_centers[i]
                    processed_results.append(TestResult(
                        center_code=center_code,
                        center_name=self.center_mapper.get_center_name(center_code),
                        success=False,
                        incident_count=0,
                        response_time=0,
                        error_message=str(result)
                    ))
                else:
                    processed_results.append(result)
            
            self.results = processed_results
            return processed_results
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive test report"""
        if not self.results:
            return {"error": "No test results available"}
        
        successful_tests = [r for r in self.results if r.success]
        failed_tests = [r for r in self.results if not r.success]
        
        total_incidents = sum(r.incident_count for r in successful_tests)
        avg_response_time = sum(r.response_time for r in successful_tests) / len(successful_tests) if successful_tests else 0
        
        report = {
            "test_summary": {
                "total_centers": len(self.all_centers),
                "successful_tests": len(successful_tests),
                "failed_tests": len(failed_tests),
                "success_rate": len(successful_tests) / len(self.all_centers) * 100,
                "total_incidents_found": total_incidents,
                "average_response_time": avg_response_time,
                "test_timestamp": datetime.now().isoformat()
            },
            "successful_centers": [
                {
                    "center_code": r.center_code,
                    "center_name": r.center_name,
                    "incident_count": r.incident_count,
                    "response_time": r.response_time,
                    "details_links_working": r.details_links_working
                }
                for r in successful_tests
            ],
            "failed_centers": [
                {
                    "center_code": r.center_code,
                    "center_name": r.center_name,
                    "error_message": r.error_message,
                    "http_status": r.http_status
                }
                for r in failed_tests
            ],
            "performance_analysis": {
                "fastest_center": min(successful_tests, key=lambda x: x.response_time).center_code if successful_tests else None,
                "slowest_center": max(successful_tests, key=lambda x: x.response_time).center_code if successful_tests else None,
                "most_incidents": max(successful_tests, key=lambda x: x.incident_count).center_code if successful_tests else None,
                "least_incidents": min(successful_tests, key=lambda x: x.incident_count).center_code if successful_tests else None
            },
            "details_links_analysis": {
                "centers_with_working_details": len([r for r in successful_tests if r.details_links_working]),
                "centers_without_working_details": len([r for r in successful_tests if not r.details_links_working])
            }
        }
        
        return report
    
    def save_results(self, filename: str = None):
        """Save test results to JSON file"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"http_test_results_{timestamp}.json"
        
        report = self.generate_report()
        
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)
        
        self.logger.info(f"📄 Test results saved to {filename}")
        return filename

def main():
    """Main function for running HTTP scraper tests"""
    print("🔬 CHP HTTP Scraper Testing Suite")
    print("=" * 50)
    
    tester = HTTPScraperTester()
    
    # Ask user for test type
    print("\nSelect test type:")
    print("1. Synchronous testing (slower, more reliable)")
    print("2. Asynchronous testing (faster, parallel)")
    print("3. Test single center")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    if choice == "1":
        print("\n🔄 Running synchronous tests...")
        results = tester.test_all_centers_sync()
        
    elif choice == "2":
        print("\n🔄 Running asynchronous tests...")
        results = asyncio.run(tester.test_all_centers_async())
        
    elif choice == "3":
        center_code = input("Enter center code (e.g., BCCC): ").strip().upper()
        if center_code in tester.all_centers:
            print(f"\n🔄 Testing {center_code}...")
            result = tester.test_single_center_sync(center_code)
            results = [result]
        else:
            print(f"❌ Invalid center code: {center_code}")
            return
    
    else:
        print("❌ Invalid choice")
        return
    
    # Generate and display report
    report = tester.generate_report()
    
    print("\n📊 Test Results Summary:")
    print("=" * 30)
    print(f"Total Centers: {report['test_summary']['total_centers']}")
    print(f"Successful: {report['test_summary']['successful_tests']}")
    print(f"Failed: {report['test_summary']['failed_tests']}")
    print(f"Success Rate: {report['test_summary']['success_rate']:.1f}%")
    print(f"Total Incidents: {report['test_summary']['total_incidents_found']}")
    print(f"Avg Response Time: {report['test_summary']['average_response_time']:.2f}s")
    
    if report['failed_centers']:
        print(f"\n❌ Failed Centers:")
        for failed in report['failed_centers']:
            print(f"  - {failed['center_code']}: {failed['error_message']}")
    
    # Save results
    filename = tester.save_results()
    print(f"\n📄 Detailed results saved to: {filename}")
    
    # Migration recommendation
    success_rate = report['test_summary']['success_rate']
    if success_rate >= 90:
        print("\n✅ RECOMMENDATION: HTTP migration is highly viable!")
        print("   - High success rate indicates CHP site works well with HTTP requests")
        print("   - Proceed with HTTP-based scraper implementation")
    elif success_rate >= 70:
        print("\n⚠️  RECOMMENDATION: HTTP migration is partially viable")
        print("   - Some centers may need WebDriver fallback")
        print("   - Consider hybrid approach")
    else:
        print("\n❌ RECOMMENDATION: HTTP migration not recommended")
        print("   - Low success rate indicates CHP site requires WebDriver")
        print("   - Stick with current WebDriver approach")

if __name__ == "__main__":
    main()
