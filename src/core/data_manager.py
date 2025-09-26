#!/usr/bin/env python3
"""
Data management for incidents (JSON storage, comparison, etc.)
Uses Interface Segregation Principle with focused interfaces
"""
import json
import os
import logging
from datetime import datetime
from typing import List, Dict, Any

from .interfaces import IDataSerializer, IFileManager, IDataComparator, ICenterMapper, IDeltaProcessor, ICacheManager
from .data_serializer import DataSerializer
from .file_manager import FileManager
from .data_comparator import DataComparator
from .center_mapper import CenterMapper

class DataManager(IDeltaProcessor, ICacheManager):
    """Manages incident data storage and comparison using focused interfaces"""
    
    def __init__(self, center_code="BCCC", 
                 serializer: IDataSerializer = None,
                 file_manager: IFileManager = None,
                 comparator: IDataComparator = None,
                 center_mapper: ICenterMapper = None):
        self.center_code = center_code
        self.data_dir = "data"
        self.active_file = f"{self.data_dir}/active_incidents_{center_code}.json"
        self.delta_file = f"{self.data_dir}/incident_deltas_{center_code}.json"
        self.previous_incidents = None
        
        # Use dependency injection with defaults
        self.serializer = serializer or DataSerializer()
        self.file_manager = file_manager or FileManager(self.data_dir)
        self.comparator = comparator or DataComparator()
        self.center_mapper = center_mapper or CenterMapper()
    
    def incidents_to_json(self, incidents_data: List[Dict]) -> Dict[str, Any]:
        """Convert incidents data to JSON format"""
        json_data = self.serializer.incidents_to_json(incidents_data)
        
        return {
            "center_code": self.center_code,
            "center_name": self.center_mapper.get_center_name(self.center_code),
            "incident_count": json_data["incident_count"],
            "incidents": json_data["incidents"],
            "last_updated": datetime.now().isoformat()
        }
    
    def save_active_incidents(self, incidents_data: List[Dict]) -> bool:
        """Save current incidents to active_incidents.json only if data changed"""
        json_data = self.incidents_to_json(incidents_data)
        
        # Check if file exists and compare with existing data
        if self.file_manager.file_exists(self.active_file):
            try:
                existing_data = self.file_manager.load_file(self.active_file)
                
                # Only write if data is different
                if self.comparator.data_equals(existing_data, json_data):
                    logging.info("No changes detected - skipping active_incidents.json write")
                    return False
            except Exception as e:
                logging.warning(f"Error reading existing file, will overwrite: {e}")
        
        # Write only when different or file doesn't exist
        success = self.file_manager.save_file(self.active_file, json_data)
        
        logging.info(f"Saved {len(incidents_data)} incidents to {self.active_file}")
        
        # Maintain backward compatibility: also save to active_incidents.json if this is BCCC
        if self.center_code == "BCCC":
            self.file_manager.save_file("active_incidents.json", json_data)
            logging.info("Also saved to active_incidents.json for backward compatibility")
        
        return success
    
    
    def save_delta_updates(self, changes: Dict[str, List]) -> bool:
        """Save only the changes (deltas) to a separate file"""
        if not changes or (not changes.get('new_incidents') and not changes.get('removed_incidents')):
            logging.info("No changes detected - skipping delta file write")
            return False
        
        # Convert incident data to JSON format for deltas
        new_incidents_json = []
        for incident in changes.get('new_incidents', []):
            if isinstance(incident, dict):
                # Already in structured format
                new_incidents_json.append(incident)
            elif len(incident) >= 7:
                # Convert from old format
                new_incidents_json.append({
                    "id": incident[1],
                    "time": incident[2],
                    "type": incident[3],
                    "location": incident[4],
                    "location_desc": incident[5] if len(incident) > 5 else "",
                    "area": incident[6] if len(incident) > 6 else "",
                    "details": "",
                    "lane_blockage": {"status": "unknown", "details": []},
                    "is_new": True,
                    "is_relevant": False
                })
        
        removed_incidents_json = []
        for incident in changes.get('removed_incidents', []):
            if isinstance(incident, dict):
                # Already in structured format
                removed_incidents_json.append(incident)
            elif len(incident) >= 7:
                # Convert from old format
                removed_incidents_json.append({
                    "id": incident[1],
                    "time": incident[2],
                    "type": incident[3],
                    "location": incident[4],
                    "location_desc": incident[5] if len(incident) > 5 else "",
                    "area": incident[6] if len(incident) > 6 else "",
                    "details": "",
                    "lane_blockage": {"status": "unknown", "details": []},
                    "is_new": False,
                    "is_relevant": False
                })
        
        delta_data = {
            "center_code": self.center_code,
            "center_name": self.center_mapper.get_center_name(self.center_code),
            "timestamp": datetime.now().isoformat(),
            "new_incidents": new_incidents_json,
            "removed_incidents": removed_incidents_json,
            "new_count": len(new_incidents_json),
            "removed_count": len(removed_incidents_json)
        }
        
        success = self.file_manager.save_file(self.delta_file, delta_data)
        
        logging.info(f"Saved delta updates: {len(new_incidents_json)} new, {len(removed_incidents_json)} removed")
        return success
    
    def append_daily_incidents(self, incidents_data: List[List[str]]) -> None:
        """Append unique incidents to daily JSON file"""
        today = datetime.now().strftime("%Y-%m-%d")
        daily_file = f"{self.data_dir}/{today}_incidents_{self.center_code}.json"
        
        # Load existing daily incidents
        existing_incidents = []
        if self.file_manager.file_exists(daily_file):
            existing_data = self.file_manager.load_file(daily_file)
            if existing_data:
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
                "center_name": self.center_mapper.get_center_name(self.center_code),
                "date": today,
                "total_incidents": len(all_incidents),
                "incidents": all_incidents,
                "last_updated": datetime.now().isoformat()
            }
            
            self.file_manager.save_file(daily_file, daily_data)
            
            logging.info(f"Appended {len(unique_incidents)} unique incidents to {daily_file}")
    
    def compare_incidents(self, current_incidents: List[Dict]) -> Dict[str, List]:
        """Compare current incidents with previous ones"""
        return self.comparator.compare_incidents(current_incidents, self.previous_incidents)
    
    def update_previous_incidents(self, incidents_data: List[Dict]) -> None:
        """Update the previous incidents for next comparison"""
        self.previous_incidents = incidents_data.copy()
    
    def load_previous_incidents(self) -> List[Dict]:
        """Load previous incidents from active incidents file"""
        if self.file_manager.file_exists(self.active_file):
            try:
                data = self.file_manager.load_file(self.active_file)
                if data:
                    incidents = data.get('incidents', [])
                    logging.info(f"Loaded {len(incidents)} previous incidents")
                    return incidents
            except Exception as e:
                logging.error(f"Error loading previous incidents: {e}")
                return []
        return []
    
    def is_cache_valid(self, timestamp: float) -> bool:
        """Check if cache is still valid"""
        cache_duration = 5 * 60 * 1000  # 5 minutes
        return (datetime.now().timestamp() * 1000) - timestamp < cache_duration
    
    def cleanup_old_cache(self) -> None:
        """Clean up old cache entries"""
        # This could be implemented to clean up old files
        pass
