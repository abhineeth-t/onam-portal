const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzf2Pe-YgCOevvSQHQz_FMnp5ipIj4D5LMAeWCN3RPHzGwt6kStvefq0eCqOi1idzDWeA/exec";

function handleFileSelected(input) {
  const chosenName = document.getElementById("chosen-file-name");
  if (input.files && input.files[0]) {
    chosenName.style.display = "block";
    chosenName.innerText = "Selected: " + input.files[0].name;
  } else {
    chosenName.style.display = "none";
  }
}

function getCompressedBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1000;
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
        resolve(canvas.toDataURL("image/jpeg", 0.7));
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

  errBox.style.display = "none";
  btn.disabled = true;
  btn.innerText = "Uploading & Saving...";

  try {
    let base64Image = "";
    if (fileInput.files && fileInput.files[0]) {
      base64Image = await getCompressedBase64(fileInput.files[0]);
    }

    const payload = {
      name: document.getElementById("f-name").value.trim(),
      email: document.getElementById("f-email").value.trim(),
      phone: document.getElementById("f-phone").value.trim(),
      sem: document.getElementById("f-sem").value,
      diet: document.getElementById("f-diet").value,
      amount: document.getElementById("f-amount").value,
      screenshot: base64Image
    };

    // Sending as text/plain avoids CORS preflight blockage on Google Apps Script
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.status === "success") {
      document.getElementById("m-name").innerText = payload.name;
      document.getElementById("m-id").innerText = "PASS ID: #ONAM-" + Math.floor(1000 + Math.random() * 9000);
      document.getElementById("m-diet").innerText = "Preference: " + payload.diet;
      document.getElementById("m-amt").innerText = "Paid: ₹" + payload.amount;

      const qrBox = document.getElementById("m-qr");
      qrBox.innerHTML = "";
      new QRCode(qrBox, {
        text: `ONAM-2026|${payload.name}|${payload.phone}|${payload.diet}|${payload.amount}`,
        width: 128,
        height: 128
      });

      document.getElementById("ticket-modal").classList.add("show");
      document.getElementById("food-form").reset();
      document.getElementById("chosen-file-name").style.display = "none";
    } else {
      throw new Error(result.message || "Failed to process form");
    }
  } catch (error) {
    errBox.style.display = "block";
    errBox.innerText = "Submission Error: " + error.message;
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