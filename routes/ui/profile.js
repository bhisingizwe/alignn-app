const BASE_URL = "https://alignn-app.vercel.app";

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileStatus = document.getElementById("profileStatus");
const logoutBtnSide = document.getElementById("logoutBtnSide");

const accountDetailsCard = document.getElementById("accountDetailsCard");
const nameEditBox = document.getElementById("nameEditBox");
const displayNameInput = document.getElementById("displayNameInput");
const saveNameBtn = document.getElementById("saveNameBtn");

const deleteConfirmInput = document.getElementById("deleteConfirmInput");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");

function setStatus(msg) {
  profileStatus.textContent = `Status: ${msg}`;
}

function logout() {
  clearSessionAndRedirect();
}

async function loadProfile() {
  const token = requireAuth();
  if (!token) return;

  setStatus("loading profile...");

  try {
    const res = await fetchWithAuth(`${BASE_URL}/api/auth/me`, {
      method: "GET"
    });

    if (!res) return;

    const data = await res.json();

    if (!res.ok) {
      profileName.textContent = "Unavailable";
      profileEmail.textContent = "Unavailable";
      setStatus(data.error || "failed to load profile");
      return;
    }

    const user = data.user;
    saveUser(user);

    profileName.textContent = user.name || "No name added yet";
    profileEmail.textContent = user.email || "No email available";

    setStatus("profile loaded");
  } catch (err) {
    console.error(err);
    profileName.textContent = "Unavailable";
    profileEmail.textContent = "Unavailable";
    setStatus("server error");
  }
}

async function saveDisplayName() {
  const token = requireAuth();
  if (!token) return;

  const name = displayNameInput.value.trim();

  if (!name) {
    setStatus("please enter a name");
    return;
  }

  setStatus("saving name...");

  try {
    const res = await fetchWithAuth(`${BASE_URL}/api/auth/me/name`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name })
    });

    if (!res) return;

    const data = await res.json();

    if (!res.ok) {
      setStatus(data.error || "failed to save name");
      return;
    }

    profileName.textContent = data.user.name || "No name added yet";
    saveUser(data.user);
    setStatus("name saved");

    nameEditBox.classList.add("hidden");
  } catch (err) {
    console.error(err);
    setStatus("server error while saving name");
  }
}

if (accountDetailsCard) {
  accountDetailsCard.addEventListener("click", () => {
    nameEditBox.classList.toggle("hidden");

    if (!nameEditBox.classList.contains("hidden")) {
      const currentName = profileName.textContent;

      displayNameInput.value =
        currentName &&
        currentName !== "No name added yet" &&
        currentName !== "Loading..." &&
        currentName !== "Unavailable"
          ? currentName
          : "";

      displayNameInput.focus();
    }
  });
}

if (saveNameBtn) {
  saveNameBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    saveDisplayName();
  });
}

if (displayNameInput) {
  displayNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveDisplayName();
    }
  });
}

if (nameEditBox) {
  nameEditBox.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}

if (logoutBtnSide) {
  logoutBtnSide.addEventListener("click", logout);
}

if (deleteAccountBtn) {
  deleteAccountBtn.addEventListener("click", deleteAccount);
}

async function deleteAccount() {
  const token = requireAuth();
  if (!token) return;

  const confirmText = deleteConfirmInput.value.trim();

  if (confirmText !== "DELETE") {
    setStatus("type DELETE to confirm account deletion");
    return;
  }

  const confirmed = confirm(
    "Are you sure you want to permanently delete your 𝒜lignn account? This cannot be undone."
  );

  if (!confirmed) return;

  deleteAccountBtn.disabled = true;
  setStatus("deleting account...");

  try {
    const res = await fetchWithAuth(`${BASE_URL}/api/auth/me`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ confirmText })
    });

    if (!res) {
      deleteAccountBtn.disabled = false;
      setStatus("request failed before reaching server");
      return;
    }

    const text = await res.text();
    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      console.error("Non-JSON response:", text);
      deleteAccountBtn.disabled = false;
      setStatus("server returned invalid response");
      return;
    }

    if (!res.ok) {
      deleteAccountBtn.disabled = false;
      setStatus(data.error || "failed to delete account");
      return;
    }

    localStorage.clear();
    alert("Your 𝒜lignn account has been deleted.");
    window.location.replace("./signup.html");
  } catch (err) {
    console.error("Delete account frontend error:", err);
    deleteAccountBtn.disabled = false;
    setStatus(err.message || "server error while deleting account");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  loadProfile();
});