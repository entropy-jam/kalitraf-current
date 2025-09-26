#!/usr/bin/env python3
"""
Core Interfaces for SOLID Principles
Interface Segregation Principle: Clients should not depend on interfaces they don't use
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class IDataSerializer(ABC):
    """Interface for data serialization/deserialization"""
    
    @abstractmethod
    def incidents_to_json(self, incidents_data: List[Dict]) -> Dict[str, Any]:
        """Convert incidents data to JSON format"""
        pass
    
    @abstractmethod
    def json_to_incidents(self, json_data: Dict[str, Any]) -> List[Dict]:
        """Convert JSON data to incidents format"""
        pass

class IFileManager(ABC):
    """Interface for file operations"""
    
    @abstractmethod
    def save_file(self, filepath: str, data: Any) -> bool:
        """Save data to file"""
        pass
    
    @abstractmethod
    def load_file(self, filepath: str) -> Optional[Any]:
        """Load data from file"""
        pass
    
    @abstractmethod
    def file_exists(self, filepath: str) -> bool:
        """Check if file exists"""
        pass
    
    @abstractmethod
    def ensure_directory(self, directory: str) -> None:
        """Ensure directory exists"""
        pass

class IDataComparator(ABC):
    """Interface for data comparison operations"""
    
    @abstractmethod
    def compare_incidents(self, current_incidents: List[Dict], previous_incidents: List[Dict]) -> Dict[str, List]:
        """Compare two incident datasets"""
        pass
    
    @abstractmethod
    def data_equals(self, data1: Dict, data2: Dict) -> bool:
        """Compare two datasets for equality"""
        pass

class ICenterMapper(ABC):
    """Interface for center code mapping"""
    
    @abstractmethod
    def get_center_name(self, center_code: str) -> str:
        """Get human-readable center name"""
        pass
    
    @abstractmethod
    def get_available_centers(self) -> List[str]:
        """Get list of available center codes"""
        pass

class IDeltaProcessor(ABC):
    """Interface for delta processing operations"""
    
    @abstractmethod
    def save_delta_updates(self, changes: Dict[str, List]) -> bool:
        """Save delta updates to file"""
        pass
    
    @abstractmethod
    def append_daily_incidents(self, incidents_data: List[Dict]) -> None:
        """Append incidents to daily file"""
        pass

class ICacheManager(ABC):
    """Interface for cache management"""
    
    @abstractmethod
    def is_cache_valid(self, timestamp: float) -> bool:
        """Check if cache is still valid"""
        pass
    
    @abstractmethod
    def cleanup_old_cache(self) -> None:
        """Clean up old cache entries"""
        pass
