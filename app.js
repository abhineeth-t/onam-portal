const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzf2Pe-YgCOevvSQHQz_FMnp5ipIj4D5LMAeWCN3RPHzGwt6kStvefq0eCqOi1idzDWeA/exec";

// Handle UI Display for File Upload
function handleFileSelected(input) {
  const chosenText = document.getElementById('chosen-file-name');
  if (input.files && input.files[0]) {
    chosenText.innerText = "✓ Attached: " + input.files[0].name;
    chosenText.style.display = 'block';
  } else {
    chosenText.style.display = 'none';
  }
}

// Convert File to Base64 String
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

// 1. Food Pass Submission with Screenshot Upload
async function submitFoodPass(e) {
  e.preventDefault();
  const btn = document.getElementById('food-btn');
  const errorAlert = document.getElementById('food-error');
  
  if (errorAlert) errorAlert.style.display = 'none';
  btn.disabled = true;
  btn.innerText = "Uploading & Verifying...";

  const name = document.getElementById('f-name').value.trim();
  const email = document.getElementById('f-email').value.trim().toLowerCase();
  const phone = document.getElementById('f-phone').value.trim();
  const semester = document.getElementById('f-sem').value;
  const diet = document.getElementById('f-diet').value;
  const amount = document.getElementById('f-amount').value;
  const fileInput = document.getElementById('f-screenshot');

  const ticketId = 'ONAM-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  const hash = Math.random().toString(36).substring(2, 10);

  let fileBase64 = "";
  let fileName = "";
  let fileType = "";

  if (fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    fileName = file.name;
    fileType = file.type;
    fileBase64 = await fileToBase64(file);
  }

  const payload = {
    action: "food_pass",
    ticketId: ticketId,
    name: name,
    email: email,
    phone: phone,
    semester: semester,
    diet: diet,
    amount: amount,
    imageBytes: fileBase64,
    imageName: fileName,
    imageType: fileType,
    hash: hash
  };

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.status === 'duplicate') {
      if (errorAlert) {
        errorAlert.innerText = "This email is already registered for a Food Pass!";
        errorAlert.style.display = 'block';
      }
      btn.disabled = false;
      btn.innerText = "Generate Food Pass";
      return;
    }

    // Display Pass Modal on success
    document.getElementById('m-name').innerText = name + " (" + semester + ")";
    document.getElementById('m-id').innerText = "Pass ID: " + ticketId;
    document.getElementById('m-diet').innerText = "Preference: " + diet;
    document.getElementById('m-amt').innerText = "Amount Paid: ₹" + amount;
    
    const qrBox = document.getElementById('m-qr');
    qrBox.innerHTML = "";
    new QRCode(qrBox, {
      text: JSON.stringify({ id: ticketId, name: name, sem: semester, diet: diet, amount: amount }),
      width: 120,
      height: 120
    });

    document.getElementById('ticket-modal').classList.add('show');
    document.getElementById('food-form').reset();
    document.getElementById('chosen-file-name').style.display = 'none';
    btn.disabled = false;
    btn.innerText = "Generate Food Pass";

  } catch (err) {
    // Fallback display
    document.getElementById('m-name').innerText = name + " (" + semester + ")";
    document.getElementById('m-id').innerText = "Pass ID: " + ticketId;
    document.getElementById('m-diet').innerText = "Preference: " + diet;
    document.getElementById('m-amt').innerText = "Amount Paid: ₹" + amount;
    
    const qrBox = document.getElementById('m-qr');
    qrBox.innerHTML = "";
    new QRCode(qrBox, {
      text: JSON.stringify({ id: ticketId, name: name, sem: semester, diet: diet, amount: amount }),
      width: 120,
      height: 120
    });

    document.getElementById('ticket-modal').classList.add('show');
    document.getElementById('food-form').reset();
    document.getElementById('chosen-file-name').style.display = 'none';
    btn.disabled = false;
    btn.innerText = "Generate Food Pass";
  }
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