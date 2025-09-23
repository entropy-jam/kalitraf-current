# CHP Traffic Incident Scraper

A Python-based traffic incident scraper for California Highway Patrol (CHP) data with GitHub Actions automation and GitHub Pages visualization.

## Features

- 🚨 **Real-time Scraping**: Scrapes CHP traffic incidents every minute
- 📊 **Multiple Centers**: Support for Border, Central, Northern, and Southern communication centers
- 🔄 **Change Detection**: Tracks changes between scrapes and reports differences
- 📁 **JSON Output**: Saves active incidents and daily historical data
- 🌐 **GitHub Pages**: Live visualization with auto-refresh
- ⚡ **Manual Triggers**: API-based manual scraping via GitHub Actions
- 🔒 **Secure**: Uses GitHub's built-in token system

## Quick Start

### Local Development

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run Scraper**
   ```bash
   # Default: Border center, 10 iterations, 60-second intervals
   python chp_scraper.py
   
   # Custom center and settings
   python chp_scraper.py --center CCC --iterations 5 --interval 30
   ```

3. **GitHub Actions Mode** (for testing)
   ```bash
   python chp_scraper.py --mode github_actions --center BCCC
   ```

### GitHub Actions Setup

1. **Enable GitHub Actions**
   - Go to your repository Settings → Actions → General
   - Enable "Allow all actions and reusable workflows"

2. **Enable GitHub Pages**
   - Go to Settings → Pages
   - Source: "GitHub Actions"
   - The workflow will automatically deploy

3. **Manual Trigger**
   ```bash
   # Set up environment variables
   export GITHUB_TOKEN="your_personal_access_token"
   export GITHUB_REPOSITORY_OWNER="your_username"
   export GITHUB_REPOSITORY_NAME="your_repo_name"
   
   # Trigger scrape
   python trigger_scrape.py --center BCCC
   ```

## File Structure

```
├── .github/workflows/
│   ├── traffic-scraper.yml    # Main scraping workflow
│   └── pages.yml              # GitHub Pages deployment
├── data/                      # Historical data (auto-created)
│   └── YYYY-MM-DD_incidents.json
├── chp_scraper.py            # Main scraper script
├── trigger_scrape.py         # Manual trigger script
├── requirements.txt          # Python dependencies
├── index.html               # GitHub Pages frontend
├── active_incidents.json    # Current incidents (auto-generated)
└── README.md               # This file
```

## JSON Data Format

### active_incidents.json
```json
{
  "center": "BCCC",
  "center_name": "Border",
  "last_updated": "2025-09-22T21:00:00Z",
  "incident_count": 12,
  "incidents": [
    {
      "id": "0270",
      "time": "5:55 PM",
      "type": "Traffic Hazard",
      "location": "I15 N / Valley No",
      "location_desc": "I15 N VALLEY NO",
      "area": "North FSP",
      "scraped_at": "2025-09-22T21:00:00Z",
      "center": "BCCC"
    }
  ]
}
```

### Daily Historical Data (data/YYYY-MM-DD_incidents.json)
```json
{
  "center": "BCCC",
  "center_name": "Border",
  "date": "2025-09-22",
  "last_updated": "2025-09-22T21:00:00Z",
  "total_incidents": 45,
  "new_incidents_today": 3,
  "incidents": [...]
}
```

## Command Line Options

### chp_scraper.py
```bash
python chp_scraper.py [OPTIONS]

Options:
  -c, --center {BCCC,CCC,NCCC,SCCC}  Communication center (default: BCCC)
  -m, --mode {local,github_actions}   Run mode (default: local)
  -i, --iterations INTEGER            Number of iterations (default: 10)
  -t, --interval INTEGER              Interval between scrapes in seconds (default: 60)
  -h, --help                          Show help message
```

### trigger_scrape.py
```bash
python trigger_scrape.py [OPTIONS]

Options:
  -c, --center {BCCC,CCC,NCCC,SCCC}  Communication center (default: BCCC)
  -t, --token TEXT                   GitHub personal access token
  -o, --owner TEXT                   Repository owner
  -r, --repo TEXT                    Repository name
  -h, --help                         Show help message
```

## GitHub Actions Workflow

The workflow runs:
- **Every minute** (cron: '* * * * *')
- **Manual trigger** with center selection
- **API trigger** via repository_dispatch

### Workflow Features
- ✅ Automatic ChromeDriver installation
- ✅ Dependency caching for faster runs
- ✅ Error handling and notifications
- ✅ Secure token-based commits
- ✅ Only commits when data changes

## GitHub Pages Frontend

The frontend provides:
- 📊 **Live Data Display**: Shows current incidents with auto-refresh
- 🎛️ **Center Selection**: Switch between communication centers
- ⚡ **Manual Triggers**: Trigger scrapes via GitHub API
- 📱 **Responsive Design**: Works on desktop and mobile
- 🔄 **Auto-refresh**: Updates every 30 seconds

### Frontend Setup
1. Update `index.html` with your repository details:
   ```javascript
   // Replace these with your actual values
   'YOUR_USERNAME/YOUR_REPO'
   'YOUR_GITHUB_TOKEN'
   ```

2. The page will automatically load data from `active_incidents.json`

## Environment Variables

### For GitHub Actions
- `GITHUB_TOKEN`: Automatically provided by GitHub
- `COMMUNICATION_CENTER`: Set by workflow inputs
- `SCRAPER_MODE`: Set to "github_actions"

### For Local Development
- `GITHUB_TOKEN`: Your personal access token (for manual triggers)
- `GITHUB_REPOSITORY_OWNER`: Your username or organization
- `GITHUB_REPOSITORY_NAME`: Your repository name

## Troubleshooting

### Common Issues

1. **ChromeDriver Errors**
   - The workflow automatically installs the correct ChromeDriver version
   - For local development, ensure Chrome is installed

2. **GitHub Actions Failures**
   - Check the Actions tab for detailed logs
   - Ensure your repository has the correct permissions

3. **No Data on GitHub Pages**
   - Verify the workflow has run successfully
   - Check that `active_incidents.json` exists in the repository root

4. **Manual Trigger Not Working**
   - Verify your GitHub token has the correct permissions
   - Check that the repository_dispatch event is enabled

### Debug Mode
```bash
# Run with verbose logging
python chp_scraper.py --center BCCC --iterations 1
# Check chp_scraper_debug.log for detailed logs
```

## Cost Considerations

This setup is designed for **free-tier usage**:
- ✅ GitHub Actions: 2,000 minutes/month (free)
- ✅ GitHub Pages: Unlimited (free)
- ✅ Repository: Public (free)
- ✅ Storage: Minimal JSON files

**Estimated Usage**: ~1,440 minutes/month (1 minute × 24 hours × 30 days)

## Security Notes

- 🔒 Uses GitHub's built-in `GITHUB_TOKEN` for secure commits
- 🔒 No hardcoded credentials in the code
- 🔒 Personal access tokens only needed for manual triggers
- 🔒 All data is public (suitable for traffic incident data)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally and with GitHub Actions
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
