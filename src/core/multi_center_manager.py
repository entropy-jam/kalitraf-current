#!/usr/bin/env python3
"""
Multi-center data aggregation and management
"""
import json
import os
import logging
from datetime import datetime
from typing import List, Dict, Any, Set

class MultiCenterManager:
    """Manages data aggregation from multiple communication centers"""
    
    def __init__(self, centers: List[str] = None):
        self.centers = centers or ["BCCC", "LACC", "SACC", "OCCC"]
        self.data_dir = "data"
        
    def load_center_data(self, center_code: str) -> Dict[str, Any]:
        """Load data for a specific center"""
        file_path = f"active_incidents_{center_code}.json"
        
        if not os.path.exists(file_path):
            logging.warning(f"No data file found for center {center_code}")
            return None
            
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
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
                    'name': self._get_center_name(center_code),
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
                    'name': self._get_center_name(center_code),
                    'incident_count': 0,
                    'last_updated': None,
                    'status': 'inactive'
                }
        
        return summary
    
    def save_aggregated_data(self, aggregated_data: Dict[str, Any], filename: str = "aggregated_incidents.json") -> bool:
        """Save aggregated data to file"""
        try:
            with open(filename, 'w') as f:
                json.dump(aggregated_data, f, indent=2)
            logging.info(f"Saved aggregated data to {filename}")
            return True
        except IOError as e:
            logging.error(f"Error saving aggregated data: {e}")
            return False
    
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
