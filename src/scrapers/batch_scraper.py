#!/usr/bin/env python3
"""
Batch CHP Traffic Scraper
Runs once for data collection and persistence (no continuous monitoring)
"""
import os
import logging
import sys

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from core.data_manager import DataManager
from core.email_notifier import EmailNotifier
from scrapers.http_scraper import HTTPScraper
# WebSocket publishing now handled by Railway continuous scraper

def setup_logging():
    """Setup logging for automated runs"""
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
    """Perform a single scrape with data persistence using HTTP requests"""
    data_manager = DataManager(center_code)
    http_scraper = HTTPScraper(mode="railway")
    
    try:
        # Load previous incidents for smart processing
        previous_incidents = data_manager.load_previous_incidents()
        print(f"📊 Loaded {len(previous_incidents)} previous incidents for {center_code}")
        
        # Extract incidents using HTTP scraper
        result = http_scraper.scrape_center_sync(center_code, previous_incidents)
        
        if result['status'] == 'success' and result['incidents']:
            incidents_data = result['incidents']
            # Compare with previous incidents
            changes = data_manager.compare_incidents(incidents_data)
            
            # Check if there are actual changes
            has_changes = (len(changes.get('new_incidents', [])) > 0 or 
                          len(changes.get('removed_incidents', [])) > 0)
            
            # Save active incidents only if changed
            file_updated = data_manager.save_active_incidents(incidents_data)
            
            # Save delta updates if there are changes
            delta_saved = data_manager.save_delta_updates(changes)
            
            # Always append to daily file (for historical tracking)
            data_manager.append_daily_incidents(incidents_data)
            
            if file_updated:
                print(f"✅ Updated active incidents: {len(incidents_data)} incidents")
                logging.info(f"Found {len(incidents_data)} incidents - updated active_incidents.json")
            else:
                print("ℹ️ No changes detected - skipped file updates")
                logging.info("No changes detected - skipped file updates")
            
            # Send email alert if there are changes
            if has_changes:
                print("📧 Sending email alert for changes...")
                center_name = data_manager._get_center_name(center_code)
                send_email_alert(changes, center_code, center_name)
            
            # Note: WebSocket publishing is handled by Railway continuous scraper
            if file_updated or has_changes:
                print("📡 Data saved for Railway WebSocket server")
            
            # Update previous incidents for next comparison
            data_manager.update_previous_incidents(incidents_data)
            
            return file_updated  # Return whether files were updated
        else:
            print("⚠️ No incidents found or extracted.")
            logging.warning("No incidents found or extracted.")
        
        return incidents_data

def main():
    """Main function for batch scraper"""
    setup_logging()
    
    # Get center from environment variable
    center_code = os.getenv('COMMUNICATION_CENTER', 'BCCC')
    center_name = {
        "BFCC": "Bakersfield",
        "BSCC": "Barstow", 
        "BICC": "Bishop",
        "BCCC": "Border",
        "CCCC": "Capitol",
        "CHCC": "Chico",
        "ECCC": "El Centro",
        "FRCC": "Fresno",
        "GGCC": "Golden Gate",
        "HMCC": "Humboldt",
        "ICCC": "Indio",
        "INCC": "Inland",
        "LACC": "Los Angeles",
        "MRCC": "Merced",
        "MYCC": "Monterey",
        "OCCC": "Orange",
        "RDCC": "Redding",
        "SACC": "Sacramento",
        "SLCC": "San Luis Obispo",
        "SKCCSTCC": "Stockton",
        "SUCC": "Susanville",
        "TKCC": "Truckee",
        "UKCC": "Ukiah",
        "VTCC": "Ventura",
        "YKCC": "Yreka"
    }.get(center_code, center_code)
    
    print(f"🚨 CHP {center_name} Traffic Monitor (Batch Scraper)")
    print(f"📊 Scraping {center_code} center...")
    print("=" * 60)
    
    try:
        file_updated = scrape_incidents(center_code)
        if file_updated:
            print(f"✅ Scraping complete. Files updated.")
        else:
            print(f"ℹ️ Scraping complete. No changes detected.")
        return file_updated
    except Exception as e:
        logging.error(f"Error during scraping for {center_name} ({center_code}): {str(e)}")
        print(f"❌ Scraping failed for {center_name} ({center_code}): {str(e)}")
        return False

if __name__ == "__main__":
    main()
