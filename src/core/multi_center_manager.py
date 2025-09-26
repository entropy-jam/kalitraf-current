#!/usr/bin/env python3
"""
Multi-center data aggregation and management
"""
import logging
from datetime import datetime
from typing import List, Dict, Any, Set

from .center_mapper import CenterMapper
from .file_manager import FileManager

class MultiCenterManager:
    """Manages data aggregation from multiple communication centers"""
    
    def __init__(self, centers: List[str] = None):
        self.centers = centers or ["BCCC", "LACC", "SACC", "OCCC"]
        self.data_dir = "data"
        self.center_mapper = CenterMapper()
        self.file_manager = FileManager(self.data_dir)
        
    def load_center_data(self, center_code: str) -> Dict[str, Any]:
        """Load data for a specific center"""
        file_path = f"data/active_incidents_{center_code}.json"
        
        if not self.file_manager.file_exists(file_path):
            logging.warning(f"No data file found for center {center_code}")
            return None
            
        try:
            return self.file_manager.load_file(file_path)
        except Exception as e:
            logging.error(f"Error loading data for {center_code}: {e}")
            return None
    
    def aggregate_incidents(self, selected_centers: List[str] = None) -> Dict[str, Any]:
        """Aggregate incidents from multiple centers"""
        centers_to_process = selected_centers or self.centers
        all_incidents = []
        center_stats = {}
        total_incidents = 0
        
        for center_code in centers_to_process:
            center_data = self.load_center_data(center_code)
            
            if center_data:
                incidents = center_data.get('incidents', [])
                incident_count = center_data.get('incident_count', 0)
                
                # Add center information to each incident
                for incident in incidents:
                    incident['center_code'] = center_code
                    incident['center_name'] = center_data.get('center_name', center_code)
                
                all_incidents.extend(incidents)
                center_stats[center_code] = {
                    'name': center_data.get('center_name', center_code),
                    'count': incident_count,
                    'last_updated': center_data.get('last_updated')
                }
                total_incidents += incident_count
                
                logging.info(f"Loaded {incident_count} incidents from {center_code}")
            else:
                center_stats[center_code] = {
                    'name': self.center_mapper.get_center_name(center_code),
                    'count': 0,
                    'last_updated': None
                }
        
        # Deduplicate incidents based on ID and location
        deduplicated_incidents = self._deduplicate_incidents(all_incidents)
        
        # Sort by time (most recent first)
        deduplicated_incidents.sort(key=lambda x: x.get('time', ''), reverse=True)
        
        return {
            'centers': center_stats,
            'total_incidents': len(deduplicated_incidents),
            'incidents': deduplicated_incidents,
            'last_updated': datetime.now().isoformat(),
            'aggregation_timestamp': datetime.now().isoformat()
        }
    
    def _deduplicate_incidents(self, incidents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate incidents based on ID and location"""
        seen = set()
        deduplicated = []
        
        for incident in incidents:
            # Create a unique key based on ID, location, and time
            key = f"{incident.get('id', '')}_{incident.get('location', '')}_{incident.get('time', '')}"
            
            if key not in seen:
                seen.add(key)
                deduplicated.append(incident)
            else:
                logging.debug(f"Deduplicated incident: {incident.get('id', 'unknown')}")
        
        return deduplicated
    
    def get_center_summary(self) -> Dict[str, Any]:
        """Get summary of all available centers"""
        summary = {}
        
        for center_code in self.centers:
            center_data = self.load_center_data(center_code)
            
            if center_data:
                summary[center_code] = {
                    'name': center_data.get('center_name', center_code),
                    'incident_count': center_data.get('incident_count', 0),
                    'last_updated': center_data.get('last_updated'),
                    'status': 'active'
                }
            else:
                summary[center_code] = {
                    'name': self.center_mapper.get_center_name(center_code),
                    'incident_count': 0,
                    'last_updated': None,
                    'status': 'inactive'
                }
        
        return summary
    
    def save_aggregated_data(self, aggregated_data: Dict[str, Any], filename: str = "data/aggregated_incidents.json") -> bool:
        """Save aggregated data to file"""
        try:
            success = self.file_manager.save_file(filename, aggregated_data)
            if success:
                logging.info(f"Saved aggregated data to {filename}")
            return success
        except Exception as e:
            logging.error(f"Error saving aggregated data: {e}")
            return False
    
