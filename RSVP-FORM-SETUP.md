# RSVP Form Setup Guide

This guide will help you set up the custom RSVP form that submits directly to Google Sheets.

## Overview

The form is already integrated into your website. You just need to:
1. Create a Google Sheet to store responses
2. Set up a Google Apps Script to receive form data
3. Connect the form to the script

## Step-by-Step Setup

### Step 1: Create a Google Sheet

1. Go to [Google Drive](https://drive.google.com)
2. Click **New** > **Google Sheets**
3. Name it "Wedding RSVPs" (or any name you prefer)
4. Keep this tab open - you'll need it later

### Step 2: Set Up Google Apps Script

1. In your Google Sheet, click **Extensions** > **Apps Script**
2. A new tab will open with the Apps Script editor
3. Delete any default code
4. Copy the entire contents of `google-apps-script-rsvp.gs` file
5. Paste it into the Apps Script editor
6. **Important**: Find this line in the code:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
   ```
7. Get your spreadsheet ID from the URL:
   - Your sheet URL looks like: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - Copy the `SPREADSHEET_ID` part
   - Replace `'YOUR_SPREADSHEET_ID_HERE'` with your actual spreadsheet ID (keep the quotes)
8. Click the **Save** icon (or press Ctrl+S / Cmd+S)
9. Name your project (e.g., "RSVP Form Handler")

### Step 3: Deploy as Web App

1. In the Apps Script editor, click **Deploy** > **New deployment**
2. Click the gear icon (⚙️) next to "Select type"
3. Choose **Web app**
4. Fill in the deployment settings:
   - **Description**: "RSVP Form Handler" (or any description)
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone** (important for the form to work)
5. Click **Deploy**
6. **First time only**: Click **Authorize access**
   - You'll be asked to sign in with your Google account
   - Click **Advanced** > **Go to [Project Name] (unsafe)**
   - Click **Allow** to grant permissions
7. Copy the **Web App URL** (it looks like: `https://script.google.com/macros/s/...`)
   - This is your script URL - you'll need it in the next step

### Step 4: Connect Form to Script

1. Open `index.html` in your code editor
2. Find this line (around line 2117):
   ```javascript
   const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```
3. Replace `'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'` with your Web App URL from Step 3
   - Keep the quotes around the URL
   - Example: `const SCRIPT_URL = 'https://script.google.com/macros/s/ABC123/exec';`
4. Save the file

### Step 5: Test the Form

1. Open your website
2. Navigate to the RSVP page
3. Fill out the form
4. Submit it
5. Check your Google Sheet - you should see the data appear!

## Optional: Set Up Sheet Headers Manually

If you want to set up the sheet headers before receiving any submissions:

1. In the Apps Script editor, click **Run** > **setupSheet**
2. Click **Authorize access** if prompted
3. The sheet will be created with formatted headers

## Troubleshooting

### Form submits but data doesn't appear in sheet

1. Check that the spreadsheet ID in the script matches your sheet
2. Make sure "Who has access" is set to "Anyone" in the deployment
3. Check the Apps Script execution log: **View** > **Executions**

### "Authorization required" error

1. Make sure you've authorized the script (Step 3, step 6)
2. Try redeploying: **Deploy** > **Manage deployments** > **Edit** > **Deploy**

### Form shows error message

1. Check browser console (F12) for errors
2. Verify the SCRIPT_URL in index.html is correct
3. Make sure the script is deployed and accessible

### Can't find spreadsheet ID

The spreadsheet ID is in the URL:
- URL: `https://docs.google.com/spreadsheets/d/1ABC123xyz/edit`
- ID: `1ABC123xyz` (the part between `/d/` and `/edit`)

## Form Features

✅ **Conditional Logic**: Questions show/hide based on previous answers
✅ **Direct to Google Sheets**: No third-party services needed
✅ **Matches Your Site Design**: Styled to match your wedding website
✅ **Mobile Friendly**: Works great on phones and tablets
✅ **Free**: No costs or subscriptions

## Data Collected

The form collects:
- Basic info (names, email, phone)
- Overnight stay details (if staying)
- Ceremony attendance
- Additional guests
- Meal preferences and dietary restrictions
- Song requests
- Comments/well wishes

All data is timestamped and organized in columns in your Google Sheet.

## Need Help?

If you run into issues:
1. Check the Apps Script execution log
2. Verify all URLs and IDs are correct
3. Make sure permissions are set correctly
4. Test with a simple submission first

