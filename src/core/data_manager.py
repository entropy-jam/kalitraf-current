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
        self.active_file = "active_incidents.json"
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
    
    def save_active_incidents(self, incidents_data: List[List[str]]) -> None:
        """Save current incidents to active_incidents.json"""
        json_data = self.incidents_to_json(incidents_data)
        
        with open(self.active_file, 'w') as f:
            json.dump(json_data, f, indent=2)
        
        logging.info(f"Saved {len(incidents_data)} incidents to {self.active_file}")
    
    def append_daily_incidents(self, incidents_data: List[List[str]]) -> None:
        """Append unique incidents to daily JSON file"""
        today = datetime.now().strftime("%Y-%m-%d")
        daily_file = f"{self.data_dir}/{today}_incidents.json"
        
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
            "BCCC": "Border",
            "CCC": "Central", 
            "NCCC": "Northern",
            "SCCC": "Southern"
        }
        return centers.get(center_code, center_code)
