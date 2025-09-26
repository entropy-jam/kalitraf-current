#!/usr/bin/env python3
"""
Web Scraper Implementation
Single Responsibility: Handles browser navigation and scraping
"""

import time
import logging
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from typing import List

class WebScraper:
    """Handles browser navigation and basic scraping operations"""
    
    def __init__(self, driver, center_code="BCCC"):
        self.driver = driver
        self.center_code = center_code
        self.url = "https://cad.chp.ca.gov/Traffic.aspx"
    
    def navigate_to_page(self):
        """Navigate to the CHP traffic page"""
        try:
            self.driver.get(self.url)
            logging.info("Page loaded")
            return True
        except Exception as e:
            logging.error(f"Error navigating to page: {e}")
            return False
    
    def select_communication_center(self):
        """Select the communication center"""
        try:
            wait = WebDriverWait(self.driver, 10)
            center_dropdown = wait.until(EC.presence_of_element_located((By.ID, "ddlComCenter")))
            select = Select(center_dropdown)
            select.select_by_value(self.center_code)
            
            center_name = self._get_center_name(self.center_code)
            logging.info(f"Selected '{center_name}' communications center ({self.center_code})")
            
            # Click OK button
            ok_button = self.driver.find_element(By.ID, "btnCCGo")
            ok_button.click()
            logging.info("Clicked OK button")
            
            # Wait for page update
            time.sleep(2)
            return True
        except Exception as e:
            logging.error(f"Error selecting communication center: {e}")
            return False
    
    def extract_table_data(self) -> List[List[str]]:
        """Extract data from incidents table"""
        try:
            # Find the incidents table
            table = self.driver.find_element(By.TAG_NAME, "table")
            logging.info(f"Found table with class: {table.get_attribute('class')}")
            
            rows = table.find_elements(By.TAG_NAME, "tr")
            logging.info(f"Found {len(rows)} rows in table")
            
            incidents_data = []
            
            for i, row in enumerate(rows):
                cells = row.find_elements(By.TAG_NAME, "td")
                if not cells:
                    # Try th elements for headers
                    cells = row.find_elements(By.TAG_NAME, "th")
                
                if cells and i > 0:  # Skip header row
                    cell_texts = [cell.text.strip() for cell in cells]
                    logging.info(f"Row {i}: {len(cell_texts)} cells - {cell_texts[:3]}...")
                    
                    if len(cell_texts) >= 7:  # Ensure we have all columns
                        incidents_data.append(cell_texts)
            
            return incidents_data
            
        except Exception as e:
            logging.error(f"Error extracting from table: {str(e)}")
            return []
    
    def _get_center_name(self, center_code: str) -> str:
        """Get human-readable center name"""
        centers = {
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
        }
        return centers.get(center_code, center_code)
