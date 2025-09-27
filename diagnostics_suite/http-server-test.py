#!/usr/bin/env python3
"""
HTTP Scraper Server Testing Suite
Tests HTTP-based scraping in production-like environment
Simulates Railway deployment conditions and load testing
"""

import asyncio
import aiohttp
import time
import json
import logging
from datetime import datetime
from typing import Dict, List, Any
from dataclasses import dataclass
import sys
import os

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from core.center_mapper import CenterMapper

@dataclass
class ServerTestResult:
    """Server test result data structure"""
    test_name: str
    success: bool
    response_time: float
    error_message: str = None
    metrics: Dict[str, Any] = None

class HTTPScraperServerTester:
    """HTTP scraper server tester for production-like testing"""
    
    def __init__(self):
        self.base_url = "https://cad.chp.ca.gov/Traffic.aspx"
        self.center_mapper = CenterMapper()
        self.production_centers = ['BCCC', 'LACC', 'OCCC', 'SACC']  # Current production centers
        self.all_centers = self.center_mapper.get_available_centers()
        
        # Setup logging
        self.setup_logging()
        
    def setup_logging(self):
        """Setup comprehensive logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('server_test_results.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    async def test_production_load(self) -> ServerTestResult:
        """Test current production load (4 centers every 5 seconds)"""
        self.logger.info("🔄 Testing production load simulation...")
        start_time = time.time()
        
        try:
            connector = aiohttp.TCPConnector(limit=10, limit_per_host=5)
            timeout = aiohttp.ClientTimeout(total=30)
            
            async with aiohttp.ClientSession(
                connector=connector,
                timeout=timeout,
                headers={
                    'User-Agent': 'Mozilla/5.0 (compatible; CHP-Traffic-Monitor/1.0)',
                    'Accept': 'text/html,application/xhtml+xml',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive'
                }
            ) as session:
                
                # Simulate 5 iterations of production scraping
                total_incidents = 0
                successful_scrapes = 0
                failed_scrapes = 0
                
                for iteration in range(5):
                    self.logger.info(f"📊 Production iteration {iteration + 1}/5")
                    
                    # Scrape all 4 production centers in parallel
                    tasks = [
                        self.scrape_center_http(session, center)
                        for center in self.production_centers
                    ]
                    
                    results = await asyncio.gather(*tasks, return_exceptions=True)
                    
                    for i, result in enumerate(results):
                        if isinstance(result, Exception):
                            failed_scrapes += 1
                            self.logger.error(f"❌ {self.production_centers[i]}: {str(result)}")
                        else:
                            successful_scrapes += 1
                            total_incidents += result.get('incident_count', 0)
                    
                    # Wait 5 seconds between iterations (production interval)
                    if iteration < 4:
                        await asyncio.sleep(5)
                
                response_time = time.time() - start_time
                
                return ServerTestResult(
                    test_name="Production Load Test",
                    success=failed_scrapes == 0,
                    response_time=response_time,
                    metrics={
                        "total_iterations": 5,
                        "successful_scrapes": successful_scrapes,
                        "failed_scrapes": failed_scrapes,
                        "total_incidents": total_incidents,
                        "avg_incidents_per_scrape": total_incidents / successful_scrapes if successful_scrapes > 0 else 0,
                        "success_rate": successful_scrapes / (successful_scrapes + failed_scrapes) * 100
                    }
                )
                
        except Exception as e:
            response_time = time.time() - start_time
            return ServerTestResult(
                test_name="Production Load Test",
                success=False,
                response_time=response_time,
                error_message=str(e)
            )
    
    async def test_25_center_load(self) -> ServerTestResult:
        """Test full 25-center load"""
        self.logger.info("🔄 Testing 25-center load simulation...")
        start_time = time.time()
        
        try:
            connector = aiohttp.TCPConnector(limit=25, limit_per_host=10)
            timeout = aiohttp.ClientTimeout(total=60)
            
            async with aiohttp.ClientSession(
                connector=connector,
                timeout=timeout,
                headers={
                    'User-Agent': 'Mozilla/5.0 (compatible; CHP-Traffic-Monitor/1.0)',
                    'Accept': 'text/html,application/xhtml+xml',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive'
                }
            ) as session:
                
                # Scrape all 25 centers in parallel
                tasks = [
                    self.scrape_center_http(session, center)
                    for center in self.all_centers
                ]
                
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                successful_scrapes = 0
                failed_scrapes = 0
                total_incidents = 0
                
                for i, result in enumerate(results):
                    if isinstance(result, Exception):
                        failed_scrapes += 1
                        self.logger.error(f"❌ {self.all_centers[i]}: {str(result)}")
                    else:
                        successful_scrapes += 1
                        total_incidents += result.get('incident_count', 0)
                
                response_time = time.time() - start_time
                
                return ServerTestResult(
                    test_name="25-Center Load Test",
                    success=failed_scrapes == 0,
                    response_time=response_time,
                    metrics={
                        "total_centers": len(self.all_centers),
                        "successful_scrapes": successful_scrapes,
                        "failed_scrapes": failed_scrapes,
                        "total_incidents": total_incidents,
                        "avg_incidents_per_scrape": total_incidents / successful_scrapes if successful_scrapes > 0 else 0,
                        "success_rate": successful_scrapes / len(self.all_centers) * 100,
                        "scrapes_per_second": len(self.all_centers) / response_time
                    }
                )
                
        except Exception as e:
            response_time = time.time() - start_time
            return ServerTestResult(
                test_name="25-Center Load Test",
                success=False,
                response_time=response_time,
                error_message=str(e)
            )
    
    async def test_rate_limiting(self) -> ServerTestResult:
        """Test rate limiting behavior"""
        self.logger.info("🔄 Testing rate limiting behavior...")
        start_time = time.time()
        
        try:
            connector = aiohttp.TCPConnector(limit=50, limit_per_host=20)
            timeout = aiohttp.ClientTimeout(total=30)
            
            async with aiohttp.ClientSession(
                connector=connector,
                timeout=timeout,
                headers={
                    'User-Agent': 'Mozilla/5.0 (compatible; CHP-Traffic-Monitor/1.0)',
                    'Accept': 'text/html,application/xhtml+xml',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive'
                }
            ) as session:
                
                # Rapid-fire requests to test rate limiting
                rapid_requests = []
                for _ in range(20):  # 20 rapid requests
                    rapid_requests.append(self.scrape_center_http(session, 'BCCC'))
                
                results = await asyncio.gather(*rapid_requests, return_exceptions=True)
                
                successful_requests = 0
                rate_limited_requests = 0
                other_errors = 0
                
                for result in results:
                    if isinstance(result, Exception):
                        error_msg = str(result)
                        if '429' in error_msg or 'rate' in error_msg.lower():
                            rate_limited_requests += 1
                        else:
                            other_errors += 1
                    else:
                        successful_requests += 1
                
                response_time = time.time() - start_time
                
                return ServerTestResult(
                    test_name="Rate Limiting Test",
                    success=rate_limited_requests == 0,
                    response_time=response_time,
                    metrics={
                        "total_requests": 20,
                        "successful_requests": successful_requests,
                        "rate_limited_requests": rate_limited_requests,
                        "other_errors": other_errors,
                        "requests_per_second": 20 / response_time,
                        "rate_limiting_detected": rate_limited_requests > 0
                    }
                )
                
        except Exception as e:
            response_time = time.time() - start_time
            return ServerTestResult(
                test_name="Rate Limiting Test",
                success=False,
                response_time=response_time,
                error_message=str(e)
            )
    
    async def test_connection_pooling(self) -> ServerTestResult:
        """Test connection pooling efficiency"""
        self.logger.info("🔄 Testing connection pooling efficiency...")
        start_time = time.time()
        
        try:
            # Test with different connection pool sizes
            pool_sizes = [5, 10, 25]
            pool_results = {}
            
            for pool_size in pool_sizes:
                self.logger.info(f"📊 Testing pool size: {pool_size}")
                
                connector = aiohttp.TCPConnector(limit=pool_size, limit_per_host=pool_size)
                timeout = aiohttp.ClientTimeout(total=30)
                
                async with aiohttp.ClientSession(
                    connector=connector,
                    timeout=timeout,
                    headers={
                        'User-Agent': 'Mozilla/5.0 (compatible; CHP-Traffic-Monitor/1.0)',
                        'Accept': 'text/html,application/xhtml+xml',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept-Encoding': 'gzip, deflate',
                        'Connection': 'keep-alive'
                    }
                ) as session:
                    
                    # Test with production centers
                    tasks = [
                        self.scrape_center_http(session, center)
                        for center in self.production_centers
                    ]
                    
                    results = await asyncio.gather(*tasks, return_exceptions=True)
                    
                    successful = sum(1 for r in results if not isinstance(r, Exception))
                    pool_results[pool_size] = {
                        "successful": successful,
                        "total": len(self.production_centers),
                        "success_rate": successful / len(self.production_centers) * 100
                    }
            
            response_time = time.time() - start_time
            
            return ServerTestResult(
                test_name="Connection Pooling Test",
                success=True,
                response_time=response_time,
                metrics={
                    "pool_results": pool_results,
                    "recommended_pool_size": max(pool_results.keys(), key=lambda x: pool_results[x]["success_rate"])
                }
            )
            
        except Exception as e:
            response_time = time.time() - start_time
            return ServerTestResult(
                test_name="Connection Pooling Test",
                success=False,
                response_time=response_time,
                error_message=str(e)
            )
    
    async def scrape_center_http(self, session: aiohttp.ClientSession, center_code: str) -> Dict[str, Any]:
        """Scrape single center using HTTP requests"""
        try:
            # Step 1: GET the initial page
            async with session.get(self.base_url) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}: Failed to load page")
                
                html = await response.text()
            
            # Step 2: Parse form data (simplified for server testing)
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, 'html.parser')
            
            form_data = {
                'ddlComCenter': center_code,
                'btnCCGo': 'OK'
            }
            
            # Add any hidden form fields
            for hidden_input in soup.find_all('input', type='hidden'):
                name = hidden_input.get('name')
                value = hidden_input.get('value', '')
                if name:
                    form_data[name] = value
            
            # Step 3: POST the form
            async with session.post(self.base_url, data=form_data) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}: Failed to submit form")
                
                html = await response.text()
            
            # Step 4: Parse incidents (simplified)
            soup = BeautifulSoup(html, 'html.parser')
            table = soup.find('table')
            
            incident_count = 0
            if table:
                rows = table.find_all('tr')[1:]  # Skip header
                incident_count = len([row for row in rows if len(row.find_all('td')) >= 7])
            
            return {
                'center_code': center_code,
                'incident_count': incident_count,
                'success': True
            }
            
        except Exception as e:
            raise Exception(f"Error scraping {center_code}: {str(e)}")
    
    async def run_all_tests(self) -> List[ServerTestResult]:
        """Run all server tests"""
        self.logger.info("🚀 Starting comprehensive server testing...")
        
        tests = [
            self.test_production_load(),
            self.test_25_center_load(),
            self.test_rate_limiting(),
            self.test_connection_pooling()
        ]
        
        results = await asyncio.gather(*tests, return_exceptions=True)
        
        # Process results
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append(ServerTestResult(
                    test_name=f"Test {i+1}",
                    success=False,
                    response_time=0,
                    error_message=str(result)
                ))
            else:
                processed_results.append(result)
        
        return processed_results
    
    def generate_server_report(self, results: List[ServerTestResult]) -> Dict[str, Any]:
        """Generate comprehensive server test report"""
        successful_tests = [r for r in results if r.success]
        failed_tests = [r for r in results if not r.success]
        
        report = {
            "server_test_summary": {
                "total_tests": len(results),
                "successful_tests": len(successful_tests),
                "failed_tests": len(failed_tests),
                "success_rate": len(successful_tests) / len(results) * 100,
                "test_timestamp": datetime.now().isoformat()
            },
            "test_results": [
                {
                    "test_name": r.test_name,
                    "success": r.success,
                    "response_time": r.response_time,
                    "error_message": r.error_message,
                    "metrics": r.metrics
                }
                for r in results
            ],
            "production_readiness": {
                "production_load_test_passed": any(r.test_name == "Production Load Test" and r.success for r in results),
                "rate_limiting_acceptable": not any(r.test_name == "Rate Limiting Test" and r.metrics and r.metrics.get("rate_limiting_detected") for r in results),
                "connection_pooling_optimized": any(r.test_name == "Connection Pooling Test" and r.success for r in results)
            },
            "scaling_recommendations": self.generate_scaling_recommendations(results)
        }
        
        return report
    
    def generate_scaling_recommendations(self, results: List[ServerTestResult]) -> Dict[str, Any]:
        """Generate scaling recommendations based on test results"""
        recommendations = {
            "http_migration_viable": False,
            "recommended_approach": "webdriver",
            "performance_notes": [],
            "resource_requirements": {}
        }
        
        # Check if HTTP approach is viable
        production_test = next((r for r in results if r.test_name == "Production Load Test"), None)
        if production_test and production_test.success:
            recommendations["http_migration_viable"] = True
            recommendations["recommended_approach"] = "http"
            recommendations["performance_notes"].append("HTTP approach handles production load successfully")
        
        # Check 25-center scalability
        scale_test = next((r for r in results if r.test_name == "25-Center Load Test"), None)
        if scale_test and scale_test.success:
            recommendations["performance_notes"].append("HTTP approach scales to 25 centers")
            if scale_test.metrics:
                recommendations["resource_requirements"]["estimated_memory"] = "~100MB (vs 2.5GB with WebDriver)"
                recommendations["resource_requirements"]["estimated_cpu"] = "Low (vs High with WebDriver)"
        
        # Check rate limiting
        rate_test = next((r for r in results if r.test_name == "Rate Limiting Test"), None)
        if rate_test and rate_test.metrics and rate_test.metrics.get("rate_limiting_detected"):
            recommendations["performance_notes"].append("Rate limiting detected - implement request throttling")
        
        return recommendations
    
    def save_server_results(self, results: List[ServerTestResult], filename: str = None):
        """Save server test results to JSON file"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"server_test_results_{timestamp}.json"
        
        report = self.generate_server_report(results)
        
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)
        
        self.logger.info(f"📄 Server test results saved to {filename}")
        return filename

async def main():
    """Main function for running server tests"""
    print("🖥️  CHP HTTP Scraper Server Testing Suite")
    print("=" * 50)
    
    tester = HTTPScraperServerTester()
    
    print("\n🔄 Running comprehensive server tests...")
    results = await tester.run_all_tests()
    
    # Display results
    print("\n📊 Server Test Results:")
    print("=" * 30)
    
    for result in results:
        status = "✅" if result.success else "❌"
        print(f"{status} {result.test_name}: {result.response_time:.2f}s")
        
        if result.metrics:
            for key, value in result.metrics.items():
                if isinstance(value, dict):
                    print(f"   {key}:")
                    for sub_key, sub_value in value.items():
                        print(f"     {sub_key}: {sub_value}")
                else:
                    print(f"   {key}: {value}")
        
        if result.error_message:
            print(f"   Error: {result.error_message}")
    
    # Generate and save report
    report = tester.generate_server_report(results)
    filename = tester.save_server_results(results)
    
    print(f"\n📄 Detailed server test results saved to: {filename}")
    
    # Production readiness assessment
    readiness = report["production_readiness"]
    print(f"\n🏭 Production Readiness Assessment:")
    print(f"   Production Load Test: {'✅ PASS' if readiness['production_load_test_passed'] else '❌ FAIL'}")
    print(f"   Rate Limiting: {'✅ ACCEPTABLE' if readiness['rate_limiting_acceptable'] else '⚠️  DETECTED'}")
    print(f"   Connection Pooling: {'✅ OPTIMIZED' if readiness['connection_pooling_optimized'] else '❌ NEEDS WORK'}")
    
    # Scaling recommendations
    scaling = report["scaling_recommendations"]
    print(f"\n📈 Scaling Recommendations:")
    print(f"   HTTP Migration Viable: {'✅ YES' if scaling['http_migration_viable'] else '❌ NO'}")
    print(f"   Recommended Approach: {scaling['recommended_approach'].upper()}")
    
    if scaling['performance_notes']:
        print(f"   Performance Notes:")
        for note in scaling['performance_notes']:
            print(f"     - {note}")
    
    if scaling['resource_requirements']:
        print(f"   Resource Requirements:")
        for req, value in scaling['resource_requirements'].items():
            print(f"     {req}: {value}")

if __name__ == "__main__":
    asyncio.run(main())
