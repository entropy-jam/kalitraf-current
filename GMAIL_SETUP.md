# 📧 Gmail API Setup for Email Notifications

This guide will help you set up Gmail API credentials for email notifications when traffic incidents change.

## 🔧 Step 1: Create Gmail API Credentials

### 1.1 Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Name your project (e.g., "CHP Traffic Monitor")

### 1.2 Enable Gmail API
1. Go to **APIs & Services** → **Library**
2. Search for "Gmail API"
3. Click on it and press **Enable**

### 1.3 Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Choose **Desktop Application** as the application type
4. Name it "CHP Traffic Monitor"
5. Click **Create**

### 1.4 Download Credentials
1. Click the download button (⬇️) next to your new credentials
2. Save the file as `gmail_credentials.json` in your project root

## 🔐 Step 2: Set Up GitHub Secrets

### 2.1 Encode Credentials for GitHub
```bash
# Encode the credentials file to base64
base64 -i gmail_credentials.json -o gmail_credentials_base64.txt

# Copy the contents of gmail_credentials_base64.txt
cat gmail_credentials_base64.txt
```

### 2.2 Add GitHub Secrets
1. Go to your repository: https://github.com/entropy-jam/chp-scraper
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `GMAIL_CREDENTIALS` | `[base64 encoded credentials]` | Your Gmail API credentials |
| `GMAIL_SENDER_EMAIL` | `jacearnoldmail@gmail.com` | Sender email address |
| `GMAIL_RECIPIENT_EMAIL` | `jacearnoldmail@gmail.com` | Recipient email address |

## 🧪 Step 3: Test the Setup

### 3.1 Local Testing
```bash
# Install Gmail API dependencies
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client

# Run the setup script
python setup_gmail.py

# Test email notifications
python email_notifier.py
```

### 3.2 GitHub Actions Testing
1. Go to **Actions** tab in your repository
2. Run the workflow manually
3. Check the logs for email notification status
4. Check your email for test messages

## 📧 Step 4: Update GitHub Actions Workflow

The workflow will automatically use the secrets you added. The environment variables are already configured in the workflow file.

## 🔍 Step 5: Verify Email Notifications

### What You'll Receive:
- **Subject**: `🚨 CHP Traffic Alert - Border Center - X New Incidents`
- **Content**: HTML email with:
  - New incidents (green border)
  - Resolved incidents (red border)
  - Incident details (ID, time, type, location, area)
  - Link to live dashboard

### When You'll Get Emails:
- ✅ New traffic incidents appear
- ✅ Incidents are resolved/cleared
- ❌ No email if no changes detected
- ❌ No email if system is down

## 🛠️ Troubleshooting

### Common Issues:

1. **"Credentials file not found"**
   - Make sure `gmail_credentials.json` is in the project root
   - Check the file name and extension

2. **"Authentication failed"**
   - Delete `gmail_token.json` and run setup again
   - Check that Gmail API is enabled in Google Cloud Console

3. **"Failed to send email"**
   - Check that the sender email has Gmail API access
   - Verify the recipient email is correct
   - Check GitHub Actions logs for detailed error messages

4. **"No emails received"**
   - Check spam folder
   - Verify `ENABLE_EMAIL_NOTIFICATIONS=true` in workflow
   - Check that incidents are actually changing

### Debug Commands:
```bash
# Test email system locally
python email_notifier.py

# Check Gmail API setup
python setup_gmail.py

# Test scraper with email notifications
python chp_scraper.py --center BCCC --mode local
```

## 📊 Email Notification Features

- **Real-time alerts** when incidents change
- **Rich HTML formatting** with incident details
- **Color-coded incident types** (Traffic Hazard, Collision, etc.)
- **Direct links** to live dashboard
- **Automatic filtering** (only sends when changes occur)
- **Error handling** (graceful fallback if email fails)

## 🔒 Security Notes

- Credentials are stored as GitHub Secrets (encrypted)
- Gmail API uses OAuth 2.0 (secure authentication)
- Only sends emails when incidents actually change
- No sensitive data in email content (only public traffic info)

---

**🎉 Once set up, you'll receive email alerts whenever traffic incidents change!**
