/**
 * Onam @ NFSU TC - Google Apps Script Web App Backend
 *
 * ============================================================
 * SETUP INSTRUCTIONS
 * ============================================================
 *
 * STEP 1: Create two separate Google Sheets inside the respective Drive folders:
 *
 *   Food Coupon Data Folder:
 *   https://drive.google.com/drive/folders/1h0jVMYYLGjilo9L2AnJ1hqhYGZFNh6TC
 *   → Inside this folder, create a Google Sheet named "Onam Food Coupon Data"
 *
 *   Cultural Event Data Folder:
 *   https://drive.google.com/drive/folders/1tmK4BsVFdjmUuTDG9J0ORN9jAMTi6bU7
 *   → Inside this folder, create a Google Sheet named "Onam Cultural Event Data"
 *
 * STEP 2: Open EITHER of those Sheets (it doesn't matter which one — the script
 *   uses Sheet IDs to write independently to each file).
 *
 * STEP 3: In that Sheet, click Extensions → Apps Script.
 *
 * STEP 4: Delete the default code and paste this entire file.
 *
 * STEP 5: Update the two SPREADSHEET_ID constants below:
 *   a. Open your "Onam Food Coupon Data" Sheet.
 *   b. Copy the ID from the URL:
 *      https://docs.google.com/spreadsheets/d/<COPY_THIS_PART>/edit
 *   c. Paste it into FOOD_SHEET_ID below.
 *   d. Do the same for the Cultural Events sheet → paste into CULTURAL_SHEET_ID.
 *
 * STEP 6: Click Deploy → New Deployment.
 *   - Type: Web App
 *   - Execute as: Me
 *   - Who has access: Anyone
 *   Click Deploy → Authorize → Copy the Web App URL.
 *
 * STEP 7: Paste the Web App URL into the GOOGLE_APPS_SCRIPT_URL variable
 *   at the top of app.js.
 *
 * ============================================================
 */

// ← REPLACE THESE TWO VALUES WITH YOUR ACTUAL SPREADSHEET IDs ←

// ID of the sheet inside: Food Coupon Drive Folder
// https://drive.google.com/drive/folders/1h0jVMYYLGjilo9L2AnJ1hqhYGZFNh6TC
var FOOD_SHEET_ID = "YOUR_FOOD_COUPON_SHEET_ID_HERE";

// ID of the sheet inside: Cultural Event Drive Folder
// https://drive.google.com/drive/folders/1tmK4BsVFdjmUuTDG9J0ORN9jAMTi6bU7
var CULTURAL_SHEET_ID = "YOUR_CULTURAL_EVENT_SHEET_ID_HERE";

// Cryptographic salt (must match app.js)
var CRYPTO_SALT = "NFSU-KASAVU-CYBER-2026-SECRET-KEY";

// ============================================================

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", message: "Onam Portal Backend Active" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var response = { status: "success" };

    if (action === "contribution") {
      // ----- Write to Food Coupon Sheet -----
      var foodSS = SpreadsheetApp.openById(FOOD_SHEET_ID);
      var foodSheet = foodSS.getSheetByName("Contributions");
      if (!foodSheet) {
        foodSheet = foodSS.insertSheet("Contributions");
        foodSheet.appendRow([
          "Timestamp", "Ticket ID", "Full Name", "Roll No / Email",
          "Phone", "Amount (₹)", "UTR/TxID", "Signature", "Food Claimed"
        ]);
      }

      foodSheet.appendRow([
        new Date(),
        data.ticketId,
        data.name,
        data.roll,
        data.phone,
        data.amount,
        data.txid,
        data.signature,
        "No"
      ]);

      // Send ticket email if roll field is a valid email
      sendTicketEmail(data);
      response.message = "Food coupon contribution logged successfully.";

    } else if (action === "performer") {
      // ----- Write to Cultural Event Sheet -----
      var culturalSS = SpreadsheetApp.openById(CULTURAL_SHEET_ID);
      var perfSheet = culturalSS.getSheetByName("Registrations");
      if (!perfSheet) {
        perfSheet = culturalSS.insertSheet("Registrations");
        perfSheet.appendRow([
          "Timestamp", "Participant Name", "Semester", "Category", "Performance Title"
        ]);
      }

      perfSheet.appendRow([
        new Date(),
        data.name,
        data.semester,
        data.category,
        data.title
      ]);

      response.message = "Cultural event registration logged successfully.";

    } else if (action === "markFoodServed") {
      // ----- Update food claim status in Food Sheet -----
      var foodSS = SpreadsheetApp.openById(FOOD_SHEET_ID);
      var foodSheet = foodSS.getSheetByName("Contributions");
      if (foodSheet) {
        var values = foodSheet.getDataRange().getValues();
        var status = data.status ? "Yes" : "No";
        var updated = false;

        for (var i = 1; i < values.length; i++) {
          if (values[i][1] === data.ticketId) {
            foodSheet.getRange(i + 1, 9).setValue(status); // Column 9 = Food Claimed
            updated = true;
            break;
          }
        }
        response.message = updated ? "Food status updated to " + status : "Ticket ID not found.";
      } else {
        response.status = "error";
        response.message = "Contributions sheet tab missing.";
      }

    } else {
      response.status = "error";
      response.message = "Unknown action: " + action;
    }

    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Sends a formatted HTML confirmation email if the roll field contains an email address.
 */
function sendTicketEmail(data) {
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.roll)) return;

  var ticketPayload = {
    t: data.ticketId, n: data.name, r: data.roll,
    p: data.phone, a: data.amount, u: data.txid, s: data.signature, f: false
  };

  var qrCodeUrl = "https://quickchart.io/qr?text=" + encodeURIComponent(JSON.stringify(ticketPayload)) + "&size=250&margin=1&ecLevel=M";

  var subject = "🌸 Onam @ NFSU TC 2026 — Food Coupon & QR Ticket [" + data.ticketId + "]";

  var htmlBody = `
    <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background-color:#070B19;padding:30px;color:#FAF6EE;max-width:600px;margin:0 auto;border:2px solid #D4AF37;border-radius:15px;">
      <div style="text-align:center;border-bottom:2px solid #D4AF37;padding-bottom:20px;margin-bottom:25px;">
        <h1 style="font-family:Georgia,serif;font-size:24px;color:#D4AF37;margin:0;">ONAM @ NFSU TC 2026</h1>
        <p style="font-size:11px;letter-spacing:2px;color:#FAF6EE;opacity:0.6;text-transform:uppercase;margin:5px 0 0 0;">Student Association // Event Logistics</p>
      </div>
      <div style="margin-bottom:25px;">
        <p style="font-size:16px;margin:0 0 10px 0;color:#ffffff;">Dear <strong>${data.name}</strong>,</p>
        <p style="font-size:14px;line-height:1.5;margin:0;color:#e2e8f0;">Thank you for your contribution of <strong>₹${data.amount}</strong> to our Onam celebration. Your QR Food Coupon is below — present it at the entrance to claim your meal.</p>
      </div>
      <div style="background-color:#0f172a;border:1px dashed #D4AF37;border-radius:12px;padding:20px;text-align:center;margin-bottom:25px;">
        <h2 style="font-family:Georgia,serif;font-size:18px;color:#D4AF37;margin:0 0 15px 0;">ONAM FOOD PASS</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:15px;text-align:left;font-size:13px;color:#e2e8f0;">
          <tr><td style="padding:6px 0;color:#a0aec0;">Name:</td><td style="padding:6px 0;font-weight:bold;color:#fff;">${data.name}</td></tr>
          <tr><td style="padding:6px 0;color:#a0aec0;">Roll/Email:</td><td style="padding:6px 0;font-weight:bold;font-family:monospace;color:#fff;">${data.roll}</td></tr>
          <tr><td style="padding:6px 0;color:#a0aec0;">Ticket ID:</td><td style="padding:6px 0;font-weight:bold;color:#D4AF37;font-family:monospace;">${data.ticketId}</td></tr>
          <tr><td style="padding:6px 0;color:#a0aec0;">Amount Paid:</td><td style="padding:6px 0;font-weight:bold;color:#00FF66;">₹${data.amount}</td></tr>
          <tr><td style="padding:6px 0;color:#a0aec0;">UTR Number:</td><td style="padding:6px 0;font-family:monospace;font-size:12px;color:#cbd5e1;">${data.txid}</td></tr>
        </table>
        <div style="margin:20px 0;display:inline-block;background:#fff;padding:10px;border-radius:8px;">
          <img src="${qrCodeUrl}" alt="QR Ticket" style="display:block;width:200px;height:200px;" />
        </div>
        <span style="display:block;font-family:monospace;font-size:9px;color:#00FF66;background-color:rgba(0,255,102,0.1);padding:5px;border-radius:4px;word-break:break-all;">
          CRYPTOGRAPHIC_HASH: ${data.signature}
        </span>
      </div>
      <div style="font-size:12px;color:#e2e8f0;background-color:#1e293b;padding:15px;border-radius:8px;border-left:3px solid #D4AF37;">
        <p style="margin:0 0 5px 0;font-weight:bold;color:#fff;">📅 Event Details:</p>
        <p style="margin:2px 0;"><strong>Date:</strong> August 28, 2026</p>
        <p style="margin:2px 0;"><strong>Time:</strong> 09:30 AM onwards</p>
        <p style="margin:2px 0;"><strong>Venue:</strong> Campus Auditorium & Quadrangle, NFSU Tripura Campus</p>
      </div>
      <div style="text-align:center;margin-top:30px;font-size:11px;color:#a0aec0;border-top:1px solid #1e293b;padding-top:15px;">
        <p style="margin:0;">© 2026 Student Association, NFSU Tripura Campus</p>
        <p style="margin:2px 0 0 0;">Do not share this QR code with others.</p>
      </div>
    </div>
  `;

  MailApp.sendEmail({ to: data.roll, subject: subject, htmlBody: htmlBody });
}
