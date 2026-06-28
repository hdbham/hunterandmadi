/**
 * Google Apps Script to receive RSVP form data and write to Google Sheets
 *
 * DEPLOY / UPDATE INSTRUCTIONS:
 * 1. Open the spreadsheet (https://docs.google.com/spreadsheets/d/1FIo0I4yuqImu3scbJRxmPEKOiDj8qISwsfl1LtCcK2A/edit)
 * 2. Extensions > Apps Script
 * 3. Replace ALL existing code with this file, then Save (Cmd/Ctrl+S)
 * 4. Run setupSheet() once to refresh the header row (this is now NON-destructive
 *    — it only rewrites row 1 and never clears data)
 * 5. Deploy > Manage deployments > edit (pencil) the existing Web App deployment
 *    > Version: New version > Deploy. This keeps the same /exec URL the site uses.
 *
 * The "Mailing Address" column (column P) holds the address for physical
 * invitations. The frontend sends it as `mailing_address`; we also fall back to
 * the legacy `packing_list` key so older cached clients keep working.
 */

// Single source of truth for the sheet layout. Order matters: rows are written
// by column position, so do not reorder existing columns — only append.
const RSVP_HEADERS = [
  'Timestamp',
  'Contact Email',
  'Contact Phone',
  'Ceremony Attendance',
  'Attendee Name',
  'Attendee Email',
  'Attendee Phone',
  'Emergency Contact Name',
  'Emergency Contact Phone',
  'Dietary Restrictions',
  'Allergies',
  'Accessibility Needs',
  'Staying Overnight',
  'Arrival Time',
  'Sleeping Arrangement',
  'Mailing Address',
  'Meal Preference',
  'Song Requests',
  'Comments'
];

const SPREADSHEET_ID = '1FIo0I4yuqImu3scbJRxmPEKOiDj8qISwsfl1LtCcK2A';
const SHEET_NAME = 'RSVPs';

// Couple's inbox — a copy of every RSVP record is sent here.
const NOTIFY_EMAIL = 'hunterandmadi9496@gmail.com';

/**
 * Handle GET requests (for testing/verification)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'RSVP Form Handler is active',
    timestamp: new Date().toISOString(),
    spreadsheetId: SPREADSHEET_ID
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    // Parse the JSON data from the form
    const data = JSON.parse(e.postData.contents);

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Get or create the sheet (write headers only when first created)
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      writeHeaderRow(sheet);
    }

    // Write one row per attendee
    const attendees = data.attendees || [];
    const timestamp = data.timestamp || new Date().toISOString();
    const contactEmail = data.contact && data.contact.email ? data.contact.email : '';
    const contactPhone = data.contact && data.contact.phone ? data.contact.phone : '';
    const ceremony = data.ceremony || '';
    const songRequests = (data.additional && data.additional.song_requests) || '';
    const comments = (data.additional && data.additional.comments) || '';
    // Household mailing address for the paper invite. Prefer the dedicated field;
    // fall back to the legacy packing_list key used by older clients.
    const mailingAddress = (
      data.mailing_address ||
      (attendees[0] && attendees[0].packing_list) ||
      ''
    ).toString().trim();

    if (attendees.length === 0) {
      // No attendees - just write contact info
      const row = [
        timestamp,
        contactEmail,
        contactPhone,
        ceremony,
        '', '', '', '', '', '', '', '', '', '',
        mailingAddress, // Mailing Address (column P)
        '', '', ''
      ];
      sheet.appendRow(row);
    } else {
      // Write one row per attendee
      attendees.forEach((attendee, index) => {
        // Staying overnight if any overnight detail is present
        const isStayingOvernight = !!(attendee.arrival || attendee.sleeping);

        const row = [
          timestamp,
          contactEmail,
          contactPhone,
          ceremony,
          attendee.name || '',
          attendee.email || '',
          attendee.phone || '',
          attendee.emergency_contact_name || '',
          attendee.emergency_contact_phone || '',
          attendee.dietary_restrictions || '',
          attendee.allergies || '',
          attendee.accessibility || '',
          isStayingOvernight ? 'Yes' : 'No',
          attendee.arrival || '',
          attendee.sleeping || '',
          index === 0 ? mailingAddress : '', // Mailing Address — household, on first row only
          attendee.meals || '',
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

    // Always notify the couple with a copy of the record
    try {
      sendNotificationEmail(data);
    } catch (notifyError) {
      // Log error but don't fail the submission
      Logger.log('Error sending notification email: ' + notifyError.toString());
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
 * Write/refresh the formatted header row. Does NOT touch data rows.
 */
function writeHeaderRow(sheet) {
  const range = sheet.getRange(1, 1, 1, RSVP_HEADERS.length);
  range.setValues([RSVP_HEADERS]);
  range.setFontWeight('bold');
  range.setBackground('#344c12');
  range.setFontColor('#FFBB88');
}

/**
 * Run this once after deploying to refresh the header row.
 * SAFE: only overwrites row 1 — it never clears or shifts your data.
 */
function setupSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }
  writeHeaderRow(sheet);
  Logger.log('Header row refreshed (' + sheet.getLastRow() + ' total rows, data untouched).');
  Logger.log('Spreadsheet URL: ' + spreadsheet.getUrl());
}

/**
 * Send the guest their confirmation receipt.
 */
function sendReceiptEmail(data, recipientEmail) {
  MailApp.sendEmail({
    to: recipientEmail,
    subject: 'RSVP Confirmation - Hunter & Madi Wedding',
    htmlBody: buildRsvpHtml(data, 'RSVP Confirmation', 'Thank you for your RSVP!')
  });
  Logger.log('Receipt email sent to: ' + recipientEmail);
}

/**
 * Send the couple a copy of the record for every submission.
 */
function sendNotificationEmail(data) {
  const attendees = data.attendees || [];
  const names = attendees.map(function (a) { return a.name; }).filter(Boolean).join(', ');
  const who = names || ((data.contact && data.contact.email) || 'someone');
  const attending = (data.ceremony === 'No') ? 'Regrets' : 'Attending';
  const subject = 'New RSVP (' + attending + '): ' + who;
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: subject,
    htmlBody: buildRsvpHtml(data, 'New RSVP Received', who)
  });
  Logger.log('Notification email sent to: ' + NOTIFY_EMAIL);
}

/**
 * Build the shared RSVP record HTML used by both the guest receipt and the
 * couple's notification.
 */
function buildRsvpHtml(data, heading, subheading) {
  const ceremony = data.ceremony || 'Not specified';
  const attendees = data.attendees || [];
  const songRequests = (data.additional && data.additional.song_requests) || '';
  const comments = (data.additional && data.additional.comments) || '';
  const mailingAddress = (
    data.mailing_address ||
    (attendees[0] && attendees[0].packing_list) ||
    ''
  ).toString().trim();
  const timestamp = data.timestamp || new Date().toISOString();
  const submissionDate = new Date(timestamp).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

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
        <h1>${escHtml(heading)}</h1>
        <p>${escHtml(subheading)}</p>
      </div>
      <div class="content">
        <div class="section">
          <div class="section-title">Submission Details</div>
          <p><span class="label">Submitted:</span> <span class="value">${submissionDate}</span></p>
        </div>

        <div class="section">
          <div class="section-title">Ceremony Attendance</div>
          <p><span class="label">Will you be attending?</span> <span class="value">${escHtml(ceremony)}</span></p>
        </div>
  `;

  // Add attendee information
  if (attendees.length > 0) {
    htmlBody += `
        <div class="section">
          <div class="section-title">Attendee Information</div>
    `;

    attendees.forEach((attendee, index) => {
      htmlBody += `
          <div class="attendee-info">
            <div class="section-title">Attendee ${index + 1}</div>
            <p><span class="label">Name:</span> <span class="value">${escHtml(attendee.name) || 'Not provided'}</span></p>
            <p><span class="label">Email:</span> <span class="value">${escHtml(attendee.email) || 'Not provided'}</span></p>
            <p><span class="label">Phone:</span> <span class="value">${escHtml(attendee.phone) || 'Not provided'}</span></p>
      `;

      if (attendee.dietary_restrictions) {
        htmlBody += `
            <p><span class="label">Dietary Restrictions:</span> <span class="value">${escHtml(attendee.dietary_restrictions)}</span></p>
        `;
      }

      const isStayingOvernight = !!(attendee.arrival || attendee.sleeping);
      if (isStayingOvernight) {
        htmlBody += `
            <p><span class="label">Staying Overnight:</span> <span class="value">Yes</span></p>
            ${attendee.arrival ? `<p><span class="label">Arrival Time:</span> <span class="value">${escHtml(attendee.arrival)}</span></p>` : ''}
            ${attendee.sleeping ? `<p><span class="label">Sleeping Arrangement:</span> <span class="value">${escHtml(attendee.sleeping)}</span></p>` : ''}
        `;
      }

      if (attendee.meals) {
        htmlBody += `
            <p><span class="label">Meal Preference:</span> <span class="value">${escHtml(attendee.meals)}</span></p>
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

  // Mailing address (for the physical invitation)
  if (mailingAddress) {
    htmlBody += `
        <div class="section">
          <div class="section-title">Mailing Address</div>
          <p><span class="value">${escHtml(mailingAddress).replace(/\n/g, '<br>')}</span></p>
          <p class="no-info">We'll use this to send your physical invitation.</p>
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
          <p><span class="label">Song Requests:</span> <span class="value">${escHtml(songRequests)}</span></p>
      `;
    }

    if (comments) {
      htmlBody += `
          <p><span class="label">Comments:</span> <span class="value">${escHtml(comments)}</span></p>
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
        <p>Hunter & Madi Wedding<br>September 18-20, 2026</p>
      </div>
    </body>
    </html>
  `;

  return htmlBody;
}

/**
 * Escape user-supplied text for safe inclusion in HTML email.
 */
function escHtml(text) {
  if (text === null || text === undefined) return '';
  return text.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
