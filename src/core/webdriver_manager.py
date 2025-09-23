#!/usr/bin/env python3
"""
WebDriver management for different environments
"""
import os
import logging
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

class WebDriverManager:
    """Manages WebDriver initialization for different environments"""
    
    def __init__(self, mode="local"):
        self.mode = mode
        self.driver = None
    
    def get_driver(self):
        """Get configured WebDriver instance"""
        if self.mode == "github_actions":
            return self._get_github_actions_driver()
        else:
            return self._get_local_driver()
    
    def _get_github_actions_driver(self):
        """Get Chrome driver optimized for GitHub Actions"""
        options = webdriver.ChromeOptions()
        options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--disable-web-security")
        options.add_argument("--disable-features=VizDisplayCompositor")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-plugins")
        options.add_argument("--disable-images")
        options.add_argument("--remote-debugging-port=9222")
        
        driver = webdriver.Chrome(options=options)
        logging.info("Chrome WebDriver initialized (GitHub Actions)")
        return driver
    
    def _get_local_driver(self):
        """Get Chrome driver for local development"""
        options = webdriver.ChromeOptions()
        
        try:
            # Try webdriver-manager first
            driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
            logging.info("Chrome WebDriver initialized with webdriver-manager")
            return driver
        except Exception as e:
            logging.warning(f"Webdriver-manager failed: {e}")
            # Fallback to local chromedriver
            chromedriver_path = "/Users/jace/Desktop/nick traffic/chromedriver-mac-arm64/chromedriver"
            if os.path.exists(chromedriver_path):
                driver = webdriver.Chrome(service=Service(chromedriver_path))
                logging.info("Chrome WebDriver initialized with local driver")
                return driver
            else:
                raise Exception("No ChromeDriver available")
    
    def close(self):
        """Close the WebDriver"""
        if self.driver:
            self.driver.quit()
            self.driver = None
