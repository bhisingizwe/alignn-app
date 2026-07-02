const BASE_URL = "https://alignn-app.vercel.app";

const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const forgotEmailInput = document.getElementById("forgotEmailInput");
const forgotPasswordStatus = document.getElementById("forgotPasswordStatus");
const resetLinkBox = document.getElementById("resetLinkBox");
const sendResetBtn = document.getElementById("sendResetBtn");
const forgotBackBtn = document.getElementById("forgotBackBtn");
const forgotLoginSwitch = document.getElementById("forgotLoginSwitch");

const token = localStorage.getItem("token");

if (token) {
  if (forgotBackBtn) forgotBackBtn.style.display = "block";
  if (forgotLoginSwitch) forgotLoginSwitch.style.display = "none";
} else {
  if (forgotBackBtn) forgotBackBtn.style.display = "none";
  if (forgotLoginSwitch) forgotLoginSwitch.style.display = "block";
}

function setStatus(msg) {
  forgotPasswordStatus.textContent = `Status: ${msg}`;
}

forgotPasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = forgotEmailInput.value.trim();

  if (!email) {
    setStatus("enter your email first");
    return;
  }

  sendResetBtn.disabled = true;
  resetLinkBox.textContent = "";
  setStatus("generating reset link...");

  try {
    const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    sendResetBtn.disabled = false;

    if (!res.ok) {
      setStatus(data.error || "failed to generate reset link");
      return;
    }

    setStatus(data.message || "If that email exists, a reset link has been sent.");
  } catch (err) {
    sendResetBtn.disabled = false;
    setStatus("server error");
    console.error(err);
  }
});