
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
    print("\n🔄 Testing asynchronous HTTP requests from Railway...")
    
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
    
    print("\n📄 Test results saved to /tmp/railway_http_test_results.json")
    return results

if __name__ == "__main__":
    results = asyncio.run(test_http_from_railway())
    print("\n🎯 Railway HTTP Test Complete!")
