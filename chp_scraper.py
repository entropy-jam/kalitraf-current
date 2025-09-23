import time
import json
import os
import argparse
import logging
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# Import email notifier
try:
    from simple_email import SimpleEmailNotifier
    EMAIL_AVAILABLE = True
except ImportError:
    EMAIL_AVAILABLE = False
    print("Email notifications not available - simple_email module not found")

# Option 1: Safari WebDriver (macOS built-in)
# Option 2: Chrome WebDriver with proper ARM64 driver
CHROMEDRIVER_PATH = "/Users/jace/Desktop/nick traffic/chromedriver-mac-arm64/chromedriver"  # Correct ARM64 driver
USE_SAFARI = False  # Set to True to use Safari (requires Safari setup), False for Chrome

logging.basicConfig(filename='chp_scraper_debug.log', 
                    level=logging.INFO, 
                    format='%(asctime)s | %(levelname)s | %(message)s')

URL = "https://cad.chp.ca.gov/Traffic.aspx"

# Global variable to store previous incidents for comparison
previous_incidents = None

# Configuration
COMMUNICATION_CENTERS = {
    'BCCC': 'Border',
    'CCC': 'Central', 
    'NCCC': 'Northern',
    'SCCC': 'Southern'
}

def compare_incidents(old_incidents, new_incidents):
    """Compare two sets of incidents and return differences"""
    if old_incidents is None:
        return {"new_incidents": new_incidents, "removed_incidents": [], "changed_incidents": []}
    
    # Convert to sets of tuples for comparison (excluding Details column which is always "Details")
    old_set = set(tuple(row[1:]) for row in old_incidents)  # Skip Details column
    new_set = set(tuple(row[1:]) for row in new_incidents)
    
    # Find differences
    new_incidents_list = [row for row in new_incidents if tuple(row[1:]) in new_set - old_set]
    removed_incidents_list = [row for row in old_incidents if tuple(row[1:]) in old_set - new_set]
    
    return {
        "new_incidents": new_incidents_list,
        "removed_incidents": removed_incidents_list,
        "changed_incidents": []  # For now, we'll treat all changes as new/removed
    }

def print_incident_summary(incidents, title):
    """Print a summary of incidents"""
    if not incidents:
        return
    
    print(f"\n📋 {title}:")
    for incident in incidents:
        if len(incident) >= 7:
            print(f"   • #{incident[1]} | {incident[2]} | {incident[3]} | {incident[4]} | {incident[6]}")

def extract_incidents_from_table(driver):
    """Extract incident data from the incidents table"""
    try:
        # Find the incidents table
        table = driver.find_element(By.TAG_NAME, "table")
        print(f"Found table with class: {table.get_attribute('class')}")
        rows = table.find_elements(By.TAG_NAME, "tr")
        print(f"Found {len(rows)} rows in table")
        
        incidents_data = []
        
        for i, row in enumerate(rows):
            cells = row.find_elements(By.TAG_NAME, "td")
            if not cells:
                # Try th elements for headers
                cells = row.find_elements(By.TAG_NAME, "th")
            
            if cells and i > 0:  # Skip header row
                cell_texts = [cell.text.strip() for cell in cells]
                print(f"Row {i}: {len(cell_texts)} cells - {cell_texts[:3]}...")  # Show first 3 cells
                if len(cell_texts) >= 7:  # Ensure we have all columns
                    incidents_data.append(cell_texts)
        
        print(f"Extracted {len(incidents_data)} incidents")
        return incidents_data
    except Exception as e:
        logging.error(f"Error extracting incidents: {str(e)}")
        return []


def incidents_to_json(incidents_data, center_code):
    """Convert incidents data to JSON format"""
    incidents = []
    for row in incidents_data:
        if len(row) >= 7:
            incident = {
                "id": row[1],  # No.
                "time": row[2],  # Time
                "type": row[3],  # Type
                "location": row[4],  # Location
                "location_desc": row[5],  # Location Desc.
                "area": row[6],  # Area
                "scraped_at": datetime.now().isoformat(),
                "center": center_code
            }
            incidents.append(incident)
    return incidents

def save_active_incidents(incidents_data, center_code):
    """Save active incidents as JSON (overwrites every time)"""
    try:
        os.makedirs('data', exist_ok=True)
        
        incidents = incidents_to_json(incidents_data, center_code)
        active_data = {
            "center": center_code,
            "center_name": COMMUNICATION_CENTERS.get(center_code, center_code),
            "last_updated": datetime.now().isoformat(),
            "incident_count": len(incidents),
            "incidents": incidents
        }
        
        with open('active_incidents.json', 'w', encoding='utf-8') as f:
            json.dump(active_data, f, indent=2, ensure_ascii=False)
        
        logging.info(f"Saved {len(incidents)} active incidents to active_incidents.json")
    except Exception as e:
        logging.error(f"Error saving active incidents: {str(e)}")

def send_email_alert(changes, center_code, center_name):
    """Send email alert for incident changes"""
    if not EMAIL_AVAILABLE:
        logging.info("Email notifications not available - skipping email alert")
        return False
    
    try:
        # Check if email notifications are enabled
        if not os.getenv('ENABLE_EMAIL_NOTIFICATIONS', 'false').lower() == 'true':
            logging.info("Email notifications disabled - skipping email alert")
            return False
        
        # Check if there are actual changes
        has_changes = (len(changes.get('new_incidents', [])) > 0 or 
                      len(changes.get('removed_incidents', [])) > 0)
        
        if not has_changes:
            logging.info("No changes detected - skipping email alert")
            return False
        
        # Initialize email notifier
        notifier = SimpleEmailNotifier()
        
        # Send alert
        success = notifier.send_incident_alert(changes, center_name, center_code)
        
        if success:
            logging.info(f"Email alert sent successfully for {center_name} center")
        else:
            logging.error("Failed to send email alert")
        
        return success
        
    except Exception as e:
        logging.error(f"Error sending email alert: {str(e)}")
        return False

def append_daily_incidents(incidents_data, center_code):
    """Append unique incidents to daily JSON file"""
    try:
        os.makedirs('data', exist_ok=True)
        
        today = datetime.now().strftime('%Y-%m-%d')
        daily_filename = f"data/{today}_incidents.json"
        
        # Load existing daily incidents
        existing_incidents = []
        if os.path.exists(daily_filename):
            with open(daily_filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
                existing_incidents = data.get('incidents', [])
        
        # Get existing incident IDs
        existing_ids = {incident['id'] for incident in existing_incidents}
        
        # Convert new incidents to JSON
        new_incidents = incidents_to_json(incidents_data, center_code)
        
        # Filter out duplicates
        unique_new_incidents = [
            incident for incident in new_incidents 
            if incident['id'] not in existing_ids
        ]
        
        # Combine with existing incidents
        all_incidents = existing_incidents + unique_new_incidents
        
        # Save updated daily file
        daily_data = {
            "center": center_code,
            "center_name": COMMUNICATION_CENTERS.get(center_code, center_code),
            "date": today,
            "last_updated": datetime.now().isoformat(),
            "total_incidents": len(all_incidents),
            "new_incidents_today": len(unique_new_incidents),
            "incidents": all_incidents
        }
        
        with open(daily_filename, 'w', encoding='utf-8') as f:
            json.dump(daily_data, f, indent=2, ensure_ascii=False)
        
        logging.info(f"Appended {len(unique_new_incidents)} new incidents to {daily_filename}")
    except Exception as e:
        logging.error(f"Error appending daily incidents: {str(e)}")

def scrape_chp_incidents(center_code="BCCC", mode="local"):
    """Scrape CHP incidents for specified communication center"""
    driver = None
    try:
        center_name = COMMUNICATION_CENTERS.get(center_code, center_code)
        
        # Option 1: Use Safari (macOS built-in)
        if USE_SAFARI and mode == "local":
            print("Using Safari WebDriver...")
            driver = webdriver.Safari()
            logging.info("Safari WebDriver initialized")
        else:
            # Option 2: Use Chrome with proper ARM64 driver
            print("Using Chrome WebDriver...")
            # Use Chrome with appropriate options for the environment
            options = webdriver.ChromeOptions()
            
            if mode == "github_actions":
                # GitHub Actions: optimized headless mode for speed
                options.add_argument("--headless")
                options.add_argument("--no-sandbox")
                options.add_argument("--disable-dev-shm-usage")
                options.add_argument("--disable-gpu")
                options.add_argument("--disable-web-security")
                options.add_argument("--disable-features=VizDisplayCompositor")
                options.add_argument("--disable-extensions")
                options.add_argument("--disable-plugins")
                options.add_argument("--disable-images")
                options.add_argument("--remote-debugging-port=9222")
                driver = webdriver.Chrome(options=options)
                logging.info("Chrome WebDriver initialized (GitHub Actions)")
            else:
                # Local: try webdriver-manager first, fallback to local
                try:
                    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
                    logging.info("Chrome WebDriver initialized with webdriver-manager")
                except Exception as e:
                    print(f"Webdriver-manager failed: {e}")
                    print("Falling back to local chromedriver...")
                    driver = webdriver.Chrome(service=Service(CHROMEDRIVER_PATH))
                    logging.info("Chrome WebDriver initialized with local driver")
        
        print("Webdriver loaded.")
        driver.get(URL)
        print("Page loaded.")

        # Wait for and select the Communications Center dropdown
        wait = WebDriverWait(driver, 10)
        center_dropdown = wait.until(EC.presence_of_element_located((By.ID, "ddlComCenter")))
        select = Select(center_dropdown)
        select.select_by_value(center_code)

        print(f"Selected '{center_name}' communications center ({center_code}).")
        
        # Click the OK button to submit the new selection
        ok_button = driver.find_element(By.ID, "btnCCGo")
        ok_button.click()
        print("Clicked OK button.")

        # Wait for page update AFTER selection (reduced from 5s to 2s)
        time.sleep(2)

        # Debug: Check what's on the page
        print(f"Current URL: {driver.current_url}")
        print(f"Page title: {driver.title}")
        
        # Check for tables on the page
        tables = driver.find_elements(By.TAG_NAME, "table")
        print(f"Found {len(tables)} tables on page")
        
        page_source = driver.page_source

        # Extract incident data
        incidents_data = extract_incidents_from_table(driver)
        
        if incidents_data:
            # Compare with previous incidents (only in local mode)
            if mode == "local":
                global previous_incidents
                changes = compare_incidents(previous_incidents, incidents_data)
            
            # Save data based on mode
            if mode == "github_actions":
                # GitHub Actions mode: save JSON files and check for changes
                changes = compare_incidents(previous_incidents, incidents_data)
                
                save_active_incidents(incidents_data, center_code)
                append_daily_incidents(incidents_data, center_code)
                print(f"✅ Saved {len(incidents_data)} incidents to JSON files")
                logging.info(f"Found {len(incidents_data)} incidents - saved to JSON files")
                
                # Send email alert if there are changes
                if changes and (len(changes.get('new_incidents', [])) > 0 or len(changes.get('removed_incidents', [])) > 0):
                    print("📧 Sending email alert for changes...")
                    send_email_alert(changes, center_code, center_name)
                
                # Update previous incidents for next comparison
                previous_incidents = incidents_data.copy()
            else:
                # Local mode: show diff and save JSON
                print(f"\n🕐 [{datetime.now().strftime('%H:%M:%S')}] Scrape - {len(incidents_data)} incidents found")
                
                if previous_incidents is None:
                    print("📊 Initial scrape - all incidents are new:")
                    print_incident_summary(incidents_data, "All Incidents")
                else:
                    # Check if there are any changes
                    has_changes = (len(changes["new_incidents"]) > 0 or 
                                 len(changes["removed_incidents"]) > 0)
                    
                    if has_changes:
                        print("🔄 CHANGES DETECTED:")
                        print_incident_summary(changes["new_incidents"], "New Incidents")
                        print_incident_summary(changes["removed_incidents"], "Resolved Incidents")
                        
                        # Send email alert for changes
                        print("📧 Sending email alert for changes...")
                        send_email_alert(changes, center_code, center_name)
                    else:
                        print("✅ No changes detected - same incidents as previous scrape")
                
                # Save JSON files
                save_active_incidents(incidents_data, center_code)
                append_daily_incidents(incidents_data, center_code)
                print(f"✅ Saved {len(incidents_data)} incidents to JSON files")
                logging.info(f"Found {len(incidents_data)} incidents - saved to JSON files")
                
                # Update previous incidents for next comparison
                previous_incidents = incidents_data.copy()
        else:
            print(f"\n🕐 [{datetime.now().strftime('%H:%M:%S')}] No incidents found for {center_name} center.")
            logging.info(f"No incidents found for {center_name} center.")
        
        return incidents_data
        
    except Exception as e:
        print("ERROR:", e)
        logging.error(f"Error: {str(e)}")
        return []
    finally:
        if driver is not None:
            driver.quit()
            print("Webdriver closed.")

def main():
    parser = argparse.ArgumentParser(description='CHP Traffic Incident Scraper')
    parser.add_argument('--center', '-c', 
                       choices=['BCCC', 'CCC', 'NCCC', 'SCCC'],
                       default='BCCC',
                       help='Communication center to scrape (default: BCCC)')
    parser.add_argument('--mode', '-m',
                       choices=['local', 'github_actions'],
                       default='local',
                       help='Run mode (default: local)')
    parser.add_argument('--iterations', '-i',
                       type=int,
                       default=10,
                       help='Number of iterations to run (default: 10)')
    parser.add_argument('--interval', '-t',
                       type=int,
                       default=60,
                       help='Interval between scrapes in seconds (default: 60)')
    
    args = parser.parse_args()
    
    center_name = COMMUNICATION_CENTERS.get(args.center, args.center)
    
    if args.mode == "github_actions":
        print(f"🚨 CHP {center_name} Traffic Monitor (GitHub Actions)")
        print(f"📊 Scraping {args.center} center...")
        print("=" * 60)
        
        # Single scrape for GitHub Actions
        incidents = scrape_chp_incidents(args.center, args.mode)
        print(f"✅ Scraping complete. Found {len(incidents)} incidents.")
    else:
        print(f"🚨 CHP {center_name} Traffic Monitor (Local)")
        print(f"📊 Monitoring {args.center} center every {args.interval} seconds...")
        print("=" * 60)
        
        for i in range(args.iterations):
            print(f"\n--- Scraping iteration {i+1}/{args.iterations} ---")
            scrape_chp_incidents(args.center, args.mode)
            
            if i < args.iterations - 1:  # Don't sleep after the last iteration
                print(f"⏰ Waiting {args.interval} seconds until next scrape...")
                time.sleep(args.interval)
        
        print("\n" + "=" * 60)
        print("🏁 Test run finished. Check 'chp_scraper_debug.log' for detailed logs.")

if __name__ == "__main__":
    main()
