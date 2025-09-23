#!/usr/bin/env python3
"""
Setup script for Gmail API credentials
"""
import os
import json
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Gmail API scopes
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def setup_gmail_credentials():
    """Setup Gmail API credentials"""
    print("🔧 Setting up Gmail API credentials...")
    
    # Check if credentials file exists
    credentials_file = 'gmail_credentials.json'
    token_file = 'gmail_token.json'
    
    if not os.path.exists(credentials_file):
        print(f"❌ Credentials file not found: {credentials_file}")
        print("\n📋 To set up Gmail API credentials:")
        print("1. Go to https://console.cloud.google.com/")
        print("2. Create a new project or select existing one")
        print("3. Enable Gmail API")
        print("4. Create OAuth 2.0 credentials (Desktop application)")
        print("5. Download the credentials JSON file")
        print(f"6. Save it as '{credentials_file}' in this directory")
        print("\n📄 The credentials file should look like:")
        print("""
{
  "installed": {
    "client_id": "your-client-id.apps.googleusercontent.com",
    "project_id": "your-project-id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "your-client-secret",
    "redirect_uris": ["http://localhost"]
  }
}
        """)
        return False
    
    # Load credentials
    creds = None
    if os.path.exists(token_file):
        creds = Credentials.from_authorized_user_file(token_file, SCOPES)
    
    # If no valid credentials, get new ones
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("🔄 Refreshing expired credentials...")
            creds.refresh(Request())
        else:
            print("🔐 Requesting new credentials...")
            flow = InstalledAppFlow.from_client_secrets_file(credentials_file, SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Save credentials
        with open(token_file, 'w') as token:
            token.write(creds.to_json())
        print(f"✅ Credentials saved to {token_file}")
    
    # Test the credentials
    try:
        service = build('gmail', 'v1', credentials=creds)
        print("✅ Gmail API authentication successful!")
        
        # Test sending an email
        from email_notifier import EmailNotifier
        notifier = EmailNotifier()
        notifier.service = service
        
        print("📧 Sending test email...")
        if notifier.send_test_email():
            print("✅ Test email sent successfully!")
            print("📬 Check your email inbox for the test message")
        else:
            print("❌ Failed to send test email")
            
        return True
        
    except Exception as e:
        print(f"❌ Gmail API setup failed: {e}")
        return False

def create_sample_credentials():
    """Create a sample credentials file template"""
    sample_creds = {
        "installed": {
            "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
            "project_id": "YOUR_PROJECT_ID",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": "YOUR_CLIENT_SECRET",
            "redirect_uris": ["http://localhost"]
        }
    }
    
    with open('gmail_credentials_template.json', 'w') as f:
        json.dump(sample_creds, f, indent=2)
    
    print("📄 Created gmail_credentials_template.json")
    print("📝 Edit this file with your actual credentials and rename to gmail_credentials.json")

def main():
    print("🚨 CHP Traffic Monitor - Gmail API Setup")
    print("=" * 50)
    
    if not os.path.exists('gmail_credentials.json'):
        print("📋 Gmail credentials not found. Creating template...")
        create_sample_credentials()
        print("\n🔧 Please follow the setup instructions above.")
        return
    
    if setup_gmail_credentials():
        print("\n🎉 Gmail API setup complete!")
        print("📧 Email notifications are now enabled")
        print("🔄 The system will send alerts when traffic incidents change")
    else:
        print("\n❌ Gmail API setup failed")
        print("🔧 Please check the error messages above and try again")

if __name__ == "__main__":
    main()
