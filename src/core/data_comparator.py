#!/usr/bin/env python3
"""
Data Comparator Implementation
Single Responsibility: Handles data comparison operations
"""

from typing import List, Dict
from .interfaces import IDataComparator

class DataComparator(IDataComparator):
    """Handles comparison of incident datasets"""
    
    def compare_incidents(self, current_incidents: List[Dict], previous_incidents: List[Dict]) -> Dict[str, List]:
        """Compare current incidents with previous ones"""
        if previous_incidents is None:
            return {"new_incidents": current_incidents, "removed_incidents": []}
        
        # Convert to sets for comparison (using incident ID + time as unique identifier)
        if current_incidents and isinstance(current_incidents[0], dict):
            # New structured format
            current_set = {f"{incident['id']}_{incident['time']}" for incident in current_incidents}
            previous_set = {f"{incident['id']}_{incident['time']}" for incident in previous_incidents}
            
            new_incidents = [incident for incident in current_incidents 
                            if f"{incident['id']}_{incident['time']}" not in previous_set]
            removed_incidents = [incident for incident in previous_incidents 
                               if f"{incident['id']}_{incident['time']}" not in current_set]
        else:
            # Old format (List[List[str]])
            current_set = {f"{incident[1]}_{incident[2]}" for incident in current_incidents}
            previous_set = {f"{incident[1]}_{incident[2]}" for incident in previous_incidents}
            
            new_incidents = [incident for incident in current_incidents 
                            if f"{incident[1]}_{incident[2]}" not in previous_set]
            removed_incidents = [incident for incident in previous_incidents 
                               if f"{incident[1]}_{incident[2]}" not in current_set]
        
        return {
            "new_incidents": new_incidents,
            "removed_incidents": removed_incidents
        }
    
    def data_equals(self, data1: Dict, data2: Dict) -> bool:
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
