const BASE_URL = "http://localhost:5000";

const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const authStatus = document.getElementById("authStatus");

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  triggerLogin();
});

if (isLoggedIn()) {
  window.location.href = "./dashboard.html";
}

function setStatus(msg) {
  authStatus.textContent = `Status: ${msg}`;
}

async function handleAuth(endpoint, successMessage) {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    setStatus("enter email and password first");
    return;
  }

  loginBtn.disabled = true;
  signupBtn.disabled = true;
  setStatus("loading...");

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    loginBtn.disabled = false;
    signupBtn.disabled = false;

    if (!res.ok) {
      setStatus(data.error || "authentication failed");
      return;
    }

    if (data.token) {
      saveToken(data.token);
    }

    if (data.user) {
      saveUser(data.user);
    }

    localStorage.setItem("savedEmail", email);

    setStatus(successMessage);

    setTimeout(() => {
      window.location.href = "./dashboard.html";
    }, 700);
  } catch (err) {
    loginBtn.disabled = false;
    signupBtn.disabled = false;
    setStatus("server error");
    console.error(err);
  }
}

function triggerLogin() {
  handleAuth("/api/auth/login", "login successful");
}

loginBtn.addEventListener("click", triggerLogin);

signupBtn.addEventListener("click", () => {
  window.location.href = "./signup.html";
});

document.addEventListener("DOMContentLoaded", () => {
  const savedEmail = localStorage.getItem("savedEmail");

  if (savedEmail) {
    emailInput.value = savedEmail;
  }
});

