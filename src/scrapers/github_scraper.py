#!/usr/bin/env python3
"""
GitHub Actions CHP Traffic Scraper
Optimized for automated runs with email notifications
"""
import os
import logging
import sys

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from core.webdriver_manager import WebDriverManager
from core.incident_extractor import IncidentExtractor
from core.data_manager import DataManager
from core.email_notifier import EmailNotifier

def setup_logging():
    """Setup logging for GitHub Actions"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )

def send_email_alert(changes, center_code, center_name):
    """Send email alert for incident changes"""
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
        notifier = EmailNotifier()
        
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

def scrape_incidents(center_code="BCCC"):
    """Perform a single scrape for GitHub Actions"""
    webdriver_manager = WebDriverManager(mode="github_actions")
    data_manager = DataManager(center_code)
    
    try:
        driver = webdriver_manager.get_driver()
        extractor = IncidentExtractor(driver, center_code)
        
        # Extract incidents
        incidents_data = extractor.extract_incidents()
        
        if incidents_data:
            # Compare with previous incidents
            changes = data_manager.compare_incidents(incidents_data)
            
            # Save JSON files
            data_manager.save_active_incidents(incidents_data)
            data_manager.append_daily_incidents(incidents_data)
            print(f"✅ Saved {len(incidents_data)} incidents to JSON files")
            logging.info(f"Found {len(incidents_data)} incidents - saved to JSON files")
            
            # Send email alert if there are changes
            if changes and (len(changes.get('new_incidents', [])) > 0 or len(changes.get('removed_incidents', [])) > 0):
                print("📧 Sending email alert for changes...")
                center_name = data_manager._get_center_name(center_code)
                send_email_alert(changes, center_code, center_name)
            
            # Update previous incidents for next comparison
            data_manager.update_previous_incidents(incidents_data)
        else:
            print("⚠️ No incidents found or extracted.")
            logging.warning("No incidents found or extracted.")
        
        return incidents_data
        
    finally:
        webdriver_manager.close()

def main():
    """Main function for GitHub Actions scraper"""
    setup_logging()
    
    # Get center from environment variable
    center_code = os.getenv('COMMUNICATION_CENTER', 'BCCC')
    center_name = {
        "BCCC": "Border",
        "CCC": "Central", 
        "NCCC": "Northern",
        "SCCC": "Southern"
    }.get(center_code, center_code)
    
    print(f"🚨 CHP {center_name} Traffic Monitor (GitHub Actions)")
    print(f"📊 Scraping {center_code} center...")
    print("=" * 60)
    
    try:
        incidents_data = scrape_incidents(center_code)
        print(f"✅ Scraping complete. Found {len(incidents_data)} incidents.")
        return incidents_data
    except Exception as e:
        logging.error(f"Error during scraping for {center_name} ({center_code}): {str(e)}")
        print(f"❌ Scraping failed for {center_name} ({center_code}): {str(e)}")
        return []

if __name__ == "__main__":
    main()
