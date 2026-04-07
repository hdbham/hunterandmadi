/**
 * Google Apps Script to receive RSVP form data and write to Google Sheets
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open Google Drive (drive.google.com)
 * 2. Create a new Google Sheet (name it "Wedding RSVPs" or similar)
 * 3. Click Extensions > Apps Script
 * 4. Delete the default code and paste this entire file
 * 5. Replace 'YOUR_SHEET_NAME' with your actual sheet name (or leave as default)
 * 6. Click the Save icon (or Ctrl+S / Cmd+S)
 * 7. Click Deploy > New deployment
 * 8. Click the gear icon next to "Select type" and choose "Web app"
 * 9. Set:
 *    - Description: "RSVP Form Handler"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 10. Click "Deploy"
 * 11. Copy the Web App URL (it will look like: https://script.google.com/macros/s/...)
 * 12. Replace 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE' in index.html with this URL
 * 13. Click "Authorize access" and grant permissions
 * 
 * The script will automatically create headers in the sheet on first run.
 */

/**
 * Handle GET requests (for testing/verification)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'RSVP Form Handler is active',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    // Parse the JSON data from the form
    const data = JSON.parse(e.postData.contents);
    
    // Get or create the spreadsheet
    const SPREADSHEET_ID = '1FIo0I4yuqImu3scbJRxmPEKOiDj8qISwsfl1LtCcK2A';
    const SHEET_NAME = 'RSVPs'; // Change this to your sheet name if different
    
    let spreadsheet;
    spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Get or create the sheet
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      // Add headers
      const headers = [
        'Timestamp',
        'Contact Email',
        'Contact Phone',
        'Ceremony Attendance',
        'Attendee Name',
        'Attendee Email',
        'Attendee Phone',
        'Dietary Restrictions',
        'Interested in Overnight',
        'Arrival Interest',
        'Sleeping Interest',
        'Packing List',
        'Song Requests',
        'Comments'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.getRange(1, 1, 1, headers.length).setBackground('#344c12');
      sheet.getRange(1, 1, 1, headers.length).setFontColor('#FFBB88');
    }
    
    // Write one row per attendee
    const attendees = data.attendees || [];
    const timestamp = data.timestamp || new Date().toISOString();
    const contactEmail = data.contact?.email || '';
    const contactPhone = data.contact?.phone || '';
    const ceremony = data.ceremony || '';
    const songRequests = data.additional?.song_requests || '';
    const comments = data.additional?.comments || '';
    
    if (attendees.length === 0) {
      const row = [
        timestamp,
        contactEmail,
        contactPhone,
        ceremony,
        '', '', '', '', '', '', '', '', '', ''
      ];
      sheet.appendRow(row);
    } else {
      // Write one row per attendee
      attendees.forEach((attendee, index) => {
        const arrivalVal = attendee.arrival || '';
        const isInterestedOvernight = (arrivalVal && arrivalVal !== 'Not staying overnight') || !!attendee.sleeping;
        
        const row = [
          timestamp,
          contactEmail,
          contactPhone,
          ceremony,
          attendee.name || '',
          attendee.email || '',
          attendee.phone || '',
          attendee.dietary_restrictions || '',
          isInterestedOvernight ? 'Yes' : 'No',
          attendee.arrival || '',
          attendee.sleeping || '',
          attendee.packing_list || '',
          index === 0 ? songRequests : '', // Only include once
          index === 0 ? comments : '' // Only include once
        ];
        
        sheet.appendRow(row);
      });
    }
    
    // Send confirmation email receipt if email is provided
    if (contactEmail && contactEmail.trim() !== '') {
      try {
        sendReceiptEmail(data, contactEmail);
      } catch (emailError) {
        // Log error but don't fail the submission
        Logger.log('Error sending receipt email: ' + emailError.toString());
      }
    }
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'RSVP submitted successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Test function - run this to set up the sheet with headers
 */
function setupSheet() {
  const SPREADSHEET_ID = '1FIo0I4yuqImu3scbJRxmPEKOiDj8qISwsfl1LtCcK2A';
  const SHEET_NAME = 'RSVPs';
  
  let spreadsheet;
  if (SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE') {
    spreadsheet = SpreadsheetApp.create('Wedding RSVPs');
    Logger.log('Created new spreadsheet: ' + spreadsheet.getUrl());
  } else {
    spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }
  
  const headers = [
    'Timestamp',
    'Contact Email',
    'Contact Phone',
    'Ceremony Attendance',
    'Attendee Name',
    'Attendee Email',
    'Attendee Phone',
    'Dietary Restrictions',
    'Interested in Overnight',
    'Arrival Interest',
    'Sleeping Interest',
    'Packing List',
    'Song Requests',
    'Comments'
  ];
  
  // Only overwrite the header row — never touch data rows
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#344c12');
  headerRange.setFontColor('#FFBB88');
  
  Logger.log('Header row written (' + sheet.getLastRow() + ' total rows).');
  Logger.log('Spreadsheet URL: ' + spreadsheet.getUrl());
}

/**
 * Escape user-supplied text for safe inclusion in HTML email.
 */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Send confirmation email receipt with all selections
 */
function sendReceiptEmail(data, recipientEmail) {
  const ceremony = escHtml(data.ceremony) || 'Not specified';
  const attendees = data.attendees || [];
  const songRequests = escHtml(data.additional?.song_requests || '');
  const comments = escHtml(data.additional?.comments || '');
  const timestamp = data.timestamp || new Date().toISOString();
  const submissionDate = new Date(timestamp).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Build email subject
  const subject = 'RSVP Confirmation — Madi & Hunter Wedding';
  
  // Build email body HTML
  let htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #344c12;
          color: #FFBB88;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 20px;
          border: 2px solid #344c12;
        }
        .section {
          margin-bottom: 20px;
          padding: 15px;
          background-color: white;
          border-left: 4px solid #FFBB88;
          border-radius: 4px;
        }
        .section-title {
          font-weight: bold;
          color: #344c12;
          font-size: 1.1em;
          margin-bottom: 10px;
        }
        .attendee-info {
          margin-bottom: 15px;
          padding: 10px;
          background-color: #f5f5f5;
          border-radius: 4px;
        }
        .label {
          font-weight: bold;
          color: #344c12;
        }
        .value {
          margin-left: 10px;
          color: #666;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #666;
          font-size: 0.9em;
        }
        .no-info {
          color: #999;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>RSVP Confirmation</h1>
        <p>Thank you for your RSVP!</p>
      </div>
      <div class="content">
        <div class="section">
          <div class="section-title">Submission Details</div>
          <p><span class="label">Submitted:</span> <span class="value">${submissionDate}</span></p>
        </div>
        
        <div class="section">
          <div class="section-title">Ceremony Attendance</div>
          <p><span class="label">Will you be attending?</span> <span class="value">${ceremony}</span></p>
        </div>
  `;
  
  // Add attendee information
  if (attendees.length > 0) {
    htmlBody += `
        <div class="section">
          <div class="section-title">Attendee Information</div>
    `;
    
    attendees.forEach((attendee, index) => {
      const name = escHtml(attendee.name) || 'Not provided';
      const email = escHtml(attendee.email) || 'Not provided';
      const phone = escHtml(attendee.phone) || 'Not provided';

      htmlBody += `
          <div class="attendee-info">
            <div class="section-title">Attendee ${index + 1}</div>
            <p><span class="label">Name:</span> <span class="value">${name}</span></p>
            <p><span class="label">Email:</span> <span class="value">${email}</span></p>
            <p><span class="label">Phone:</span> <span class="value">${phone}</span></p>
      `;
      
      if (attendee.dietary_restrictions) {
        htmlBody += `
            <p><span class="label">Dietary Restrictions:</span> <span class="value">${escHtml(attendee.dietary_restrictions)}</span></p>
        `;
      }
      
      const arrVal = attendee.arrival || '';
      const isInterestedOvernight = (arrVal && arrVal !== 'Not staying overnight') || !!attendee.sleeping;
      if (isInterestedOvernight) {
        htmlBody += `
            <p><span class="label">Interested in Overnight:</span> <span class="value">Yes</span></p>
            ${arrVal ? `<p><span class="label">Arrival Interest:</span> <span class="value">${escHtml(arrVal)}</span></p>` : ''}
            ${attendee.sleeping ? `<p><span class="label">Sleeping Interest:</span> <span class="value">${escHtml(attendee.sleeping)}</span></p>` : ''}
            ${attendee.packing_list ? `<p><span class="label">Packing List Requested:</span> <span class="value">${escHtml(attendee.packing_list)}</span></p>` : ''}
        `;
      }
      
      htmlBody += `
          </div>
      `;
    });
    
    htmlBody += `
        </div>
    `;
  }
  
  // Add additional information
  if (songRequests || comments) {
    htmlBody += `
        <div class="section">
          <div class="section-title">Additional Information</div>
    `;
    
    if (songRequests) {
      htmlBody += `
          <p><span class="label">Song Requests:</span> <span class="value">${songRequests}</span></p>
      `;
    }
    
    if (comments) {
      htmlBody += `
          <p><span class="label">Comments:</span> <span class="value">${comments}</span></p>
      `;
    }
    
    htmlBody += `
        </div>
    `;
  }
  
  htmlBody += `
        <div class="section">
          <p>We're so excited to celebrate with you! If you need to make any changes to your RSVP, please contact us at <a href="mailto:hunterandmadi9496@gmail.com">hunterandmadi9496@gmail.com</a> or call Madi at 801-458-2972.</p>
        </div>
      </div>
      <div class="footer">
        <p>This is an automated confirmation email. Please save this for your records.</p>
        <p>Madi & Hunter Wedding<br>September 19, 2026</p>
      </div>
    </body>
    </html>
  `;
  
  // Send email
  MailApp.sendEmail({
    to: recipientEmail,
    subject: subject,
    htmlBody: htmlBody
  });
  
  Logger.log('Receipt email sent to: ' + recipientEmail);
}

