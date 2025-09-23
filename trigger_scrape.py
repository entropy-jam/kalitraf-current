#!/usr/bin/env python3
"""
Script to manually trigger GitHub Actions workflow for scraping
"""
import requests
import json
import sys
import os
from datetime import datetime

def trigger_scrape(center='BCCC', github_token=None, repo_owner=None, repo_name=None):
    """Trigger GitHub Actions workflow for scraping"""
    
    if not github_token:
        github_token = os.getenv('GITHUB_TOKEN')
    
    if not github_token:
        print("❌ Error: GitHub token not provided")
        print("Set GITHUB_TOKEN environment variable or pass as argument")
        return False
    
    if not repo_owner or not repo_name:
        print("❌ Error: Repository owner and name not provided")
        return False
    
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/dispatches"
    
    headers = {
        'Authorization': f'token {github_token}',
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    payload = {
        'event_type': 'manual-scrape',
        'client_payload': {
            'communication_center': center,
            'triggered_by': 'manual_api_call',
            'timestamp': datetime.now().isoformat()
        }
    }
    
    try:
        print(f"🚀 Triggering scrape for {center} center...")
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        
        if response.status_code == 204:
            print("✅ Scrape triggered successfully!")
            print(f"📊 Center: {center}")
            print(f"⏰ Triggered at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print("🔄 Check the Actions tab in your repository for progress")
            return True
        else:
            print(f"❌ Failed to trigger scrape: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error triggering scrape: {e}")
        return False

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Trigger CHP Traffic Scraper')
    parser.add_argument('--center', '-c', 
                       choices=['BCCC', 'CCC', 'NCCC', 'SCCC'],
                       default='BCCC',
                       help='Communication center to scrape (default: BCCC)')
    parser.add_argument('--token', '-t',
                       help='GitHub personal access token')
    parser.add_argument('--owner', '-o',
                       help='Repository owner (username or organization)')
    parser.add_argument('--repo', '-r',
                       help='Repository name')
    
    args = parser.parse_args()
    
    # Try to get from environment if not provided
    repo_owner = args.owner or os.getenv('GITHUB_REPOSITORY_OWNER')
    repo_name = args.repo or os.getenv('GITHUB_REPOSITORY_NAME')
    
    if not repo_owner or not repo_name:
        print("❌ Error: Repository owner and name required")
        print("Set GITHUB_REPOSITORY_OWNER and GITHUB_REPOSITORY_NAME environment variables")
        print("Or use --owner and --repo arguments")
        sys.exit(1)
    
    success = trigger_scrape(
        center=args.center,
        github_token=args.token,
        repo_owner=repo_owner,
        repo_name=repo_name
    )
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
