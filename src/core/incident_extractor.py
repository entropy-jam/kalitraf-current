#!/usr/bin/env python3
"""
Enhanced Incident Extractor with Smart Details Processing
Implements new-incidents-only + category filtering + lane blockage parsing
"""
import time
import logging
import re
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from typing import List, Dict, Optional

class IncidentExtractor:
    """Enhanced incident extractor with smart details processing"""
    
    # Relevant incident categories (mapped from plain English to actual CHP types)
    RELEVANT_CATEGORIES = [
        'Trfc Collision',  # All traffic collision variants
        'Traffic Hazard',  # Traffic hazards
        'Car Fire',        # Car/vehicle fires
        'Vehicle Fire',    # Alternative fire naming
        'Traffic Break',   # Traffic breaks/road blocks
        'Road Blocked',    # Alternative road block naming
        'Fatality',        # Fatalities
        'Hit and Run',     # Hit and runs
        'Hit & Run',       # Alternative hit and run naming
        'SIG Alert',       # SIG alerts
        'Sig Alert',       # Alternative SIG alert naming
        'Report of Fire'   # Fire reports
    ]
    
    # Categories to ignore (mapped from plain English to actual CHP types)
    IGNORE_CATEGORIES = [
        'Traffic Advisory',    # Traffic advisories
        'Advisory',           # Alternative advisory naming
        'Road Condition',     # Road conditions
        'Weather',            # Weather conditions
        'Assist CalTrans',    # CalTrans assistance
        'CalTrans'            # Alternative CalTrans naming
    ]
    
    # Lane blockage keywords
    LANE_BLOCKAGE_KEYWORDS = [
        'BLKG', 'BLOCKING', '#1 LN', 'SLOW LN', 'MIDDLE LN', 
        'RHS', 'RS', 'CD', 'LANE', 'LN', 'VEH IN', 'DEBRIS'
    ]
    
    # Resolved status keywords
    RESOLVED_KEYWORDS = ['NEG BLOCKING', 'NEG BLK', 'CLEARED', 'RESOLVED']
    
    # Highway indicators (based on actual CHP location patterns)
    HIGHWAY_INDICATORS = [
        'I-', 'I5', 'I8', 'I10', 'I15', 'I40', 'I80', 'I805', 'I215',  # Interstates
        'SR-', 'Sr', 'STATE ROUTE', 'STATE RT',  # State routes
        'US-', 'US ', 'US HIGHWAY',  # US highways
        'HWY', 'HIGHWAY', 'FREEWAY', 'INTERSTATE',  # General highway terms
        'CON', 'CONNECTOR', 'CONN'  # Connectors (like I805 N Con)
    ]
    
    def __init__(self, driver, center_code="BCCC", previous_incidents=None):
        self.driver = driver
        self.center_code = center_code
        self.url = "https://cad.chp.ca.gov/Traffic.aspx"
        self.previous_incidents = previous_incidents or []
        self.previous_ids = {inc.get('id', '') for inc in self.previous_incidents}
    
    def extract_incidents(self) -> List[Dict]:
        """Extract incidents with smart details processing"""
        try:
            # Navigate to page
            self.driver.get(self.url)
            logging.info("Page loaded")
            
            # Select communication center
            self._select_communication_center()
            
            # Wait for page update
            time.sleep(2)
            
            # Extract basic incident data
            incidents_data = self._extract_from_table()
            
            # Convert to structured format
            structured_incidents = self._convert_to_structured_format(incidents_data)
            
            # Apply smart filtering and details extraction
            enhanced_incidents = self._apply_smart_processing(structured_incidents)
            
            logging.info(f"Extracted {len(enhanced_incidents)} incidents with smart processing")
            return enhanced_incidents
            
        except Exception as e:
            logging.error(f"Error extracting incidents: {str(e)}")
            return []
    
    def _select_communication_center(self):
        """Select the communication center"""
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
    
    def _extract_from_table(self) -> List[List[str]]:
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
    
    def _convert_to_structured_format(self, incidents_data: List[List[str]]) -> List[Dict]:
        """Convert raw table data to structured format"""
        structured = []
        
        for row in incidents_data:
            if len(row) >= 7:
                incident = {
                    'id': row[1],
                    'time': row[2],
                    'type': row[3],
                    'location': row[4],
                    'location_desc': row[5],
                    'area': row[6],
                    'details': '',
                    'lane_blockage': {'status': 'unknown', 'details': []},
                    'is_new': False,
                    'is_relevant': False
                }
                structured.append(incident)
        
        return structured
    
    def _apply_smart_processing(self, incidents: List[Dict]) -> List[Dict]:
        """Apply smart filtering and details extraction"""
        processed_incidents = []
        details_extraction_count = 0
        
        for incident in incidents:
            # Check if incident is new
            incident['is_new'] = incident['id'] not in self.previous_ids
            
            # Check if incident is relevant
            incident['is_relevant'] = self._is_relevant_incident(incident)
            
            # Only extract details for new AND relevant incidents
            if incident['is_new'] and incident['is_relevant']:
                logging.info(f"Extracting details for new relevant incident: {incident['id']}")
                incident['details'] = self._extract_incident_details(incident)
                incident['lane_blockage'] = self._parse_lane_blockage(incident['details'])
                details_extraction_count += 1
            else:
                # For existing incidents, try to get cached details
                incident['details'] = self._get_cached_details(incident['id'])
                incident['lane_blockage'] = self._get_cached_lane_blockage(incident['id'])
            
            processed_incidents.append(incident)
        
        logging.info(f"Details extracted for {details_extraction_count} new relevant incidents")
        return processed_incidents
    
    def _is_relevant_incident(self, incident: Dict) -> bool:
        """Check if incident is relevant based on category and location"""
        incident_type = incident['type']
        location = incident['location']
        location_desc = incident.get('location_desc', '')
        
        # Check if it's a relevant category
        if not any(cat in incident_type for cat in self.RELEVANT_CATEGORIES):
            return False
        
        # Check if it's on a highway/interstate/state route
        # Check both location and location_desc fields
        location_text = f"{location} {location_desc}".upper()
        if not any(indicator in location_text for indicator in self.HIGHWAY_INDICATORS):
            return False
        
        return True
    
    def _extract_incident_details(self, incident: Dict) -> str:
        """Extract details for a specific incident"""
        try:
            # Find the incidents table
            tables = self.driver.find_elements(By.TAG_NAME, "table")
            incidents_table = None
            
            for table in tables:
                if "Details" in table.text and "No." in table.text:
                    incidents_table = table
                    break
            
            if not incidents_table:
                return ""
            
            # Find the specific incident row
            rows = incidents_table.find_elements(By.TAG_NAME, "tr")
            target_row = None
            
            for row in rows[1:]:  # Skip header
                cells = row.find_elements(By.TAG_NAME, "td")
                if cells and len(cells) >= 7 and cells[1].text.strip() == incident['id']:
                    target_row = row
                    break
            
            if not target_row:
                return ""
            
            # Find and click the Details link
            details_link = None
            cells = target_row.find_elements(By.TAG_NAME, "td")
            for cell in cells:
                links = cell.find_elements(By.TAG_NAME, "a")
                for link in links:
                    if "Details" in link.text:
                        details_link = link
                        break
                if details_link:
                    break
            
            if not details_link:
                return ""
            
            # Click the Details link
            self.driver.execute_script("arguments[0].click();", details_link)
            time.sleep(2)  # Wait for details to load
            
            # Extract details from the Detail Information table
            details = self._extract_details_from_page()
            
            # Click Details link again to deselect
            try:
                self.driver.execute_script("arguments[0].click();", details_link)
                time.sleep(1)
            except:
                pass
            
            return details
            
        except Exception as e:
            logging.error(f"Error extracting details for incident {incident['id']}: {e}")
            return ""
    
    def _extract_details_from_page(self) -> str:
        """Extract details from the Detail Information table"""
        try:
            tables = self.driver.find_elements(By.TAG_NAME, "table")
            
            for table in tables:
                table_text = table.text.strip()
                if "Detail Information" in table_text:
                    rows = table.find_elements(By.TAG_NAME, "tr")
                    details = []
                    
                    for row in rows:
                        cells = row.find_elements(By.TAG_NAME, "td")
                        if cells and len(cells) >= 2:
                            time_cell = cells[0].text.strip()
                            desc_cell = cells[1].text.strip()
                            
                            if time_cell and desc_cell and time_cell != "Detail Information":
                                details.append(f"{time_cell}: {desc_cell}")
                    
                    if details:
                        return " | ".join(details)
            
            return ""
            
        except Exception as e:
            logging.error(f"Error extracting details from page: {e}")
            return ""
    
    def _parse_lane_blockage(self, details_text: str) -> Dict:
        """Parse lane blockage information from details"""
        if not details_text:
            return {'status': 'unknown', 'details': []}
        
        lines = details_text.split(' | ')
        blockage_info = []
        
        for line in lines:
            line_upper = line.upper()
            
            # Check for resolved status
            if any(resolved in line_upper for resolved in self.RESOLVED_KEYWORDS):
                return {'status': 'resolved', 'details': [line]}
            
            # Check for lane blockage keywords
            if any(keyword in line_upper for keyword in self.LANE_BLOCKAGE_KEYWORDS):
                blockage_info.append(line)
        
        if blockage_info:
            return {'status': 'blocking', 'details': blockage_info}
        else:
            return {'status': 'no_blockage', 'details': []}
    
    def _get_cached_details(self, incident_id: str) -> str:
        """Get cached details for existing incidents"""
        for incident in self.previous_incidents:
            if incident.get('id') == incident_id:
                return incident.get('details', '')
        return ""
    
    def _get_cached_lane_blockage(self, incident_id: str) -> Dict:
        """Get cached lane blockage for existing incidents"""
        for incident in self.previous_incidents:
            if incident.get('id') == incident_id:
                return incident.get('lane_blockage', {'status': 'unknown', 'details': []})
        return {'status': 'unknown', 'details': []}
