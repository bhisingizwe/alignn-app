const BASE_URL = "https://alignn-app.vercel.app";

const signupForm = document.getElementById("signupForm");
const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const createAccountBtn =
  document.getElementById("createAccountBtn");
const signupStatus =
  document.getElementById("signupStatus");
const termsCheckbox =
  document.getElementById("termsCheckbox");

if (isLoggedIn()) {
  window.location.replace("./dashboard.html");
}

function setStatus(message, type = "info") {
  if (!signupStatus) {
    return;
  }

  signupStatus.textContent = message;
  signupStatus.classList.remove(
    "success",
    "error",
    "info"
  );
  signupStatus.classList.add(type);
}

function setSubmitting(isSubmitting) {
  if (!createAccountBtn) {
    return;
  }

  createAccountBtn.disabled = isSubmitting;
  createAccountBtn.textContent = isSubmitting
    ? "Creating Account..."
    : "Create Account";
}

if (!signupForm) {
  console.error(
    'Signup form not found. Expected id="signupForm".'
  );
} else {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = nameInput?.value.trim() || "";
    const email =
      emailInput?.value.trim().toLowerCase() || "";
    const password =
      passwordInput?.value.trim() || "";

    if (!name) {
      setStatus(
        "Please enter your name.",
        "error"
      );
      nameInput?.focus();
      return;
    }

    if (!email) {
      setStatus(
        "Please enter your email address.",
        "error"
      );
      emailInput?.focus();
      return;
    }

    if (!password) {
      setStatus(
        "Please enter a password.",
        "error"
      );
      passwordInput?.focus();
      return;
    }

    if (!termsCheckbox?.checked) {
      setStatus(
        "Please confirm that you are at least 16 and agree to the Terms of Service and Privacy Policy.",
        "error"
      );
      termsCheckbox?.focus();
      return;
    }

    setSubmitting(true);
    setStatus("Creating your account...", "info");

    try {
      const response = await fetch(
        `${BASE_URL}/api/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name,
            email,
            password
          })
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        setStatus(
          data.error ||
            "We could not create your account. Please try again.",
          "error"
        );
        return;
      }

      if (data.token) {
        saveToken(data.token);
      }

      if (data.user) {
        saveUser(data.user);
      }

      localStorage.setItem("savedEmail", email);

      setStatus(
        "Your account has been created.",
        "success"
      );

      window.setTimeout(() => {
        window.location.replace("./dashboard.html");
      }, 700);
    } catch (error) {
      console.error("Signup error:", error);

      setStatus(
        "We could not connect to the server. Please try again.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  });
}