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
// Default header row, only used when the sheet is created from scratch. For an
// existing sheet we read its actual headers and write by name, so column ORDER
// here does not matter — values are matched to whatever columns the sheet has.
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
  'Health Information',
  'Staying Overnight',
  'Arrival Time',
  'Sleeping Arrangement',
  'Packing List',
  'Meal Preference',
  'Song Requests',
  'Comments',
  'Mailing Address'
];

// The column that must always exist for physical invitations.
const MAILING_ADDRESS_HEADER = 'Mailing Address';

const SPREADSHEET_ID = '1FIo0I4yuqImu3scbJRxmPEKOiDj8qISwsfl1LtCcK2A';
const SHEET_NAME = 'RSVPs';

// Couple's inbox — a copy of every RSVP record is sent here.
const NOTIFY_EMAIL = 'hunterandmadi9496@gmail.com';

// ---- Event details (edit these if the time/venue changes) ----
const EVENT_TITLE = "Madi & Hunter's Wedding";
const EVENT_WHEN = 'Saturday, September 19, 2026 · 4:00 PM';
const EVENT_VENUE = 'YMCA Camp Mill Hollow';
const EVENT_ADDRESS = '7480 S Mill Hollow Rd, Kamas, UT 84036';
const EVENT_START = '20260919T160000'; // 4:00 PM, local
const EVENT_END = '20260919T210000';   // 9:00 PM, local
const EVENT_TZ = 'America/Denver';     // Mountain Time (Utah)
const EVENT_DETAILS = "We can't wait to celebrate with you — ceremony and reception at YMCA Camp Mill Hollow.";

/**
 * Build a Google Calendar "add event" link with the wedding time + address.
 */
function googleCalendarUrl() {
  const params = [
    'action=TEMPLATE',
    'text=' + encodeURIComponent(EVENT_TITLE),
    'dates=' + EVENT_START + '/' + EVENT_END,
    'ctz=' + encodeURIComponent(EVENT_TZ),
    'location=' + encodeURIComponent(EVENT_VENUE + ', ' + EVENT_ADDRESS),
    'details=' + encodeURIComponent(EVENT_DETAILS)
  ];
  return 'https://calendar.google.com/calendar/render?' + params.join('&');
}

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

    // Make sure the Mailing Address column exists, then read the sheet's ACTUAL
    // header order so we can write each value to the right column by name.
    ensureColumn(sheet, MAILING_ADDRESS_HEADER);
    const headers = getHeaders(sheet);

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

    // Build a row that matches the sheet's real header order. Fields that only
    // belong on the first row (household-level) are blank for index > 0.
    function rowFor(attendee, index) {
      const a = attendee || {};
      const isStayingOvernight = !!(a.arrival || a.sleeping);
      const byHeader = {
        'Timestamp': timestamp,
        'Contact Email': contactEmail,
        'Contact Phone': contactPhone,
        'Ceremony Attendance': ceremony,
        'Attendee Name': a.name || '',
        'Attendee Email': a.email || '',
        'Attendee Phone': a.phone || '',
        'Emergency Contact Name': a.emergency_contact_name || '',
        'Emergency Contact Phone': a.emergency_contact_phone || '',
        'Dietary Restrictions': a.dietary_restrictions || '',
        'Health Information': a.health_information || a.health || a.allergies || a.accessibility || '',
        'Allergies': a.allergies || '',
        'Accessibility Needs': a.accessibility || '',
        'Staying Overnight': isStayingOvernight ? 'Yes' : 'No',
        'Arrival Time': a.arrival || '',
        'Sleeping Arrangement': a.sleeping || '',
        'Packing List': a.packing_list || '',
        'Meal Preference': a.meals || '',
        'Song Requests': index === 0 ? songRequests : '',
        'Comments': index === 0 ? comments : '',
        'Mailing Address': index === 0 ? mailingAddress : ''
      };
      return headers.map(function (h) {
        return Object.prototype.hasOwnProperty.call(byHeader, h) ? byHeader[h] : '';
      });
    }

    if (attendees.length === 0) {
      // No attendees (declined) - just contact info + household fields
      sheet.appendRow(rowFor({}, 0));
    } else {
      attendees.forEach(function (attendee, index) {
        sheet.appendRow(rowFor(attendee, index));
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
 * Write the default header row for a brand-new sheet. Only used at creation.
 */
function writeHeaderRow(sheet) {
  const range = sheet.getRange(1, 1, 1, RSVP_HEADERS.length);
  range.setValues([RSVP_HEADERS]);
  range.setFontWeight('bold');
  range.setBackground('#344c12');
  range.setFontColor('#FFBB88');
}

/**
 * Read the sheet's current header row (row 1), trimmed.
 */
function getHeaders(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
    return String(h).trim();
  });
}

/**
 * Ensure a column with the given header exists. If missing, append it as a new
 * column at the end. NEVER reorders or relabels existing columns or data.
 */
function ensureColumn(sheet, header) {
  const headers = getHeaders(sheet);
  if (headers.indexOf(header) !== -1) return;
  const col = headers.length + 1;
  const cell = sheet.getRange(1, col);
  cell.setValue(header);
  cell.setFontWeight('bold');
  cell.setBackground('#344c12');
  cell.setFontColor('#FFBB88');
}

/**
 * Run once after deploying. SAFE: only adds the Mailing Address column if it's
 * missing — it never clears, reorders, or relabels existing columns or data.
 */
function setupSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    writeHeaderRow(sheet);
  }
  ensureColumn(sheet, MAILING_ADDRESS_HEADER);
  Logger.log('Ensured "' + MAILING_ADDRESS_HEADER + '" column. Current headers: ' + getHeaders(sheet).join(' | '));
}

/**
 * Run this once from the editor to (a) trigger the Gmail authorization prompt
 * and (b) confirm email actually sends. Sends both a sample receipt and a
 * sample couple-notification using fake data. Check both inboxes (and spam).
 */
function testEmail() {
  const sample = {
    ceremony: 'Yes',
    timestamp: new Date().toISOString(),
    contact: { email: NOTIFY_EMAIL, phone: '8014582972' },
    mailing_address: 'TEST 742 Evergreen Terrace, Kamas, UT 84036',
    additional: { song_requests: 'TEST song', comments: 'TEST comment' },
    attendees: [{ name: 'TEST Guest', email: NOTIFY_EMAIL, phone: '8014582972' }]
  };
  sendReceiptEmail(sample, NOTIFY_EMAIL);   // sample receipt -> couple inbox
  sendNotificationEmail(sample);            // sample notification -> couple inbox
  Logger.log('testEmail finished. Check ' + NOTIFY_EMAIL + ' (and Spam) for two messages.');
}

/**
 * Send the guest their confirmation receipt.
 */
function sendReceiptEmail(data, recipientEmail) {
  MailApp.sendEmail({
    to: recipientEmail,
    subject: 'RSVP Confirmation - Hunter & Madi Wedding',
    htmlBody: buildRsvpHtml(data, 'RSVP Confirmation', 'Thank you for your RSVP!', false)
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
    htmlBody: buildRsvpHtml(data, 'New RSVP Received', who, true)
  });
  Logger.log('Notification email sent to: ' + NOTIFY_EMAIL);
}

/**
 * Build the shared RSVP record HTML used by both the guest receipt and the
 * couple's notification.
 */
function buildRsvpHtml(data, heading, subheading, detailed) {
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

  // ---- Moody palette + type ----
  const BG = '#10130c';      // near-black forest
  const CARD = '#1c2413';    // deep evergreen
  const LINE = 'rgba(201,169,110,0.28)'; // antique-gold hairline
  const GOLD = '#c9a96e';    // muted gold accent
  const CREAM = '#ece5d4';   // parchment text
  const MUTED = '#9a957f';   // soft muted text
  const SERIF = "Georgia, 'Times New Roman', Times, serif";

  const lblStyle = `font-family:${SERIF};font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:${GOLD};margin:0 0 8px;`;
  const valStyle = `font-family:${SERIF};font-size:16px;line-height:1.55;color:${CREAM};margin:0;`;
  const metaStyle = `font-family:${SERIF};font-size:13px;line-height:1.5;color:${MUTED};margin:0;`;

  // A divider-topped section block.
  function section(inner) {
    return `<tr><td style="padding:24px 36px;border-top:1px solid ${LINE};">${inner}</td></tr>`;
  }

  const attendingNicely = (ceremony === 'No')
    ? 'Regretfully unable to attend'
    : (ceremony === 'Yes' ? 'Joyfully attending' : escHtml(ceremony));

  // ---- The celebration + add-to-calendar (only when attending) ----
  let calendarSection = '';
  if (ceremony !== 'No') {
    const calUrl = googleCalendarUrl();
    calendarSection = section(
      `<p style="${lblStyle}">The Celebration</p>` +
      `<p style="${valStyle}">${escHtml(EVENT_WHEN)}</p>` +
      `<p style="${metaStyle}margin-top:6px;">${escHtml(EVENT_VENUE)}<br>${escHtml(EVENT_ADDRESS)}</p>` +
      `<p style="margin:20px 0 0;"><a href="${calUrl}" style="display:inline-block;font-family:${SERIF};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#1c2413;background:${GOLD};padding:13px 28px;text-decoration:none;">Add to Calendar</a></p>`
    );
  }

  // ---- Guests ----
  let guestsSection = '';
  if (attendees.length > 0) {
    let inner = `<p style="${lblStyle}">${attendees.length > 1 ? 'The Party' : 'Guest'}</p>`;
    attendees.forEach(function (a, i) {
      inner += `<div style="margin-top:${i === 0 ? 2 : 20}px;">`;
      inner += `<p style="font-family:${SERIF};font-size:19px;color:${CREAM};margin:0 0 5px;">${escHtml(a.name) || '—'}</p>`;
      if (detailed) {
        const contact = [];
        if (a.email) contact.push(escHtml(a.email));
        if (a.phone) contact.push(escHtml(a.phone));
        if (contact.length) inner += `<p style="${metaStyle}">${contact.join(' &nbsp;&middot;&nbsp; ')}</p>`;
        const extras = [];
        if (a.dietary_restrictions) extras.push(['Dietary', escHtml(a.dietary_restrictions)]);
        if (a.arrival) extras.push(['Staying', stayWindow(a.arrival)]);
        if (a.sleeping) extras.push(['Sleeping', escHtml(a.sleeping)]);
        extras.forEach(function (pair) {
          inner += `<p style="${metaStyle}margin-top:6px;"><span style="color:${GOLD};">${pair[0]}</span> &nbsp;${pair[1]}</p>`;
        });
      }
      inner += `</div>`;
    });
    guestsSection = section(inner);
  }

  // ---- Mailing address ----
  let addressSection = '';
  if (mailingAddress) {
    addressSection = section(
      `<p style="${lblStyle}">Mailing Address</p>` +
      `<p style="${valStyle}">${escHtml(mailingAddress).replace(/\n/g, '<br>')}</p>` +
      `<p style="font-family:${SERIF};font-size:12px;font-style:italic;color:${MUTED};margin:10px 0 0;">For your paper invitation.</p>`
    );
  }

  // ---- Notes ----
  let notesSection = '';
  if (detailed && (songRequests || comments)) {
    let inner = '';
    if (songRequests) inner += `<p style="${lblStyle}">A Song to Hear</p><p style="${valStyle}margin-bottom:${comments ? 16 : 0}px;">${escHtml(songRequests)}</p>`;
    if (comments) inner += `<p style="${lblStyle}">A Note</p><p style="${valStyle}">${escHtml(comments)}</p>`;
    notesSection = section(inner);
  }

  const closingLine = (ceremony === 'No')
    ? "We'll miss you dearly — thank you for letting us know."
    : "We can't wait to celebrate with you beneath the pines.";

  const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:${BG};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escHtml(heading)} — Madi &amp; Hunter, September 19, 2026</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:${CARD};border:1px solid ${LINE};">

          <!-- Header -->
          <tr>
            <td style="padding:44px 36px 36px;text-align:center;">
              <p style="font-family:${SERIF};font-size:13px;letter-spacing:7px;text-transform:uppercase;color:${GOLD};margin:0 0 22px;">Madi &amp; Hunter</p>
              <p style="font-family:${SERIF};font-size:30px;line-height:1.2;color:${CREAM};margin:0;">${escHtml(heading)}</p>
              <p style="font-family:${SERIF};font-size:15px;font-style:italic;color:${MUTED};margin:14px 0 0;">${escHtml(subheading)}</p>
              <p style="font-family:${SERIF};font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:${GOLD};margin:24px 0 0;">September 19, 2026 &nbsp;&middot;&nbsp; Mill Hollow, Utah</p>
            </td>
          </tr>

          <!-- Ceremony -->
          ${section(`<p style="${lblStyle}">Attending Ceremony?</p><p style="${valStyle}">${attendingNicely}</p>`)}

          ${calendarSection}
          ${guestsSection}
          ${addressSection}
          ${notesSection}

          <!-- Closing -->
          ${section(`<p style="font-family:${SERIF};font-size:16px;font-style:italic;line-height:1.6;color:${CREAM};margin:0;text-align:center;">${closingLine}</p>`)}

          <!-- Footer -->
          <tr>
            <td style="padding:30px 36px 38px;text-align:center;border-top:1px solid ${LINE};">
              <p style="font-family:${SERIF};font-size:12px;line-height:1.6;color:${MUTED};margin:0;">Questions? <a href="mailto:hunterandmadi9496@gmail.com" style="color:${GOLD};text-decoration:none;">hunterandmadi9496@gmail.com</a><br>or call Madi at 801-458-2972</p>
              <p style="font-family:${SERIF};font-size:11px;letter-spacing:4px;text-transform:uppercase;color:${GOLD};margin:18px 0 0;">M &middot; &amp; &middot; H</p>
              <p style="font-family:${SERIF};font-size:10px;color:${MUTED};opacity:0.7;margin:14px 0 0;">Submitted ${submissionDate}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return htmlBody;
}

/**
 * Map the RSVP arrival/guest-type answer to a plain stay window.
 * The form's arrival options encode the whole stay, so we can derive it.
 */
function stayWindow(arrival) {
  const a = (arrival || '').toLowerCase();
  if (a.indexOf('full weekend') !== -1) return 'Friday–Sunday';
  if (a.indexOf('setup crew') !== -1) return 'Friday–Saturday';
  if (a.indexOf('saturday guest') !== -1) return 'Saturday–Sunday';
  if (a.indexOf('day guest') !== -1) return 'Saturday only (no overnight)';
  return escHtml(arrival); // fallback: show whatever was provided
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
