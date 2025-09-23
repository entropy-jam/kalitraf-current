#!/usr/bin/env python3
"""
Local CHP Traffic Scraper
Runs continuously with email notifications
"""
import argparse
import logging
import time
from datetime import datetime
import sys
import os

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from core.webdriver_manager import WebDriverManager
from core.incident_extractor import IncidentExtractor
from core.data_manager import DataManager
from core.email_notifier import EmailNotifier

def setup_logging():
    """Setup logging configuration"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('chp_scraper_debug.log'),
            logging.StreamHandler()
        ]
    )

def print_incident_summary(incidents, title):
    """Print formatted incident summary"""
    if not incidents:
        print(f"📋 {title}: None")
        return
    
    print(f"\n📋 {title}:")
    for incident in incidents:
        if len(incident) >= 7:
            print(f"   • #{incident[1]} | {incident[2]} | {incident[3]} | {incident[4]} | {incident[6]}")

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

def scrape_once(center_code="BCCC"):
    """Perform a single scrape"""
    webdriver_manager = WebDriverManager(mode="local")
    data_manager = DataManager(center_code)
    
    try:
        driver = webdriver_manager.get_driver()
        extractor = IncidentExtractor(driver, center_code)
        
        # Extract incidents
        incidents_data = extractor.extract_incidents()
        
        if incidents_data:
            # Compare with previous incidents
            changes = data_manager.compare_incidents(incidents_data)
            
            # Print status and changes
            print(f"\n🕐 [{datetime.now().strftime('%H:%M:%S')}] Scrape - {len(incidents_data)} incidents found")
            
            if data_manager.previous_incidents is None:
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
                    center_name = data_manager._get_center_name(center_code)
                    send_email_alert(changes, center_code, center_name)
                else:
                    print("✅ No changes detected - same incidents as previous scrape")
            
            # Save JSON files
            data_manager.save_active_incidents(incidents_data)
            data_manager.append_daily_incidents(incidents_data)
            print(f"✅ Saved {len(incidents_data)} incidents to JSON files")
            logging.info(f"Found {len(incidents_data)} incidents - saved to JSON files")
            
            # Update previous incidents for next comparison
            data_manager.update_previous_incidents(incidents_data)
        else:
            print(f"\n🕐 [{datetime.now().strftime('%H:%M:%S')}] No incidents found for {center_code} center.")
        
        return incidents_data
        
    finally:
        webdriver_manager.close()

def main():
    """Main function for local scraper"""
    parser = argparse.ArgumentParser(description='CHP Traffic Scraper (Local)')
    parser.add_argument('--center', default='BCCC', 
                       choices=['BCCC', 'CCC', 'NCCC', 'SCCC'],
                       help='Communication center to scrape')
    parser.add_argument('--interval', type=int, default=60,
                       help='Scraping interval in seconds')
    parser.add_argument('--iterations', type=int, default=10,
                       help='Number of scraping iterations')
    parser.add_argument('--once', action='store_true',
                       help='Run once and exit')
    
    args = parser.parse_args()
    
    setup_logging()
    
    center_name = {
        "BCCC": "Border",
        "CCC": "Central", 
        "NCCC": "Northern",
        "SCCC": "Southern"
    }.get(args.center, args.center)
    
    print(f"🚨 CHP {center_name} Traffic Monitor (Local)")
    print(f"📊 Monitoring {args.center} center every {args.interval} seconds...")
    print("=" * 60)
    
    if args.once:
        scrape_once(args.center)
        return
    
    # Continuous monitoring
    for i in range(args.iterations):
        print(f"\n--- Scraping iteration {i+1}/{args.iterations} ---")
        
        try:
            scrape_once(args.center)
        except Exception as e:
            logging.error(f"Error in scraping iteration {i+1}: {str(e)}")
            print(f"❌ Scraping failed: {str(e)}")
        
        if i < args.iterations - 1:  # Don't sleep after the last iteration
            print(f"⏰ Waiting {args.interval} seconds until next scrape...")
            time.sleep(args.interval)
    
    print("\n" + "=" * 60)
    print("🏁 Monitoring finished. Check 'chp_scraper_debug.log' for detailed logs.")

if __name__ == "__main__":
    main()
