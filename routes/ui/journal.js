const BASE_URL = "https://alignn-app.vercel.app";

const titleInput = document.getElementById("titleInput");
const contentInput = document.getElementById("contentInput");
const saveJournalBtn = document.getElementById("saveJournalBtn");
const journalStatus = document.getElementById("journalStatus");
const journalWordCount = document.getElementById("journalWordCount");

const logoutBtn = document.getElementById("logoutBtn");
const mobileJournalLogoutBtn = document.getElementById(
  "mobileJournalLogoutBtn"
);

function setStatus(message) {
  if (!journalStatus) return;

  journalStatus.textContent = `Status: ${message}`;
}

function logout() {
  clearSessionAndRedirect();
}

function updateWordCount() {
  if (!contentInput || !journalWordCount) return;

  const text = contentInput.value.trim();

  const wordCount = text
    ? text.split(/\s+/).filter(Boolean).length
    : 0;

  journalWordCount.textContent =
    `${wordCount} ${wordCount === 1 ? "word" : "words"}`;
}

function setupMobileJournalMenu() {
  const menuButton = document.getElementById("mobileJournalMenuBtn");
  const menu = document.getElementById("mobileJournalMenu");
  const closeButton = document.getElementById("mobileJournalMenuClose");
  const overlay = document.getElementById("mobileJournalMenuOverlay");

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

  menu.querySelectorAll(".mobile-workout-link").forEach((button) => {
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

async function saveJournal() {
  const token = requireAuth();

  if (!token) return;
  if (!titleInput || !contentInput || !saveJournalBtn) return;

  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!content) {
    setStatus("write something first");
    contentInput.focus();
    return;
  }

  setStatus("saving journal entry...");
  saveJournalBtn.disabled = true;

  try {
    const response = await fetchWithAuth(`${BASE_URL}/api/journal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        content
      })
    });

    if (!response) {
      saveJournalBtn.disabled = false;
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "failed to save journal entry");
      return;
    }

    titleInput.value = "";
    contentInput.value = "";
    updateWordCount();

    setStatus("journal entry saved");
  } catch (error) {
    console.error("Journal save error:", error);
    setStatus("server error");
  } finally {
    saveJournalBtn.disabled = false;
  }
}

saveJournalBtn?.addEventListener("click", saveJournal);
contentInput?.addEventListener("input", updateWordCount);

logoutBtn?.addEventListener("click", logout);
mobileJournalLogoutBtn?.addEventListener("click", logout);

setupMobileJournalMenu();
updateWordCount();