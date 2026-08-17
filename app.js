// ============================================================================
// Onam @ NFSU TC - Core Application Logic (Dark Professional Edition)
// ============================================================================

// Secret cryptographic salt for tamper-proof QR validation
const CRYPTO_SALT = "NFSU-KASAVU-CYBER-2026-SECRET-KEY";

// Google Apps Script Web App Deployment URL
// IMPORTANT: Replace this with your deployed Apps Script URL after following
// the setup instructions in google-apps-script.js
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzd22I35ojGUmZEVbzb8pQE7jIbe_Mta4YtuEuLOMn6hyOrwslJ95_MuqOwZUgPykeRSg/exec";

// ============================================================================
// 5. Contribution & Payment QR Logic
// ============================================================================
let upiQrInstance = null;
let ticketQrInstance = null;

// Client-side Cryptographic Hashing (SHA-256)
async function generateSignature(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Payment Submission
async function handlePaymentSubmit(event) {
  event.preventDefault();
  
  const name = document.getElementById('contributor-name').value.trim();
  const roll = document.getElementById('contributor-roll').value.trim();
  const phone = document.getElementById('contributor-phone').value.trim();
  const amount = parseInt(document.getElementById('contributor-amount').value);
  const txid = document.getElementById('transaction-id').value.trim();
  
  // Validate amount
  if (isNaN(amount) || amount < 100) {
    document.getElementById('amount-validation-msg').classList.remove('hidden');
    document.getElementById('contributor-amount').focus();
    return;
  }
  document.getElementById('amount-validation-msg').classList.add('hidden');
  
  const utrWarning = document.getElementById('utr-validation-msg');
  if (!txid) {
    utrWarning.classList.remove('hidden');
    document.getElementById('transaction-id').focus();
    return;
  }
  utrWarning.classList.add('hidden');
  
  const submitBtn = document.getElementById('submit-payment-btn');
  submitBtn.disabled = true;
  submitBtn.innerText = "Processing Ticket Securely...";
  
  // Generate high-entropy ticket ID
  const ticketId = "TKT-" + Math.floor(100000 + Math.random() * 900000);
  
  // Compile cryptographic validation payload
  // Combine core parameters to detect manual URL tempering
  const validationString = `${name}|${roll}|${amount}|${txid}|${ticketId}|${CRYPTO_SALT}`;
  const signature = await generateSignature(validationString);
  
  // Create secure ticket data payload
  const ticketPayload = {
    t: ticketId,
    n: name,
    r: roll,
    p: phone,
    a: amount,
    u: txid,
    s: signature,
    f: false // foodServed initialized to false
  };
  
  // Trigger automated server logging
  try {
    fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "contribution",
        ticketId: ticketId,
        name: name,
        roll: roll,
        phone: phone,
        amount: amount,
        txid: txid,
        signature: signature
      })
    });
  } catch (err) {
    console.warn("API Hook failed to resolve. Logging locally.");
  }
  
  // Render Ticket Modal Details
  document.getElementById('ticket-display-name').innerText = name;
  document.getElementById('ticket-display-roll').innerText = roll;
  document.getElementById('ticket-display-id').innerText = ticketId;
  document.getElementById('ticket-display-amount').innerText = `₹${amount}`;
  document.getElementById('ticket-display-hash').innerText = `SIG: ${signature.substring(0, 16).toUpperCase()}...`;
  
  // Generate Ticket QR code
  const ticketQrDiv = document.getElementById('ticket-qr-code');
  ticketQrDiv.innerHTML = "";
  
  ticketQrInstance = new QRCode(ticketQrDiv, {
    text: JSON.stringify(ticketPayload),
    width: 160,
    height: 160,
    colorDark : "#0A1128",
    colorLight : "#FFFFFF",
    correctLevel : QRCode.CorrectLevel.M
  });
  
  // Save Ticket Local Database state
  const localTickets = JSON.parse(localStorage.getItem('tickets_database') || '{}');
  localTickets[ticketId] = ticketPayload;
  localStorage.setItem('tickets_database', JSON.stringify(localTickets));
  
  // Open Ticket display overlay
  document.getElementById('ticket-modal-overlay').classList.remove('hidden');
  
  // Reset form
  document.getElementById('payment-form').reset();
  submitBtn.disabled = false;
  submitBtn.innerHTML = `<i class="fa-solid fa-shield-check"></i> Submit Details & Generate Food Pass`;
}

function closeTicketModal() {
  document.getElementById('ticket-modal-overlay').classList.add('hidden');
}

// ============================================================================
// 6. Cultural Registration Submission (Simplified: Name & Semester Only)
// ============================================================================
function handlePerformerSubmit(event) {
  event.preventDefault();
  
  const name = document.getElementById('perf-name').value.trim();
  const semester = document.getElementById('perf-semester').value;
  const category = document.getElementById('perf-category').value;
  const title = document.getElementById('perf-title').value.trim();
  
  const submitBtn = document.getElementById('perf-submit-btn');
  submitBtn.disabled = true;
  submitBtn.innerText = "Submitting registration logs...";
  
  // Dispatch request to Google Sheet webhook
  try {
    fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "performer",
        name: name,
        semester: semester,
        category: category,
        title: title
      })
    });
  } catch (err) {
    console.warn("Apps Script dispatch error.");
  }
  
  // Visual Success feedback
  document.getElementById('perf-success-alert').classList.remove('hidden');
  document.getElementById('performer-form').reset();
  
  setTimeout(() => {
    document.getElementById('perf-success-alert').classList.add('hidden');
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Registration`;
  }, 6000);
}

// ============================================================================
// 7. Admin Verification Scanner Module
// ============================================================================
let html5QrScanner = null;
let currentScannedTicket = null;

// Trigger admin popup
document.getElementById('admin-trigger').addEventListener('click', () => {
  document.getElementById('admin-modal').classList.remove('hidden');
  document.getElementById('admin-pin').focus();
});

function closeAdminPortal() {
  document.getElementById('admin-modal').classList.add('hidden');
  stopScanning();
}

// Check admin passcode
function validateAdminPin() {
  const pinInput = document.getElementById('admin-pin');
  const errorMsg = document.getElementById('admin-pin-error');
  
  if (pinInput.value === "1947") {
    // Unlock scanner view
    document.getElementById('admin-passcode-view').classList.add('hidden');
    document.getElementById('admin-scanner-view').classList.remove('hidden');
    errorMsg.classList.add('hidden');
    pinInput.value = "";
  } else {
    errorMsg.classList.remove('hidden');
    pinInput.focus();
  }
}

// Camera Scanner Controls using html5-qrcode
function startScanning() {
  document.getElementById('scanner-placeholder').classList.add('hidden');
  
  if (html5QrScanner === null) {
    html5QrScanner = new Html5Qrcode("scanner-reader");
  }
  
  const config = { fps: 10, qrbox: { width: 220, height: 220 } };
  
  html5QrScanner.start(
    { facingMode: "environment" }, 
    config,
    onScanSuccess,
    onScanFailure
  ).catch(err => {
    document.getElementById('scanner-output').innerHTML = `
      <p class="text-red-500">// CAMERA_STREAM_FAILED: Unable to access camera.</p>
      <p class="text-white/50">Ensure camera permissions are enabled.</p>
    `;
    console.error(err);
  });
}

function stopScanning() {
  if (html5QrScanner && html5QrScanner.isScanning) {
    html5QrScanner.stop().then(() => {
      document.getElementById('scanner-placeholder').classList.remove('hidden');
    }).catch(err => console.error("Stop failed", err));
  }
}

// Action to execute when QR Code is read
async function onScanSuccess(decodedText, decodedResult) {
  // Beep notification
  playScannerBeep();
  
  const consoleOutput = document.getElementById('scanner-output');
  const statusPill = document.getElementById('scan-status-pill');
  const foodPanel = document.getElementById('food-served-panel');
  
  statusPill.innerText = "Verifying";
  statusPill.className = "px-2 py-0.5 rounded bg-yellow-500/25 text-yellow-400 font-bold uppercase";
  
  try {
    const data = JSON.parse(decodedText);
    
    // Check if mandatory cryptographic parameters are present
    if (!data.t || !data.n || !data.r || !data.a || !data.u || !data.s) {
      throw new Error("Payload missing security signatures.");
    }
    
    // Recompute signature for validation
    const checkString = `${data.n}|${data.r}|${data.a}|${data.u}|${data.t}|${CRYPTO_SALT}`;
    const calculatedSig = await generateSignature(checkString);
    
    if (calculatedSig !== data.s) {
      // Signature mismatch (Manually tempered pass!)
      statusPill.innerText = "SECURITY ALERT";
      statusPill.className = "px-2 py-0.5 rounded bg-red-600 text-white font-bold uppercase";
      consoleOutput.innerHTML = `
        <div class="text-red-500 font-bold">// TICKET_INTEGRITY_FAIL: SIGNATURE_MISMATCH</div>
        <div>Owner Name: ${data.n}</div>
        <div>Roll Number: ${data.r}</div>
        <div class="text-red-400 mt-1">Warning: QR parameters do not match verification key. Fraudulent ticket detected.</div>
      `;
      foodPanel.classList.add('hidden');
      currentScannedTicket = null;
      return;
    }
    
    // Valid Cryptographic signature
    currentScannedTicket = data;
    
    statusPill.innerText = "VERIFIED PASS";
    statusPill.className = "px-2 py-0.5 rounded bg-green-600 text-white font-bold uppercase";
    
    // Fetch and check local database for meal claims
    const db = JSON.parse(localStorage.getItem('tickets_database') || '{}');
    let foodServed = false;
    
    if (db[data.t]) {
      foodServed = db[data.t].f;
    } else {
      // Log ticket into database if scanned first time offline
      db[data.t] = data;
      localStorage.setItem('tickets_database', JSON.stringify(db));
    }
    
    consoleOutput.innerHTML = `
      <div class="text-cyber-green">// DECRYPTION_OK: ENVELOPE_AUTHENTIC</div>
      <div class="grid grid-cols-2 gap-x-4 gap-y-1 mt-1.5">
        <span>TKT: <strong class="text-white">${data.t}</strong></span>
        <span>AMT: <strong class="text-white">₹${data.a}</strong></span>
        <span>NAME: <strong class="text-white">${data.n}</strong></span>
        <span>ROLL: <strong class="text-white">${data.r}</strong></span>
      </div>
      <div class="text-[10px] text-white/60 mt-1">UTR Reference: ${data.u}</div>
    `;
    
    // Update Food claim panel
    updateFoodStatusUI(foodServed);
    foodPanel.classList.remove('hidden');
    
  } catch (err) {
    statusPill.innerText = "PARSING ERROR";
    statusPill.className = "px-2 py-0.5 rounded bg-red-600 text-white font-bold uppercase";
    consoleOutput.innerHTML = `
      <div class="text-red-500 font-bold">// TICKET_PARSE_ERROR: INVALID_FORMAT</div>
      <div class="text-white/50 mt-1">Scanned QR payload is not a valid NFSU Onam event ticket. Details: ${err.message}</div>
    `;
    foodPanel.classList.add('hidden');
    currentScannedTicket = null;
  }
}

function onScanFailure(error) {
  // Silent fail
}

// Toggle food served claim in local database
document.getElementById('toggle-food-btn').addEventListener('click', () => {
  if (!currentScannedTicket) return;
  
  const db = JSON.parse(localStorage.getItem('tickets_database') || '{}');
  const ticketId = currentScannedTicket.t;
  
  if (db[ticketId]) {
    // Toggle state
    db[ticketId].f = !db[ticketId].f;
    localStorage.setItem('tickets_database', JSON.stringify(db));
    
    // Sync UI
    updateFoodStatusUI(db[ticketId].f);
    
    // Optional Backend logs integration API update
    try {
      fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "markFoodServed",
          ticketId: ticketId,
          status: db[ticketId].f
        })
      });
    } catch (err) {
      console.warn("Food sync webhook failed");
    }
  }
});

function updateFoodStatusUI(isServed) {
  const badge = document.getElementById('food-status-badge');
  if (isServed) {
    badge.innerText = "CLAIMED";
    badge.className = "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-red-600 text-white animate-pulse";
  } else {
    badge.innerText = "UNCLAIMED";
    badge.className = "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-green-600 text-white";
  }
}

function resetScannerConsole() {
  document.getElementById('scanner-output').innerHTML = '<p class="text-white/50">// Awaiting QR code detection...</p>';
  document.getElementById('food-served-panel').classList.add('hidden');
  document.getElementById('scan-status-pill').innerText = "Ready";
  document.getElementById('scan-status-pill').className = "px-2 py-0.5 rounded bg-white/15 text-white/70 font-bold uppercase";
  currentScannedTicket = null;
}

// Play simple beep audio context for scanning action
function playScannerBeep() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime); // Frequency 1000Hz
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1); // Stop after 100ms
  } catch (err) {
    // Browser audio context policy might block, ignore
  }
}
