#!/usr/bin/env python3
"""
Test script to demonstrate the diff functionality with a shorter run
"""
import time
import csv
import logging
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

CHROMEDRIVER_PATH = "/Users/jace/Desktop/nick traffic/chromedriver-mac-arm64/chromedriver"
URL = "https://cad.chp.ca.gov/Traffic.aspx"

# Global variable to store previous incidents for comparison
previous_incidents = None

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
        rows = table.find_elements(By.TAG_NAME, "tr")
        
        incidents_data = []
        
        for i, row in enumerate(rows):
            cells = row.find_elements(By.TAG_NAME, "td")
            if not cells:
                # Try th elements for headers
                cells = row.find_elements(By.TAG_NAME, "th")
            
            if cells and i > 0:  # Skip header row
                cell_texts = [cell.text.strip() for cell in cells]
                if len(cell_texts) >= 7:  # Ensure we have all columns
                    incidents_data.append(cell_texts)
        
        return incidents_data
    except Exception as e:
        print(f"Error extracting incidents: {str(e)}")
        return []

def scrape_once():
    """Perform a single scrape"""
    driver = None
    try:
        print("Using Chrome WebDriver...")
        driver = webdriver.Chrome(service=Service(CHROMEDRIVER_PATH))
        driver.get(URL)

        # Wait for and select the Communications Center dropdown
        wait = WebDriverWait(driver, 10)
        center_dropdown = wait.until(EC.presence_of_element_located((By.ID, "ddlComCenter")))
        select = Select(center_dropdown)
        select.select_by_value("BCCC")  # "Border"

        # Click the OK button
        ok_button = driver.find_element(By.ID, "btnCCGo")
        ok_button.click()

        # Wait for page update
        time.sleep(5)

        # Extract incident data
        incidents_data = extract_incidents_from_table(driver)
        
        if incidents_data:
            # Compare with previous incidents
            global previous_incidents
            changes = compare_incidents(previous_incidents, incidents_data)
            
            # Print status and changes
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
                else:
                    print("✅ No changes detected - same incidents as previous scrape")
            
            # Update previous incidents for next comparison
            previous_incidents = incidents_data.copy()
        else:
            print(f"\n🕐 [{datetime.now().strftime('%H:%M:%S')}] No incidents found for Border center.")
        
    except Exception as e:
        print("ERROR:", e)
    finally:
        if driver is not None:
            driver.quit()

if __name__ == "__main__":
    print("🚨 CHP Border Traffic Monitor - Diff Test")
    print("📊 Running 3 scrapes to demonstrate diff functionality...")
    print("=" * 60)
    
    for i in range(3):
        print(f"\n--- Scraping iteration {i+1}/3 ---")
        scrape_once()
        
        if i < 2:  # Don't sleep after the last iteration
            print(f"⏰ Waiting 10 seconds until next scrape...")
            time.sleep(10)
    
    print("\n" + "=" * 60)
    print("🏁 Diff test finished!")
