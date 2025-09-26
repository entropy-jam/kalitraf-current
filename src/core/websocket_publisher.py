#!/usr/bin/env python3
"""
WebSocket Publisher for Real-time CHP Incident Updates
Integrates with existing Python scraper to publish real-time updates
"""
import os
import json
import logging
import requests
from typing import Dict, List, Any, Optional

class WebSocketPublisher:
    """Publishes incident updates to WebSocket service via HTTP API"""
    
    def __init__(self):
        self.pusher_app_id = os.getenv('PUSHER_APP_ID')
        self.pusher_key = os.getenv('PUSHER_KEY')
        self.pusher_secret = os.getenv('PUSHER_SECRET')
        self.pusher_cluster = os.getenv('PUSHER_CLUSTER', 'us2')
        
        # Center configuration
        self.center_channels = {
            'BCCC': 'chp-incidents-bccc',
            'LACC': 'chp-incidents-lacc', 
            'SACC': 'chp-incidents-sacc',
            'OCCC': 'chp-incidents-occc'
        }
        
        self.center_names = {
            'BCCC': 'Border',
            'LACC': 'Los Angeles',
            'SACC': 'Sacramento', 
            'OCCC': 'Orange County'
        }
        
        # Check if WebSocket publishing is enabled
        self.enabled = all([
            self.pusher_app_id,
            self.pusher_key, 
            self.pusher_secret
        ])
        
        if not self.enabled:
            logging.warning("WebSocket publishing disabled - missing Pusher credentials")
        else:
            logging.info("WebSocket publishing enabled")
    
    def publish_incident_update(self, center_code: str, incidents_data: Dict[str, Any], 
                              changes: Optional[Dict[str, List]] = None) -> bool:
        """
        Publish incident update to WebSocket channel
        
        Args:
            center_code: Communication center code (BCCC, LACC, etc.)
            incidents_data: Current incidents data
            changes: Delta changes (new/removed incidents)
            
        Returns:
            bool: True if published successfully
        """
        if not self.enabled:
            logging.info("WebSocket publishing disabled - skipping publish")
            return False
            
        try:
            channel = self.center_channels.get(center_code)
            center_name = self.center_names.get(center_code, center_code)
            
            if not channel:
                logging.error(f"Unknown center code: {center_code}")
                return False
            
            # Publish main incident update
            success = self._publish_to_channel(
                channel=channel,
                event='new-incident',
                data={
                    'center': center_code,
                    'centerName': center_name,
                    'centerFullName': f'{center_name} Communication Center',
                    'incidents': incidents_data.get('incidents', []),
                    'incidentCount': incidents_data.get('incident_count', 0),
                    'timestamp': incidents_data.get('last_updated'),
                    'eventType': 'scrape-complete'
                }
            )
            
            # Publish delta updates if available
            if changes and self._has_changes(changes):
                delta_success = self._publish_delta_update(center_code, channel, center_name, changes)
                success = success and delta_success
            
            # Publish center status update
            status_success = self._publish_center_status(center_code, channel, center_name, incidents_data)
            success = success and status_success
            
            if success:
                logging.info(f"✅ Published WebSocket updates for {center_name} ({center_code})")
            else:
                logging.error(f"❌ Failed to publish some WebSocket updates for {center_code}")
                
            return success
            
        except Exception as e:
            logging.error(f"Error publishing WebSocket update for {center_code}: {e}")
            return False
    
    def _publish_to_channel(self, channel: str, event: str, data: Dict[str, Any]) -> bool:
        """Publish data to a specific Pusher channel"""
        try:
            # Use Pusher HTTP API to trigger events
            url = f"https://api-{self.pusher_cluster}.pusherapp.com/apps/{self.pusher_app_id}/events"
            
            payload = {
                'name': event,
                'channel': channel,
                'data': json.dumps(data)
            }
            
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.pusher_secret}'
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                logging.debug(f"Published {event} to {channel}")
                return True
            else:
                logging.error(f"Failed to publish to {channel}: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logging.error(f"Error publishing to channel {channel}: {e}")
            return False
    
    def _publish_delta_update(self, center_code: str, channel: str, center_name: str, 
                            changes: Dict[str, List]) -> bool:
        """Publish delta updates (new/removed incidents)"""
        try:
            new_incidents = changes.get('new_incidents', [])
            removed_incidents = changes.get('removed_incidents', [])
            
            data = {
                'center': center_code,
                'centerName': center_name,
                'newIncidents': new_incidents,
                'removedIncidents': removed_incidents,
                'newCount': len(new_incidents),
                'removedCount': len(removed_incidents),
                'timestamp': self._get_timestamp(),
                'eventType': 'delta-update'
            }
            
            success = self._publish_to_channel(channel, 'updated-incident', data)
            
            if success:
                logging.info(f"📊 Published delta update: {len(new_incidents)} new, {len(removed_incidents)} removed")
            
            return success
            
        except Exception as e:
            logging.error(f"Error publishing delta update: {e}")
            return False
    
    def _publish_center_status(self, center_code: str, channel: str, center_name: str, 
                             incidents_data: Dict[str, Any]) -> bool:
        """Publish center status update"""
        try:
            data = {
                'center': center_code,
                'centerName': center_name,
                'status': 'active',
                'lastUpdate': self._get_timestamp(),
                'incidentCount': incidents_data.get('incident_count', 0),
                'health': 'good'
            }
            
            return self._publish_to_channel(channel, 'center-status', data)
            
        except Exception as e:
            logging.error(f"Error publishing center status: {e}")
            return False
    
    def _has_changes(self, changes: Dict[str, List]) -> bool:
        """Check if there are actual changes to publish"""
        new_count = len(changes.get('new_incidents', []))
        removed_count = len(changes.get('removed_incidents', []))
        return new_count > 0 or removed_count > 0
    
    def _get_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def test_connection(self) -> bool:
        """Test WebSocket connection and credentials"""
        if not self.enabled:
            return False
            
        try:
            # Test with a simple ping to Pusher API
            url = f"https://api-{self.pusher_cluster}.pusherapp.com/apps/{self.pusher_app_id}"
            headers = {'Authorization': f'Bearer {self.pusher_secret}'}
            
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                logging.info("✅ WebSocket connection test successful")
                return True
            else:
                logging.error(f"❌ WebSocket connection test failed: {response.status_code}")
                return False
                
        except Exception as e:
            logging.error(f"❌ WebSocket connection test error: {e}")
            return False
