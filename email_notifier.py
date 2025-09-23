#!/usr/bin/env python3
"""
Email notification system for CHP traffic incidents using Gmail API
"""
import os
import json
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import logging

try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    GMAIL_AVAILABLE = True
except ImportError:
    GMAIL_AVAILABLE = False
    print("Gmail API libraries not installed. Install with: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client")

# Gmail API scopes
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

class EmailNotifier:
    def __init__(self, credentials_file=None, token_file=None):
        self.credentials_file = credentials_file or os.getenv('GMAIL_CREDENTIALS_FILE', 'gmail_credentials.json')
        self.token_file = token_file or os.getenv('GMAIL_TOKEN_FILE', 'gmail_token.json')
        self.service = None
        self.sender_email = os.getenv('GMAIL_SENDER_EMAIL', 'jacearnoldmail@gmail.com')
        self.recipient_email = os.getenv('GMAIL_RECIPIENT_EMAIL', 'jacearnoldmail@gmail.com')
        
    def authenticate(self):
        """Authenticate with Gmail API"""
        if not GMAIL_AVAILABLE:
            logging.error("Gmail API libraries not available")
            return False
            
        creds = None
        
        # Load existing token
        if os.path.exists(self.token_file):
            creds = Credentials.from_authorized_user_file(self.token_file, SCOPES)
        
        # If no valid credentials, try to get new ones
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                if not os.path.exists(self.credentials_file):
                    logging.error(f"Credentials file not found: {self.credentials_file}")
                    return False
                    
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_file, SCOPES)
                creds = flow.run_local_server(port=0)
            
            # Save credentials for next run
            with open(self.token_file, 'w') as token:
                token.write(creds.to_json())
        
        try:
            self.service = build('gmail', 'v1', credentials=creds)
            logging.info("Gmail API authenticated successfully")
            return True
        except Exception as e:
            logging.error(f"Failed to authenticate with Gmail API: {e}")
            return False
    
    def create_message(self, subject, body, to_email):
        """Create email message"""
        message = MIMEMultipart()
        message['to'] = to_email
        message['from'] = self.sender_email
        message['subject'] = subject
        
        # Add HTML body
        message.attach(MIMEText(body, 'html'))
        
        # Encode message
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
        return {'raw': raw_message}
    
    def send_email(self, subject, body, to_email=None):
        """Send email notification"""
        if not self.service:
            if not self.authenticate():
                logging.error("Failed to authenticate with Gmail API")
                return False
        
        to_email = to_email or self.recipient_email
        
        try:
            message = self.create_message(subject, body, to_email)
            self.service.users().messages().send(
                userId='me', body=message
            ).execute()
            logging.info(f"Email sent successfully to {to_email}")
            return True
        except HttpError as error:
            logging.error(f"Failed to send email: {error}")
            return False
    
    def send_incident_alert(self, changes, center_name, center_code):
        """Send incident change alert"""
        subject = f"🚨 CHP Traffic Alert - {center_name} Center - {len(changes.get('new_incidents', []))} New Incidents"
        
        # Create HTML email body
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
                    incident_type_class = self.get_type_class(incident[3])
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
                    incident_type_class = self.get_type_class(incident[3])
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
        
        return self.send_email(subject, body)
    
    def get_type_class(self, incident_type):
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
    
    def send_test_email(self):
        """Send test email"""
        subject = "🧪 CHP Traffic Monitor - Test Email"
        body = f"""
        <html>
        <body>
            <h2>Test Email from CHP Traffic Monitor</h2>
            <p>This is a test email to verify the notification system is working.</p>
            <p><strong>Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p>If you receive this email, the notification system is configured correctly!</p>
        </body>
        </html>
        """
        return self.send_email(subject, body)

def main():
    """Test the email notification system"""
    notifier = EmailNotifier()
    
    # Test authentication
    if notifier.authenticate():
        print("✅ Gmail API authentication successful")
        
        # Send test email
        if notifier.send_test_email():
            print("✅ Test email sent successfully")
        else:
            print("❌ Failed to send test email")
    else:
        print("❌ Gmail API authentication failed")

if __name__ == "__main__":
    main()
