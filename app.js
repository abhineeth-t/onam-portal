// Newly Deployed Google Apps Script Web App Endpoint
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzf2Pe-YgCOevvSQHQz_FMnp5ipIj4D5LMAeWCN3RPHzGwt6kStvefq0eCqOi1idzDWeA/exec";
const ADMIN_EMAILS = ["abhineetht1@gmail.com", "abhineeth.btmtcs25@tr.nfsu.edu.in"];

function handleFileSelected(input) {
  const chosenName = document.getElementById("chosen-file-name");
  if (input.files && input.files[0]) {
    chosenName.style.display = "block";
    chosenName.innerText = "Selected: " + input.files[0].name;
  } else {
    chosenName.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("f-email");
  const phoneInput = document.getElementById("f-phone");
  const screenshotInput = document.getElementById("f-screenshot");
  const amountInput = document.getElementById("f-amount");

  if (phoneInput) {
    phoneInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    });
  }

  if (emailInput) {
    emailInput.addEventListener("input", (e) => {
      const email = e.target.value.toLowerCase().trim();
      if (ADMIN_EMAILS.includes(email)) {
        if (screenshotInput) screenshotInput.removeAttribute("required");
        if (amountInput) {
          amountInput.removeAttribute("min");
          if (!amountInput.value) amountInput.value = "0";
        }
      } else {
        if (screenshotInput) screenshotInput.setAttribute("required", "true");
        if (amountInput) amountInput.setAttribute("min", "100");
      }
    });
  }
});

function getCompressedBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 900;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.65));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// 1. Food Pass Handler
async function submitFoodPass(e) {
  e.preventDefault();
  const btn = document.getElementById("food-btn");
  const errBox = document.getElementById("food-error");
  const fileInput = document.getElementById("f-screenshot");
  const emailVal = document.getElementById("f-email").value.toLowerCase().trim();
  const phoneVal = document.getElementById("f-phone").value.trim();
  const isAdmin = ADMIN_EMAILS.includes(emailVal);

  if (phoneVal.length !== 10) {
    errBox.style.display = "block";
    errBox.innerText = "Please enter a valid 10-digit mobile number.";
    return;
  }

  errBox.style.display = "none";
  btn.disabled = true;
  btn.innerText = isAdmin ? "Issuing VIP Pass..." : "Generating Pass...";

  try {
    let base64Image = "";
    if (fileInput.files && fileInput.files[0]) {
      base64Image = await getCompressedBase64(fileInput.files[0]);
    }

    const payload = {
      type: "food",
      name: document.getElementById("f-name").value.trim(),
      email: emailVal,
      phone: phoneVal,
      sem: document.getElementById("f-sem").value,
      diet: document.getElementById("f-diet").value,
      amount: document.getElementById("f-amount").value || "0",
      screenshot: base64Image
    };

    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.status === "success") {
      document.getElementById("m-name").innerText = payload.name + (isAdmin ? " (VIP ACCESS)" : "");
      document.getElementById("m-id").innerText = "PASS ID: #ONAM-" + Math.floor(1000 + Math.random() * 9000);
      document.getElementById("m-diet").innerText = "Preference: " + payload.diet;
      document.getElementById("m-amt").innerText = isAdmin ? "Unlimited VIP Access" : "Paid: ₹" + payload.amount;

      const qrBox = document.getElementById("m-qr");
      qrBox.innerHTML = "";
      new QRCode(qrBox, {
        text: `ONAM-2026|${payload.name}|${payload.phone}|${payload.diet}|${isAdmin ? 'VIP' : payload.amount}`,
        width: 128,
        height: 128
      });

      document.getElementById("ticket-modal").classList.add("show");
      document.getElementById("food-form").reset();
      document.getElementById("chosen-file-name").style.display = "none";
    } else {
      throw new Error(result.message || "Registration failed.");
    }
  } catch (error) {
    errBox.style.display = "block";
    errBox.innerText = error.message;
  } finally {
    btn.disabled = false;
    btn.innerText = "Generate Food Pass";
  }
}

// 2. Cultural Programme Handler
async function submitCultural(e) {
  e.preventDefault();
  const btn = document.getElementById("cult-btn");
  const alertBox = document.getElementById("c-alert");

  btn.disabled = true;
  btn.innerText = "Submitting...";

  const payload = {
    type: "cultural",
    name: document.getElementById("c-name").value.trim(),
    sem: document.getElementById("c-sem").value,
    category: document.getElementById("c-cat").value,
    title: document.getElementById("c-title").value.trim()
  };

  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.status === "success") {
      alertBox.style.display = "block";
      alertBox.innerText = "Registration recorded successfully!";
      document.getElementById("cultural-form").reset();
      setTimeout(() => {
        alertBox.style.display = "none";
      }, 4000);
    } else {
      alert("Error: " + (result.message || "Please try again."));
    }
  } catch (err) {
    alert("Submission failed: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerText = "Submit Registration";
  }
}