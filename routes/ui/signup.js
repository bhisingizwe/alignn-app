const BASE_URL = "https://alignn-app.vercel.app";

const signupForm = document.getElementById("signupForm");
const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const createAccountBtn = document.getElementById("createAccountBtn");
const loginPageBtn = document.getElementById("loginPageBtn");
const signupStatus = document.getElementById("signupStatus");
const termsCheckbox = document.getElementById("termsCheckbox");

if (isLoggedIn()) {
  window.location.href = "./dashboard.html";
}

function setStatus(msg) {
  signupStatus.textContent = `Status: ${msg}`;
}

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value.trim();

  if (!name || !email || !password) {
    setStatus("enter name, email, and password first");
    return;
  }

  if (!termsCheckbox.checked) {
  setStatus("please confirm that you are at least 16 and agree to the terms");
  return;
}

  createAccountBtn.disabled = true;
  loginPageBtn.disabled = true;
  setStatus("creating account...");

  try {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    createAccountBtn.disabled = false;
    loginPageBtn.disabled = false;

    if (!res.ok) {
      setStatus(data.error || "sign up failed");
      return;
    }

    if (data.token) {
      saveToken(data.token);
    }

    if (data.user) {
      saveUser(data.user);
    }

    localStorage.setItem("savedEmail", email);

    setStatus("account created successfully");

    setTimeout(() => {
      window.location.href = "./dashboard.html";
    }, 700);
  } catch (err) {
    createAccountBtn.disabled = false;
    loginPageBtn.disabled = false;
    setStatus("server error");
    console.error(err);
  }
});

loginPageBtn.addEventListener("click", () => {
  window.location.href = "./login.html";
});