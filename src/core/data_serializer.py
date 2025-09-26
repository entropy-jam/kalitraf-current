#!/usr/bin/env python3
"""
Data Serializer Implementation
Single Responsibility: Handles data serialization/deserialization
"""

from typing import List, Dict, Any
from .interfaces import IDataSerializer

class DataSerializer(IDataSerializer):
    """Handles conversion between different data formats"""
    
    def incidents_to_json(self, incidents_data: List[Dict]) -> Dict[str, Any]:
        """Convert incidents data to JSON format"""
        # If incidents_data is already structured (Dict), use it directly
        if incidents_data and isinstance(incidents_data[0], dict):
            incidents = incidents_data
        else:
            # Convert from old format (List[List[str]]) to new format
            incidents = []
            for row in incidents_data:
                if len(row) >= 7:
                    incident = {
                        "id": row[1],
                        "time": row[2],
                        "type": row[3],
                        "location": row[4],
                        "location_desc": row[5] if len(row) > 5 else "",
                        "area": row[6] if len(row) > 6 else "",
                        "details": "",
                        "lane_blockage": {"status": "unknown", "details": []},
                        "is_new": False,
                        "is_relevant": False
                    }
                    incidents.append(incident)
        
        return {
            "incidents": incidents,
            "incident_count": len(incidents)
        }
    
    def json_to_incidents(self, json_data: Dict[str, Any]) -> List[Dict]:
        """Convert JSON data to incidents format"""
        return json_data.get('incidents', [])
