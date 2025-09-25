#!/usr/bin/env python3
"""
Data management for incidents (JSON storage, comparison, etc.)
"""
import json
import os
import logging
from datetime import datetime
from typing import List, Dict, Any

class DataManager:
    """Manages incident data storage and comparison"""
    
    def __init__(self, center_code="BCCC"):
        self.center_code = center_code
        self.data_dir = "data"
        self.active_file = f"{self.data_dir}/active_incidents_{center_code}.json"
        self.delta_file = f"{self.data_dir}/incident_deltas_{center_code}.json"
        self.previous_incidents = None
        
        # Ensure data directory exists
        os.makedirs(self.data_dir, exist_ok=True)
    
    def incidents_to_json(self, incidents_data: List[List[str]]) -> Dict[str, Any]:
        """Convert incidents data to JSON format"""
        incidents = []
        for row in incidents_data:
            if len(row) >= 7:
                incident = {
                    "id": row[1],
                    "time": row[2],
                    "type": row[3],
                    "location": row[4],
                    "location_desc": row[5] if len(row) > 5 else "",
                    "area": row[6] if len(row) > 6 else ""
                }
                incidents.append(incident)
        
        return {
            "center_code": self.center_code,
            "center_name": self._get_center_name(self.center_code),
            "incident_count": len(incidents),
            "incidents": incidents,
            "last_updated": datetime.now().isoformat()
        }
    
    def save_active_incidents(self, incidents_data: List[List[str]]) -> bool:
        """Save current incidents to active_incidents.json only if data changed"""
        json_data = self.incidents_to_json(incidents_data)
        
        # Check if file exists and compare with existing data
        if os.path.exists(self.active_file):
            try:
                with open(self.active_file, 'r') as f:
                    existing_data = json.load(f)
                
                # Only write if data is different
                if self._data_equals(existing_data, json_data):
                    logging.info("No changes detected - skipping active_incidents.json write")
                    return False
            except (json.JSONDecodeError, KeyError) as e:
                logging.warning(f"Error reading existing file, will overwrite: {e}")
        
        # Write only when different or file doesn't exist
        with open(self.active_file, 'w') as f:
            json.dump(json_data, f, indent=2)
        
        logging.info(f"Saved {len(incidents_data)} incidents to {self.active_file}")
        
        # Maintain backward compatibility: also save to active_incidents.json if this is BCCC
        if self.center_code == "BCCC":
            with open("active_incidents.json", 'w') as f:
                json.dump(json_data, f, indent=2)
            logging.info("Also saved to active_incidents.json for backward compatibility")
        
        return True
    
    def _data_equals(self, data1: Dict, data2: Dict) -> bool:
        """Compare two incident datasets for equality"""
        if not data1 or not data2:
            return False
        
        # Compare basic fields
        if (data1.get('incident_count') != data2.get('incident_count') or
            data1.get('center_code') != data2.get('center_code')):
            return False
        
        # Compare incidents
        incidents1 = data1.get('incidents', [])
        incidents2 = data2.get('incidents', [])
        
        if len(incidents1) != len(incidents2):
            return False
        
        # Create sets for comparison (using ID + time as unique identifier)
        set1 = {f"{inc['id']}_{inc['time']}" for inc in incidents1}
        set2 = {f"{inc['id']}_{inc['time']}" for inc in incidents2}
        
        return set1 == set2
    
    def save_delta_updates(self, changes: Dict[str, List]) -> bool:
        """Save only the changes (deltas) to a separate file"""
        if not changes or (not changes.get('new_incidents') and not changes.get('removed_incidents')):
            logging.info("No changes detected - skipping delta file write")
            return False
        
        # Convert raw incident data to JSON format for deltas
        new_incidents_json = []
        for incident in changes.get('new_incidents', []):
            if len(incident) >= 7:
                new_incidents_json.append({
                    "id": incident[1],
                    "time": incident[2],
                    "type": incident[3],
                    "location": incident[4],
                    "location_desc": incident[5] if len(incident) > 5 else "",
                    "area": incident[6] if len(incident) > 6 else ""
                })
        
        removed_incidents_json = []
        for incident in changes.get('removed_incidents', []):
            if len(incident) >= 7:
                removed_incidents_json.append({
                    "id": incident[1],
                    "time": incident[2],
                    "type": incident[3],
                    "location": incident[4],
                    "location_desc": incident[5] if len(incident) > 5 else "",
                    "area": incident[6] if len(incident) > 6 else ""
                })
        
        delta_data = {
            "center_code": self.center_code,
            "center_name": self._get_center_name(self.center_code),
            "timestamp": datetime.now().isoformat(),
            "new_incidents": new_incidents_json,
            "removed_incidents": removed_incidents_json,
            "new_count": len(new_incidents_json),
            "removed_count": len(removed_incidents_json)
        }
        
        with open(self.delta_file, 'w') as f:
            json.dump(delta_data, f, indent=2)
        
        logging.info(f"Saved delta updates: {len(new_incidents_json)} new, {len(removed_incidents_json)} removed")
        return True
    
    def append_daily_incidents(self, incidents_data: List[List[str]]) -> None:
        """Append unique incidents to daily JSON file"""
        today = datetime.now().strftime("%Y-%m-%d")
        daily_file = f"{self.data_dir}/{today}_incidents_{self.center_code}.json"
        
        # Load existing daily incidents
        existing_incidents = []
        if os.path.exists(daily_file):
            with open(daily_file, 'r') as f:
                existing_data = json.load(f)
                existing_incidents = existing_data.get('incidents', [])
        
        # Convert new incidents to JSON format
        new_json_data = self.incidents_to_json(incidents_data)
        new_incidents = new_json_data['incidents']
        
        # Find unique incidents (by ID)
        existing_ids = {incident['id'] for incident in existing_incidents}
        unique_incidents = [incident for incident in new_incidents 
                          if incident['id'] not in existing_ids]
        
        # Append unique incidents
        if unique_incidents:
            all_incidents = existing_incidents + unique_incidents
            daily_data = {
                "center_code": self.center_code,
                "center_name": self._get_center_name(self.center_code),
                "date": today,
                "total_incidents": len(all_incidents),
                "incidents": all_incidents,
                "last_updated": datetime.now().isoformat()
            }
            
            with open(daily_file, 'w') as f:
                json.dump(daily_data, f, indent=2)
            
            logging.info(f"Appended {len(unique_incidents)} unique incidents to {daily_file}")
    
    def compare_incidents(self, current_incidents: List[List[str]]) -> Dict[str, List]:
        """Compare current incidents with previous ones"""
        if self.previous_incidents is None:
            return {"new_incidents": current_incidents, "removed_incidents": []}
        
        # Convert to sets for comparison (using incident ID + time as unique identifier)
        current_set = {f"{incident[1]}_{incident[2]}" for incident in current_incidents}
        previous_set = {f"{incident[1]}_{incident[2]}" for incident in self.previous_incidents}
        
        # Find new and removed incidents
        new_ids = current_set - previous_set
        removed_ids = previous_set - current_set
        
        new_incidents = [incident for incident in current_incidents 
                        if f"{incident[1]}_{incident[2]}" in new_ids]
        removed_incidents = [incident for incident in self.previous_incidents 
                           if f"{incident[1]}_{incident[2]}" in removed_ids]
        
        return {
            "new_incidents": new_incidents,
            "removed_incidents": removed_incidents
        }
    
    def update_previous_incidents(self, incidents_data: List[List[str]]) -> None:
        """Update the previous incidents for next comparison"""
        self.previous_incidents = incidents_data.copy()
    
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
