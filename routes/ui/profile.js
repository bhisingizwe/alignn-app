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

const currentPasswordInput = document.getElementById("currentPasswordInput");
const newProfilePasswordInput = document.getElementById("newProfilePasswordInput");
const confirmPasswordInput = document.getElementById("confirmPasswordInput");
const changePasswordBtn = document.getElementById("changePasswordBtn");

function setStatus(msg) {
  if (profileStatus) {
    profileStatus.textContent = `Status: ${msg}`;
  }
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
      if (profileName) profileName.textContent = "Unavailable";
      if (profileEmail) profileEmail.textContent = "Unavailable";
      setStatus(data.error || "failed to load profile");
      return;
    }

    const user = data.user;
    saveUser(user);

    if (profileName) profileName.textContent = user.name || "No name added yet";
    if (profileEmail) profileEmail.textContent = user.email || "No email available";

    setStatus("profile loaded");
  } catch (err) {
    console.error(err);
    if (profileName) profileName.textContent = "Unavailable";
    if (profileEmail) profileEmail.textContent = "Unavailable";
    setStatus("server error");
  }
}

async function changePassword() {
  const token = requireAuth();
  if (!token) return;

  if (!currentPasswordInput || !newProfilePasswordInput || !confirmPasswordInput) {
    setStatus("password form is missing from the page");
    return;
  }

  const currentPassword = currentPasswordInput.value.trim();
  const newPassword = newProfilePasswordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    setStatus("fill out all password fields");
    return;
  }

  if (newPassword.length < 6) {
    setStatus("new password must be at least 6 characters");
    return;
  }

  if (newPassword !== confirmPassword) {
    setStatus("new passwords do not match");
    return;
  }

  if (currentPassword === newPassword) {
    setStatus("new password must be different");
    return;
  }

  changePasswordBtn.disabled = true;
  setStatus("updating password...");

  try {
    const res = await fetchWithAuth(`${BASE_URL}/api/auth/me/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword
      })
    });

    if (!res) {
      changePasswordBtn.disabled = false;
      setStatus("request failed");
      return;
    }

    const data = await res.json();
    changePasswordBtn.disabled = false;

    if (!res.ok) {
      setStatus(data.error || "failed to update password");
      return;
    }

    currentPasswordInput.value = "";
    newProfilePasswordInput.value = "";
    confirmPasswordInput.value = "";

    setStatus("password updated successfully");
  } catch (err) {
    console.error(err);
    changePasswordBtn.disabled = false;
    setStatus("server error while updating password");
  }
}

async function saveDisplayName() {
  const token = requireAuth();
  if (!token || !displayNameInput) return;

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

    if (profileName) profileName.textContent = data.user.name || "No name added yet";
    saveUser(data.user);
    setStatus("name saved");

    if (nameEditBox) nameEditBox.classList.add("hidden");
  } catch (err) {
    console.error(err);
    setStatus("server error while saving name");
  }
}

async function deleteAccount() {
  const token = requireAuth();
  if (!token || !deleteConfirmInput || !deleteAccountBtn) return;

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

    const data = await res.json();

    if (!res.ok) {
      deleteAccountBtn.disabled = false;
      setStatus(data.error || "failed to delete account");
      return;
    }

    localStorage.clear();
    alert("Your 𝒜lignn account has been deleted.");
    window.location.replace("./signup.html");
  } catch (err) {
    console.error(err);
    deleteAccountBtn.disabled = false;
    setStatus("server error while deleting account");
  }
}

if (accountDetailsCard) {
  accountDetailsCard.addEventListener("click", () => {
    if (!nameEditBox || !displayNameInput || !profileName) return;

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

if (changePasswordBtn) {
  changePasswordBtn.addEventListener("click", changePassword);
}

window.addEventListener("DOMContentLoaded", () => {
  loadProfile();
});