#!/usr/bin/env python3
"""
Configuration file for CHP Traffic Scraper
"""
import os

# Gmail API Configuration
GMAIL_API_KEY = "AIzaSyA8z6XU_VOm73d8D592i6qj2HbNDmpLiI4"
GMAIL_SENDER_EMAIL = "jacearnoldmail@gmail.com"
GMAIL_RECIPIENT_EMAIL = "jacearnoldmail@gmail.com"
ENABLE_EMAIL_NOTIFICATIONS = True

# CHP Scraper Configuration
DEFAULT_COMMUNICATION_CENTER = "BCCC"
DEFAULT_SCRAPER_MODE = "local"

def get_gmail_config():
    """Get Gmail configuration"""
    return {
        'api_key': GMAIL_API_KEY,
        'sender_email': GMAIL_SENDER_EMAIL,
        'recipient_email': GMAIL_RECIPIENT_EMAIL,
        'enabled': ENABLE_EMAIL_NOTIFICATIONS
    }
