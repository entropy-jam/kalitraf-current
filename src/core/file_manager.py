#!/usr/bin/env python3
"""
File Manager Implementation
Single Responsibility: Handles file operations
"""

import json
import os
from typing import Any, Optional
from .interfaces import IFileManager

class FileManager(IFileManager):
    """Handles file I/O operations"""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.ensure_directory(data_dir)
    
    def save_file(self, filepath: str, data: Any) -> bool:
        """Save data to file"""
        try:
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2)
            return True
        except Exception as e:
            print(f"Error saving file {filepath}: {e}")
            return False
    
    def load_file(self, filepath: str) -> Optional[Any]:
        """Load data from file"""
        try:
            with open(filepath, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading file {filepath}: {e}")
            return None
    
    def file_exists(self, filepath: str) -> bool:
        """Check if file exists"""
        return os.path.exists(filepath)
    
    def ensure_directory(self, directory: str) -> None:
        """Ensure directory exists"""
        os.makedirs(directory, exist_ok=True)
