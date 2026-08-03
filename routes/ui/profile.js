const BASE_URL = "https://alignn-app.vercel.app";

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileStatus = document.getElementById("profileStatus");

const editNameBtn = document.getElementById("editNameBtn");
const nameEditBox = document.getElementById("nameEditBox");
const displayNameInput =
  document.getElementById("displayNameInput");
const saveNameBtn = document.getElementById("saveNameBtn");
const cancelNameBtn =
  document.getElementById("cancelNameBtn");

const deleteConfirmInput =
  document.getElementById("deleteConfirmInput");
const deleteAccountBtn =
  document.getElementById("deleteAccountBtn");

const logoutBtn = document.getElementById("logoutBtn");
const mobileProfileLogoutBtn =
  document.getElementById("mobileProfileLogoutBtn");

let loadedUser = null;

function setStatus(message) {
  if (!profileStatus) return;

  // Only show real errors
  if (
    message.toLowerCase().includes("error") ||
    message.toLowerCase().includes("failed")
  ) {
    profileStatus.textContent = message;
    profileStatus.style.display = "block";
  } else {
    profileStatus.textContent = "";
    profileStatus.style.display = "none";
  }
}

function logout() {
  clearSessionAndRedirect();
}

function setupMobileProfileMenu() {
  const menuButton =
    document.getElementById("mobileProfileMenuBtn");
  const menu =
    document.getElementById("mobileProfileMenu");
  const closeButton =
    document.getElementById("mobileProfileMenuClose");
  const overlay =
    document.getElementById("mobileProfileMenuOverlay");

  if (!menuButton || !menu || !overlay) return;

  function openMenu() {
    menu.classList.remove("hidden");
    overlay.classList.remove("hidden");
    document.body.classList.add("mobile-menu-open");

    menuButton.setAttribute("aria-expanded", "true");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeMenu() {
    menu.classList.add("hidden");
    overlay.classList.add("hidden");
    document.body.classList.remove("mobile-menu-open");

    menuButton.setAttribute("aria-expanded", "false");
    overlay.setAttribute("aria-hidden", "true");
  }

  menuButton.addEventListener("click", openMenu);

  closeButton?.addEventListener("click", closeMenu);
  overlay.addEventListener("click", closeMenu);

  menu
    .querySelectorAll(".mobile-nav-link")
    .forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

  menu
    .querySelectorAll(".mobile-workout-link")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const plan = button.dataset.plan;

        if (!plan) return;

        window.location.href =
          `./workout-plan.html?plan=${encodeURIComponent(plan)}`;
      });
    });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      !menu.classList.contains("hidden")
    ) {
      closeMenu();
    }
  });
}

function openNameEditor() {
  if (
    !nameEditBox ||
    !displayNameInput ||
    !editNameBtn
  ) {
    return;
  }

  const currentName = loadedUser?.name || "";

  displayNameInput.value = currentName;
  nameEditBox.classList.remove("hidden");

  editNameBtn.setAttribute("aria-expanded", "true");
  editNameBtn.textContent = "Editing";

  displayNameInput.focus();
}

function closeNameEditor() {
  if (
    !nameEditBox ||
    !displayNameInput ||
    !editNameBtn
  ) {
    return;
  }

  nameEditBox.classList.add("hidden");
  displayNameInput.value = "";

  editNameBtn.setAttribute("aria-expanded", "false");
  editNameBtn.textContent = "Edit";
}

async function loadProfile() {
  const token = requireAuth();

  if (!token) return;

  setStatus("loading profile...");

  try {
    const response = await fetchWithAuth(
      `${BASE_URL}/api/auth/me`,
      {
        method: "GET"
      }
    );

    if (!response) return;

    const data = await response.json();

    if (!response.ok) {
      profileName.textContent = "Unavailable";
      profileEmail.textContent = "Unavailable";

      setStatus(
        data.error || "failed to load profile"
      );

      return;
    }

    loadedUser = data.user;
    saveUser(loadedUser);

    profileName.textContent =
      loadedUser.name || "No name added yet";

    profileEmail.textContent =
      loadedUser.email || "No email available";

  setStatus("Profile loaded");
  } catch (error) {
    console.error(error);

    profileName.textContent = "Unavailable";
    profileEmail.textContent = "Unavailable";

    setStatus("server error");
  }
}

async function saveDisplayName() {
  const token = requireAuth();

  if (!token || !displayNameInput || !saveNameBtn) {
    return;
  }

  const name = displayNameInput.value.trim();

  if (!name) {
    setStatus("please enter a name");
    displayNameInput.focus();
    return;
  }

  if (name.length > 80) {
    setStatus("name must be 80 characters or fewer");
    return;
  }

  saveNameBtn.disabled = true;
  setStatus("saving name...");

  try {
    const response = await fetchWithAuth(
      `${BASE_URL}/api/auth/me/name`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name })
      }
    );

    if (!response) {
      saveNameBtn.disabled = false;
      return;
    }

    const data = await response.json();

    saveNameBtn.disabled = false;

    if (!response.ok) {
      setStatus(
        data.error || "failed to save name"
      );

      return;
    }

    loadedUser = data.user;
    saveUser(loadedUser);

    profileName.textContent =
      loadedUser.name || "No name added yet";

    closeNameEditor();
    setStatus("name saved");
  } catch (error) {
    console.error(error);

    saveNameBtn.disabled = false;
    setStatus("server error while saving name");
  }
}

async function deleteAccount() {
  const token = requireAuth();

  if (
    !token ||
    !deleteConfirmInput ||
    !deleteAccountBtn
  ) {
    return;
  }

  const confirmText =
    deleteConfirmInput.value.trim();

  if (confirmText !== "DELETE") {
    setStatus(
      "type DELETE to confirm account deletion"
    );

    return;
  }

  const confirmed = window.confirm(
    "Are you sure you want to permanently delete your Alignn account and all saved data? This action cannot be undone."
  );

  if (!confirmed) {
    setStatus("account deletion cancelled");
    return;
  }

  deleteAccountBtn.disabled = true;
  setStatus("deleting account...");

  try {
    const response = await fetchWithAuth(
      `${BASE_URL}/api/auth/me`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ confirmText })
      }
    );

    if (!response) {
      deleteAccountBtn.disabled = false;
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      deleteAccountBtn.disabled = false;

      setStatus(
        data.error || "failed to delete account"
      );

      return;
    }

    localStorage.clear();

    window.alert(
      "Your Alignn account has been deleted."
    );

    window.location.replace("./signup.html");
  } catch (error) {
    console.error(error);

    deleteAccountBtn.disabled = false;

    setStatus(
      "server error while deleting account"
    );
  }
}

editNameBtn?.addEventListener("click", () => {
  const isOpen =
    !nameEditBox.classList.contains("hidden");

  if (isOpen) {
    closeNameEditor();
  } else {
    openNameEditor();
  }
});

cancelNameBtn?.addEventListener(
  "click",
  closeNameEditor
);

saveNameBtn?.addEventListener(
  "click",
  saveDisplayName
);

displayNameInput?.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveDisplayName();
    }

    if (event.key === "Escape") {
      closeNameEditor();
    }
  }
);

deleteConfirmInput?.addEventListener(
  "input",
  () => {
    const isConfirmed =
      deleteConfirmInput.value.trim() === "DELETE";

    deleteAccountBtn.disabled = !isConfirmed;
  }
);

deleteAccountBtn?.addEventListener(
  "click",
  deleteAccount
);

logoutBtn?.addEventListener("click", logout);

mobileProfileLogoutBtn?.addEventListener(
  "click",
  logout
);

setupMobileProfileMenu();

window.addEventListener(
  "DOMContentLoaded",
  loadProfile
);