const BASE_URL = "https://alignn-app.vercel.app";

const mentalStateInput = document.getElementById("mentalStateInput");
const reflectionInput = document.getElementById("reflectionInput");
const saveCheckinBtn = document.getElementById("saveCheckinBtn");
const checkinStatus = document.getElementById("checkinStatus");

const logoutBtn = document.getElementById("logoutBtn");
const mobileCheckinLogoutBtn = document.getElementById(
  "mobileCheckinLogoutBtn"
);

function setStatus(message) {
  if (!checkinStatus) return;

  checkinStatus.textContent = `Status: ${message}`;
}

function logout() {
  clearSessionAndRedirect();
}

function setupMobileCheckinMenu() {
  const menuButton = document.getElementById("mobileCheckinMenuBtn");
  const menu = document.getElementById("mobileCheckinMenu");
  const closeButton = document.getElementById(
    "mobileCheckinMenuClose"
  );
  const overlay = document.getElementById(
    "mobileCheckinMenuOverlay"
  );

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

  menu.querySelectorAll(".mobile-nav-link").forEach((link) => {
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

async function saveCheckin() {
  const token = requireAuth();

  if (!token) return;

  if (
    !mentalStateInput ||
    !reflectionInput ||
    !saveCheckinBtn
  ) {
    console.error("Required Check-In form elements are missing.");
    return;
  }

  const mentalState = mentalStateInput.value.trim();
  const reflection = reflectionInput.value.trim();

  if (!mentalState) {
    setStatus("Enter your mental state first");
    mentalStateInput.focus();
    return;
  }

  setStatus("Saving check-in...");
  saveCheckinBtn.disabled = true;

  try {
    const response = await fetchWithAuth(
      `${BASE_URL}/api/checkin`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mental_state: mentalState,
          reflection
        })
      }
    );

    if (!response) return;

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "Failed to save check-in");
      return;
    }

    mentalStateInput.value = "";
    reflectionInput.value = "";

    setStatus("check-in saved");
  } catch (error) {
    console.error("Check-In save error:", error);
    setStatus("server error");
  } finally {
    saveCheckinBtn.disabled = false;
  }
}

saveCheckinBtn?.addEventListener("click", saveCheckin);

mentalStateInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    saveCheckin();
  }
});

logoutBtn?.addEventListener("click", logout);
mobileCheckinLogoutBtn?.addEventListener("click", logout);

setupMobileCheckinMenu();

window.addEventListener("DOMContentLoaded", () => {
  requireAuth();
});