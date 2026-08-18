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

// Auto-detect admin email for unlimited VIP passes
document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("f-email");
  const screenshotInput = document.getElementById("f-screenshot");
  const amountInput = document.getElementById("f-amount");

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

async function submitFoodPass(e) {
  e.preventDefault();
  const btn = document.getElementById("food-btn");
  const errBox = document.getElementById("food-error");
  const fileInput = document.getElementById("f-screenshot");
  const emailVal = document.getElementById("f-email").value.toLowerCase().trim();
  const isAdmin = ADMIN_EMAILS.includes(emailVal);

  errBox.style.display = "none";
  btn.disabled = true;
  btn.innerText = isAdmin ? "Issuing Unlimited VIP Pass..." : "Generating Pass...";

  try {
    let base64Image = "";
    if (fileInput.files && fileInput.files[0]) {
      base64Image = await getCompressedBase64(fileInput.files[0]);
    }

    const payload = {
      name: document.getElementById("f-name").value.trim(),
      email: emailVal,
      phone: document.getElementById("f-phone").value.trim(),
      sem: document.getElementById("f-sem").value,
      diet: document.getElementById("f-diet").value,
      amount: document.getElementById("f-amount").value || "0",
      screenshot: base64Image
    };

    // Sending as text/plain prevents CORS preflight errors on Google Apps Script
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.status === "success") {
      document.getElementById("m-name").innerText = payload.name + (isAdmin ? " (VIP ACCESS)" : "");
      document.getElementById("m-id").innerText = "PASS ID: #VIP-" + Math.floor(1000 + Math.random() * 9000);
      document.getElementById("m-diet").innerText = "Preference: " + payload.diet;
      document.getElementById("m-amt").innerText = isAdmin ? "Unlimited VIP Access" : "Paid: ₹" + payload.amount;

      const qrBox = document.getElementById("m-qr");
      qrBox.innerHTML = "";
      new QRCode(qrBox, {
        text: `ONAM-2026|${payload.name}|${payload.email}|${payload.diet}|${isAdmin ? 'VIP' : payload.amount}`,
        width: 128,
        height: 128
      });

      document.getElementById("ticket-modal").classList.add("show");
      document.getElementById("food-form").reset();
      document.getElementById("chosen-file-name").style.display = "none";
    } else {
      throw new Error(result.message || "Unable to complete registration");
    }
  } catch (error) {
    errBox.style.display = "block";
    errBox.innerText = "Error: " + error.message;
  } finally {
    btn.disabled = false;
    btn.innerText = "Generate Food Pass";
  }
}

function submitCultural(e) {
  e.preventDefault();
  const alertBox = document.getElementById("c-alert");
  alertBox.style.display = "block";
  setTimeout(() => {
    alertBox.style.display = "none";
    document.getElementById("cultural-form").reset();
  }, 4000);
}