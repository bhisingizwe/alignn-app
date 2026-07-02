const BASE_URL = "https://alignn-app.vercel.app";

const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const authStatus = document.getElementById("authStatus");
const loginForm = document.getElementById("loginForm");

if (isLoggedIn()) {
  window.location.href = "./dashboard.html";
}

function setStatus(msg) {
  authStatus.textContent = `Status: ${msg}`;
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    setStatus("enter email and password first");
    return;
  }

  loginBtn.disabled = true;
  setStatus("loading...");

  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    loginBtn.disabled = false;

    if (!res.ok) {
      setStatus(data.error || "authentication failed");
      return;
    }

    if (data.token) saveToken(data.token);
    if (data.user) saveUser(data.user);

    localStorage.setItem("savedEmail", email);

    setStatus("login successful");

    setTimeout(() => {
      window.location.href = "./dashboard.html";
    }, 700);
  } catch (err) {
    loginBtn.disabled = false;
    setStatus("server error");
    console.error(err);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const savedEmail = localStorage.getItem("savedEmail");
  if (savedEmail) emailInput.value = savedEmail;
});