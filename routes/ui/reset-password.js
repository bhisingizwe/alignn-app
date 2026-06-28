const BASE_URL = "http://localhost:5000";

const resetPasswordForm = document.getElementById("resetPasswordForm");
const newPasswordInput = document.getElementById("newPasswordInput");
const resetPasswordStatus = document.getElementById("resetPasswordStatus");
const resetPasswordBtn = document.getElementById("resetPasswordBtn");

function setStatus(msg) {
  resetPasswordStatus.textContent = `Status: ${msg}`;
}

function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

resetPasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = getTokenFromUrl();
  const newPassword = newPasswordInput.value.trim();

  if (!token) {
    setStatus("missing reset token");
    return;
  }

  if (!newPassword) {
    setStatus("enter a new password first");
    return;
  }

  resetPasswordBtn.disabled = true;
  setStatus("resetting password...");

  try {
    const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token,
        newPassword
      })
    });

    const data = await res.json();
    resetPasswordBtn.disabled = false;

    if (!res.ok) {
      setStatus(data.error || "failed to reset password");
      return;
    }

    setStatus("password reset successful");

    setTimeout(() => {
      window.location.href = "./login.html";
    }, 1000);
  } catch (err) {
    resetPasswordBtn.disabled = false;
    setStatus("server error");
    console.error(err);
  }
});