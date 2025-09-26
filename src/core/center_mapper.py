#!/usr/bin/env python3
"""
Center Mapper Implementation
Single Responsibility: Handles center code mapping
"""

from typing import List
from .interfaces import ICenterMapper

class CenterMapper(ICenterMapper):
    """Maps center codes to human-readable names"""
    
    def __init__(self):
        self.centers = {
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
    
    def get_center_name(self, center_code: str) -> str:
        """Get human-readable center name"""
        return self.centers.get(center_code, center_code)
    
    def get_available_centers(self) -> List[str]:
        """Get list of available center codes"""
        return list(self.centers.keys())
