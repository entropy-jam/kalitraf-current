#!/usr/bin/env python3
"""
Incident Parser Implementation
Single Responsibility: Handles data parsing and structuring
"""

from typing import List, Dict

class IncidentParser:
    """Handles parsing and structuring of incident data"""
    
    def convert_to_structured_format(self, incidents_data: List[List[str]]) -> List[Dict]:
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
    
    def mark_new_incidents(self, incidents: List[Dict], previous_ids: set) -> List[Dict]:
        """Mark incidents as new based on previous incident IDs"""
        for incident in incidents:
            incident['is_new'] = incident['id'] not in previous_ids
        return incidents
