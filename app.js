const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwkEM0zAJkLiA-o5R64cJ-t_o-klPc2s2vw410gAbj5UHLAUhrtQDqvWuqMVaKxpAX56A/exec";

// 1. Food Pass Submission
async function submitFoodPass(e) {
  e.preventDefault();
  const btn = document.getElementById('food-btn');
  btn.disabled = true;
  btn.innerText = "Processing...";

  const name = document.getElementById('f-name').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const phone = document.getElementById('f-phone').value.trim();
  const amount = document.getElementById('f-amount').value;
  const txid = document.getElementById('f-txid').value.trim();

  const ticketId = 'ONAM-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  const hash = Math.random().toString(36).substring(2, 10);

  const payload = {
    action: "food_pass",
    ticketId: ticketId,
    name: name,
    email: email,
    phone: phone,
    amount: amount,
    txid: txid,
    hash: hash
  };

  fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload)
  });

  // Display Pass Modal
  document.getElementById('m-name').innerText = name;
  document.getElementById('m-id').innerText = "Pass ID: " + ticketId;
  document.getElementById('m-amt').innerText = "Amount Paid: ₹" + amount;
  
  const qrBox = document.getElementById('m-qr');
  qrBox.innerHTML = "";
  new QRCode(qrBox, {
    text: JSON.stringify({ id: ticketId, name: name, amount: amount }),
    width: 120,
    height: 120
  });

  document.getElementById('ticket-modal').classList.add('show');
  document.getElementById('food-form').reset();
  btn.disabled = false;
  btn.innerText = "Generate Food Pass";
}

// 2. Cultural Submission
async function submitCultural(e) {
  e.preventDefault();
  const btn = document.getElementById('cult-btn');
  btn.disabled = true;
  btn.innerText = "Submitting...";

  const payload = {
    action: "cultural",
    name: document.getElementById('c-name').value.trim(),
    semester: document.getElementById('c-sem').value,
    category: document.getElementById('c-cat').value,
    title: document.getElementById('c-title').value.trim()
  };

  fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload)
  });

  const alertBox = document.getElementById('c-alert');
  alertBox.style.display = 'block';
  document.getElementById('cultural-form').reset();

  setTimeout(() => {
    alertBox.style.display = 'none';
    btn.disabled = false;
    btn.innerText = "Submit Registration";
  }, 3000);
}