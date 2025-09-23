#!/usr/bin/env python3
"""
Email notification system using SMTP
"""
import smtplib
import os
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Dict, List

class EmailNotifier:
    """Handles email notifications via SMTP"""
    
    def __init__(self):
        self.sender_email = os.getenv('GMAIL_SENDER_EMAIL', 'jacearnoldmail@gmail.com')
        self.recipient_email = os.getenv('GMAIL_RECIPIENT_EMAIL', 'jacearnoldmail@gmail.com')
        self.app_password = os.getenv('GMAIL_APP_PASSWORD', '')
    
    def send_email(self, subject: str, body: str, to_email: str = None) -> bool:
        """Send email using SMTP"""
        if not self.app_password:
            logging.error("Gmail App Password not set")
            return False
            
        to_email = to_email or self.recipient_email
        
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.sender_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add body
            msg.attach(MIMEText(body, 'html'))
            
            # Connect to Gmail SMTP
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(self.sender_email, self.app_password)
            
            # Send email
            text = msg.as_string()
            server.sendmail(self.sender_email, to_email, text)
            server.quit()
            
            logging.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logging.error(f"Failed to send email: {e}")
            return False
    
    def send_incident_alert(self, changes: Dict[str, List], center_name: str, center_code: str) -> bool:
        """Send incident change alert"""
        subject = f"🚨 CHP Traffic Alert - {center_name} Center - {len(changes.get('new_incidents', []))} New Incidents"
        
        # Create HTML email body
        body = self._create_email_body(changes, center_name, center_code)
        return self.send_email(subject, body)
    
    def _create_email_body(self, changes: Dict[str, List], center_name: str, center_code: str) -> str:
        """Create HTML email body"""
        body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }}
                .incident {{ background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; margin: 10px 0; border-radius: 5px; }}
                .new {{ border-left: 4px solid #28a745; }}
                .resolved {{ border-left: 4px solid #dc3545; }}
                .incident-id {{ font-weight: bold; color: #007bff; }}
                .incident-time {{ color: #6c757d; font-size: 14px; }}
                .incident-type {{ display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; margin: 5px 0; }}
                .type-traffic-hazard {{ background: #fff3cd; color: #856404; }}
                .type-collision {{ background: #f8d7da; color: #721c24; }}
                .type-sig-alert {{ background: #d1ecf1; color: #0c5460; }}
                .type-animal-hazard {{ background: #d4edda; color: #155724; }}
                .type-weather {{ background: #e2e3e5; color: #383d41; }}
                .footer {{ margin-top: 20px; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 12px; color: #6c757d; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h2>🚨 CHP Traffic Incident Alert</h2>
                <p><strong>Center:</strong> {center_name} ({center_code})</p>
                <p><strong>Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
        """
        
        # Add new incidents
        new_incidents = changes.get('new_incidents', [])
        if new_incidents:
            body += f"<h3>🆕 New Incidents ({len(new_incidents)})</h3>"
            for incident in new_incidents:
                if len(incident) >= 7:
                    incident_type_class = self._get_type_class(incident[3])
                    body += f"""
                    <div class="incident new">
                        <div class="incident-id">#{incident[1]}</div>
                        <div class="incident-time">{incident[2]}</div>
                        <div class="incident-type {incident_type_class}">{incident[3]}</div>
                        <div><strong>Location:</strong> {incident[4]}</div>
                        {f'<div><strong>Description:</strong> {incident[5]}</div>' if incident[5] else ''}
                        <div><strong>Area:</strong> {incident[6]}</div>
                    </div>
                    """
        
        # Add resolved incidents
        resolved_incidents = changes.get('removed_incidents', [])
        if resolved_incidents:
            body += f"<h3>✅ Resolved Incidents ({len(resolved_incidents)})</h3>"
            for incident in resolved_incidents:
                if len(incident) >= 7:
                    incident_type_class = self._get_type_class(incident[3])
                    body += f"""
                    <div class="incident resolved">
                        <div class="incident-id">#{incident[1]}</div>
                        <div class="incident-time">{incident[2]}</div>
                        <div class="incident-type {incident_type_class}">{incident[3]}</div>
                        <div><strong>Location:</strong> {incident[4]}</div>
                        {f'<div><strong>Description:</strong> {incident[5]}</div>' if incident[5] else ''}
                        <div><strong>Area:</strong> {incident[6]}</div>
                    </div>
                    """
        
        body += f"""
            <div class="footer">
                <p>This alert was generated by the CHP Traffic Monitor system.</p>
                <p>View live data: <a href="https://entropy-jam.github.io/chp-scraper/">https://entropy-jam.github.io/chp-scraper/</a></p>
            </div>
        </body>
        </html>
        """
        
        return body
    
    def _get_type_class(self, incident_type: str) -> str:
        """Get CSS class for incident type"""
        type_map = {
            'Traffic Hazard': 'type-traffic-hazard',
            'Trfc Collision': 'type-collision',
            'SIG Alert': 'type-sig-alert',
            'Animal Hazard': 'type-animal-hazard',
            'Road/Weather': 'type-weather'
        }
        
        for key, class_name in type_map.items():
            if key in incident_type:
                return class_name
        return 'type-traffic-hazard'
