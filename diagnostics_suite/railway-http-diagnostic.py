#!/usr/bin/env python3
"""
Railway HTTP Scraper Diagnostic Script
Tests HTTP-based scraping through Railway deployment
Uses Railway CLI to execute tests on the actual Railway server
"""

import asyncio
import aiohttp
import requests
import time
import json
import logging
import subprocess
import sys
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from core.center_mapper import CenterMapper

@dataclass
class RailwayTestResult:
    """Railway test result data structure"""
    test_name: str
    success: bool
    response_time: float
    railway_response: str = None
    error_message: str = None
    metrics: Dict[str, Any] = None

class RailwayHTTPDiagnostic:
    """Railway HTTP scraper diagnostic tool"""
    
    def __init__(self):
        self.center_mapper = CenterMapper()
        self.production_centers = ['BCCC', 'LACC', 'OCCC', 'SACC']
        self.all_centers = self.center_mapper.get_available_centers()
        self.base_url = "https://cad.chp.ca.gov/Traffic.aspx"
        
        # Setup logging
        self.setup_logging()
        
    def setup_logging(self):
        """Setup comprehensive logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('railway_http_test_results.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def check_railway_auth(self) -> bool:
        """Check if Railway CLI is authenticated"""
        try:
            result = subprocess.run(['railway', 'status'], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                self.logger.info("✅ Railway CLI authenticated")
                return True
            else:
                self.logger.error(f"❌ Railway CLI not authenticated: {result.stderr}")
                return False
        except Exception as e:
            self.logger.error(f"❌ Error checking Railway auth: {e}")
            return False
    
    def get_railway_service_info(self) -> Dict[str, str]:
        """Get Railway service information"""
        try:
            result = subprocess.run(['railway', 'status'], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                # Parse Railway status output
                lines = result.stdout.strip().split('\n')
                service_info = {}
                for line in lines:
                    if ':' in line:
                        key, value = line.split(':', 1)
                        service_info[key.strip()] = value.strip()
                return service_info
            else:
                self.logger.error(f"❌ Failed to get Railway status: {result.stderr}")
                return {}
        except Exception as e:
            self.logger.error(f"❌ Error getting Railway service info: {e}")
            return {}
    
    def create_railway_test_script(self) -> str:
        """Create a test script to run on Railway"""
        script_content = '''
#!/usr/bin/env python3
"""
HTTP Test Script for Railway Environment
Tests HTTP requests from Railway's infrastructure
"""

import asyncio
import aiohttp
import requests
import time
import json
from datetime import datetime
from bs4 import BeautifulSoup

async def test_http_from_railway():
    """Test HTTP requests from Railway environment"""
    base_url = "https://cad.chp.ca.gov/Traffic.aspx"
    centers = ['BCCC', 'LACC', 'OCCC', 'SACC']
    
    results = {
        "railway_environment": {
            "timestamp": datetime.now().isoformat(),
            "test_type": "HTTP requests from Railway",
            "centers_tested": centers
        },
        "test_results": []
    }
    
    # Test with requests (synchronous)
    print("🔄 Testing synchronous HTTP requests from Railway...")
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (compatible; CHP-Traffic-Monitor/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
    })
    
    for center in centers:
        start_time = time.time()
        try:
            # Step 1: GET the page
            response = session.get(base_url, timeout=30)
            if response.status_code != 200:
                raise Exception(f"HTTP {response.status_code}: Failed to load page")
            
            # Step 2: Parse form data
            soup = BeautifulSoup(response.text, 'html.parser')
            form_data = {
                'ddlComCenter': center,
                'btnCCGo': 'OK'
            }
            
            # Add hidden fields
            for hidden_input in soup.find_all('input', type='hidden'):
                name = hidden_input.get('name')
                value = hidden_input.get('value', '')
                if name:
                    form_data[name] = value
            
            # Step 3: POST the form
            response = session.post(base_url, data=form_data, timeout=30)
            if response.status_code != 200:
                raise Exception(f"HTTP {response.status_code}: Failed to submit form")
            
            # Step 4: Parse incidents
            soup = BeautifulSoup(response.text, 'html.parser')
            table = soup.find('table')
            incident_count = 0
            if table:
                rows = table.find_all('tr')[1:]  # Skip header
                incident_count = len([row for row in rows if len(row.find_all('td')) >= 7])
            
            response_time = time.time() - start_time
            
            result = {
                "center": center,
                "success": True,
                "incident_count": incident_count,
                "response_time": response_time,
                "http_status": response.status_code
            }
            
            print(f"✅ {center}: {incident_count} incidents in {response_time:.2f}s")
            
        except Exception as e:
            response_time = time.time() - start_time
            result = {
                "center": center,
                "success": False,
                "error": str(e),
                "response_time": response_time
            }
            print(f"❌ {center}: Error - {str(e)}")
        
        results["test_results"].append(result)
    
    # Test with aiohttp (asynchronous)
    print("\\n🔄 Testing asynchronous HTTP requests from Railway...")
    
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
            
            async def test_center_async(center):
                start_time = time.time()
                try:
                    # GET page
                    async with session.get(base_url) as response:
                        if response.status != 200:
                            raise Exception(f"HTTP {response.status}: Failed to load page")
                        html = await response.text()
                    
                    # Parse form data
                    soup = BeautifulSoup(html, 'html.parser')
                    form_data = {
                        'ddlComCenter': center,
                        'btnCCGo': 'OK'
                    }
                    
                    for hidden_input in soup.find_all('input', type='hidden'):
                        name = hidden_input.get('name')
                        value = hidden_input.get('value', '')
                        if name:
                            form_data[name] = value
                    
                    # POST form
                    async with session.post(base_url, data=form_data) as response:
                        if response.status != 200:
                            raise Exception(f"HTTP {response.status}: Failed to submit form")
                        html = await response.text()
                    
                    # Parse incidents
                    soup = BeautifulSoup(html, 'html.parser')
                    table = soup.find('table')
                    incident_count = 0
                    if table:
                        rows = table.find_all('tr')[1:]
                        incident_count = len([row for row in rows if len(row.find_all('td')) >= 7])
                    
                    response_time = time.time() - start_time
                    
                    result = {
                        "center": center,
                        "success": True,
                        "incident_count": incident_count,
                        "response_time": response_time,
                        "http_status": response.status
                    }
                    
                    print(f"✅ {center}: {incident_count} incidents in {response_time:.2f}s")
                    return result
                    
                except Exception as e:
                    response_time = time.time() - start_time
                    result = {
                        "center": center,
                        "success": False,
                        "error": str(e),
                        "response_time": response_time
                    }
                    print(f"❌ {center}: Error - {str(e)}")
                    return result
            
            # Run async tests
            tasks = [test_center_async(center) for center in centers]
            async_results = await asyncio.gather(*tasks)
            
            results["async_test_results"] = async_results
    
    except Exception as e:
        results["async_test_error"] = str(e)
        print(f"❌ Async test error: {e}")
    
    # Save results
    with open('/tmp/railway_http_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print("\\n📄 Test results saved to /tmp/railway_http_test_results.json")
    return results

if __name__ == "__main__":
    results = asyncio.run(test_http_from_railway())
    print("\\n🎯 Railway HTTP Test Complete!")
'''
        
        script_path = 'railway_http_test.py'
        with open(script_path, 'w') as f:
            f.write(script_content)
        
        return script_path
    
    def run_railway_test(self) -> RailwayTestResult:
        """Run HTTP test on Railway server"""
        self.logger.info("🚀 Running HTTP test on Railway server...")
        start_time = time.time()
        
        try:
            # Check Railway authentication
            if not self.check_railway_auth():
                return RailwayTestResult(
                    test_name="Railway HTTP Test",
                    success=False,
                    response_time=time.time() - start_time,
                    error_message="Railway CLI not authenticated. Run 'railway login' first."
                )
            
            # Get Railway service info
            service_info = self.get_railway_service_info()
            self.logger.info(f"📊 Railway service info: {service_info}")
            
            # Create test script
            script_path = self.create_railway_test_script()
            self.logger.info(f"📝 Created test script: {script_path}")
            
            # Run test on Railway
            self.logger.info("🔄 Executing test script on Railway...")
            result = subprocess.run([
                'railway', 'run', 'python', script_path
            ], capture_output=True, text=True, timeout=300)  # 5 minute timeout
            
            response_time = time.time() - start_time
            
            if result.returncode == 0:
                self.logger.info("✅ Railway test completed successfully")
                
                # Try to get results from Railway
                try:
                    # Download results from Railway
                    download_result = subprocess.run([
                        'railway', 'run', 'cat', '/tmp/railway_http_test_results.json'
                    ], capture_output=True, text=True, timeout=30)
                    
                    if download_result.returncode == 0:
                        railway_results = json.loads(download_result.stdout)
                        self.logger.info("📄 Retrieved test results from Railway")
                    else:
                        railway_results = {"error": "Could not retrieve results"}
                        self.logger.warning("⚠️ Could not retrieve results from Railway")
                        
                except Exception as e:
                    railway_results = {"error": f"Failed to parse results: {e}"}
                    self.logger.warning(f"⚠️ Failed to parse Railway results: {e}")
                
                return RailwayTestResult(
                    test_name="Railway HTTP Test",
                    success=True,
                    response_time=response_time,
                    railway_response=result.stdout,
                    metrics={
                        "service_info": service_info,
                        "test_results": railway_results,
                        "stdout": result.stdout,
                        "stderr": result.stderr
                    }
                )
            else:
                self.logger.error(f"❌ Railway test failed: {result.stderr}")
                return RailwayTestResult(
                    test_name="Railway HTTP Test",
                    success=False,
                    response_time=response_time,
                    error_message=f"Railway test failed: {result.stderr}",
                    railway_response=result.stdout
                )
                
        except subprocess.TimeoutExpired:
            response_time = time.time() - start_time
            return RailwayTestResult(
                test_name="Railway HTTP Test",
                success=False,
                response_time=response_time,
                error_message="Railway test timed out after 5 minutes"
            )
        except Exception as e:
            response_time = time.time() - start_time
            return RailwayTestResult(
                test_name="Railway HTTP Test",
                success=False,
                response_time=response_time,
                error_message=str(e)
            )
    
    def test_railway_environment(self) -> RailwayTestResult:
        """Test Railway environment and connectivity"""
        self.logger.info("🔍 Testing Railway environment...")
        start_time = time.time()
        
        try:
            # Test Railway CLI
            cli_result = subprocess.run(['railway', '--version'], 
                                      capture_output=True, text=True, timeout=10)
            
            # Test Railway status
            status_result = subprocess.run(['railway', 'status'], 
                                         capture_output=True, text=True, timeout=10)
            
            # Test Railway service info
            service_info = self.get_railway_service_info()
            
            response_time = time.time() - start_time
            
            return RailwayTestResult(
                test_name="Railway Environment Test",
                success=status_result.returncode == 0,
                response_time=response_time,
                metrics={
                    "cli_version": cli_result.stdout.strip() if cli_result.returncode == 0 else "Unknown",
                    "status_output": status_result.stdout,
                    "status_error": status_result.stderr,
                    "service_info": service_info,
                    "authenticated": status_result.returncode == 0
                }
            )
            
        except Exception as e:
            response_time = time.time() - start_time
            return RailwayTestResult(
                test_name="Railway Environment Test",
                success=False,
                response_time=response_time,
                error_message=str(e)
            )
    
    def generate_railway_report(self, results: List[RailwayTestResult]) -> Dict[str, Any]:
        """Generate comprehensive Railway test report"""
        successful_tests = [r for r in results if r.success]
        failed_tests = [r for r in results if not r.success]
        
        report = {
            "railway_test_summary": {
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
            "railway_readiness": {
                "environment_accessible": any(r.test_name == "Railway Environment Test" and r.success for r in results),
                "http_testing_viable": any(r.test_name == "Railway HTTP Test" and r.success for r in results),
                "authentication_working": any(r.test_name == "Railway Environment Test" and r.metrics and r.metrics.get("authenticated") for r in results)
            }
        }
        
        return report
    
    def save_railway_results(self, results: List[RailwayTestResult], filename: str = None):
        """Save Railway test results to JSON file"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"railway_http_test_results_{timestamp}.json"
        
        report = self.generate_railway_report(results)
        
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)
        
        self.logger.info(f"📄 Railway test results saved to {filename}")
        return filename

def main():
    """Main function for running Railway HTTP tests"""
    print("🚂 Railway HTTP Scraper Diagnostic Suite")
    print("=" * 50)
    
    diagnostic = RailwayHTTPDiagnostic()
    
    print("\n🔄 Running Railway diagnostic tests...")
    
    # Test Railway environment first
    env_result = diagnostic.test_railway_environment()
    
    if not env_result.success:
        print(f"\n❌ Railway Environment Test Failed:")
        print(f"   Error: {env_result.error_message}")
        print(f"\n🔧 Please ensure:")
        print(f"   1. Railway CLI is installed: railway --version")
        print(f"   2. You're authenticated: railway login")
        print(f"   3. You're in the correct project directory")
        return
    
    print(f"\n✅ Railway Environment Test Passed:")
    print(f"   CLI Version: {env_result.metrics.get('cli_version', 'Unknown')}")
    print(f"   Authenticated: {env_result.metrics.get('authenticated', False)}")
    
    # Run HTTP test on Railway
    http_result = diagnostic.run_railway_test()
    
    results = [env_result, http_result]
    
    # Display results
    print(f"\n📊 Railway Test Results:")
    print("=" * 30)
    
    for result in results:
        status = "✅" if result.success else "❌"
        print(f"{status} {result.test_name}: {result.response_time:.2f}s")
        
        if result.error_message:
            print(f"   Error: {result.error_message}")
        
        if result.metrics and result.test_name == "Railway HTTP Test":
            test_results = result.metrics.get("test_results", {})
            if isinstance(test_results, dict) and "test_results" in test_results:
                print(f"   HTTP Test Results:")
                for test in test_results["test_results"]:
                    center_status = "✅" if test.get("success") else "❌"
                    print(f"     {center_status} {test.get('center', 'Unknown')}: {test.get('incident_count', 0)} incidents")
    
    # Generate and save report
    report = diagnostic.generate_railway_report(results)
    filename = diagnostic.save_railway_results(results)
    
    print(f"\n📄 Detailed Railway test results saved to: {filename}")
    
    # Railway readiness assessment
    readiness = report["railway_readiness"]
    print(f"\n🚂 Railway Readiness Assessment:")
    print(f"   Environment Accessible: {'✅ YES' if readiness['environment_accessible'] else '❌ NO'}")
    print(f"   HTTP Testing Viable: {'✅ YES' if readiness['http_testing_viable'] else '❌ NO'}")
    print(f"   Authentication Working: {'✅ YES' if readiness['authentication_working'] else '❌ NO'}")
    
    if readiness['http_testing_viable']:
        print(f"\n🎯 RECOMMENDATION: Railway HTTP testing is ready!")
        print(f"   - Proceed with HTTP-based scraper deployment")
        print(f"   - Railway environment supports HTTP requests")
    else:
        print(f"\n⚠️  RECOMMENDATION: Railway HTTP testing needs attention")
        print(f"   - Check Railway authentication and connectivity")
        print(f"   - Verify Railway service is running")

if __name__ == "__main__":
    main()
