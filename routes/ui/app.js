const BASE_URL = "https://alignn-app.vercel.app";

const diceBtn = document.getElementById("diceBtn");
const saveBtn = document.getElementById("saveBtn");
const promptText = document.getElementById("promptText");
const answerInput = document.getElementById("answerInput");
const statusEl = document.getElementById("status");
const suggestionList = document.getElementById("suggestionList");

const logoutBtnSide = document.getElementById("logoutBtn");
const mobileReflectionLogoutBtn = document.getElementById(
  "mobileReflectionLogoutBtn"
);

let selectedPrompt = null;

function setStatus(msg) {
  if (!statusEl) return;

  statusEl.textContent = `Status: ${msg}`;
}

function logout() {
  clearSessionAndRedirect();
}

function setupMobileReflectionMenu() {
  const menuButton = document.getElementById("mobileReflectionMenuBtn");
  const menu = document.getElementById("mobileReflectionMenu");
  const closeButton = document.getElementById(
    "mobileReflectionMenuClose"
  );
  const overlay = document.getElementById(
    "mobileReflectionMenuOverlay"
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

  menu.querySelectorAll(".mobile-workout-link").forEach((button) => {
    button.addEventListener("click", () => {
      const plan = button.dataset.plan;

      if (!plan) return;

      window.location.href = `./workout-plan.html?plan=${plan}`;
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

async function apiGet(endpoint) {
  const token = requireAuth();

  if (!token) return null;

  const res = await fetchWithAuth(`${BASE_URL}${endpoint}`, {
    method: "GET"
  });

  if (!res) return null;

  const data = await res.json();

  return {
    ok: res.ok,
    data
  };
}

async function apiPost(endpoint, body) {
  const res = await fetchWithAuth(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res) return null;

  const data = await res.json();

  return {
    ok: res.ok,
    data
  };
}

function renderCurrentPrompt() {
  if (!promptText) return;

  if (!selectedPrompt) {
    promptText.textContent = "Choose a feeling or roll the dice.";
    promptText.classList.add("muted");
    return;
  }

  promptText.classList.remove("muted");
  promptText.textContent = selectedPrompt.question;
}

function renderSuggestions(items) {
  if (!suggestionList) return;

  suggestionList.innerHTML = "";

  if (!items || items.length === 0) {
    suggestionList.innerHTML = `
      <div class="muted small">No suggestions found.</div>
    `;
    return;
  }

  items.forEach((prompt) => {
    const card = document.createElement("button");

    card.type = "button";
    card.className = "suggestionCard";

    card.innerHTML = `
      <span class="suggestion-question">
        ${prompt.question}
      </span>

      <span class="suggestion-category">
        ${prompt.category}
      </span>
    `;

    card.addEventListener("click", () => {
      document
        .querySelectorAll(".suggestionCard")
        .forEach((item) => item.classList.remove("selected"));

      card.classList.add("selected");

      selectedPrompt = prompt;

      renderCurrentPrompt();
      setStatus(`selected prompt: ${prompt.category}`);
    });

    suggestionList.appendChild(card);
  });
}

async function rollDice() {
  setStatus("rolling dice...");

  try {
    const result = await apiGet(
      "/api/prompts/random?type=reflection"
    );

    if (!result) return;

    if (!result.ok) {
      setStatus(result.data.error || "could not load a prompt");
      return;
    }

    selectedPrompt = result.data.prompt;

    document
      .querySelectorAll(".pill")
      .forEach((button) => button.classList.remove("active"));

    document
      .querySelectorAll(".suggestionCard")
      .forEach((card) => card.classList.remove("selected"));

    renderCurrentPrompt();
    setStatus("dice prompt loaded");
  } catch (err) {
    setStatus("could not load a prompt");
    console.error(err);
  }
}

async function loadSuggested(feeling) {
  setStatus(`loading suggestions for ${feeling}...`);

  try {
    const result = await apiGet(
      `/api/prompts/suggested?type=reflection&feeling=${encodeURIComponent(
        feeling
      )}`
    );

    if (!result) return;

    if (!result.ok) {
      renderSuggestions([]);
      setStatus(result.data.error || "could not load suggestions");
      return;
    }

    selectedPrompt = null;
    renderCurrentPrompt();
    renderSuggestions(result.data.suggested);

    setStatus(`suggestions loaded: ${feeling}`);
  } catch (err) {
    renderSuggestions([]);
    setStatus("could not load suggestions");
    console.error(err);
  }
}

async function saveReflection() {
  const token = requireAuth();

  if (!token) return;

  if (!selectedPrompt?.id) {
    setStatus("select a prompt first");
    return;
  }

  const answer = answerInput?.value.trim();

  if (!answer) {
    setStatus("write an answer first");
    return;
  }

  setStatus("saving reflection...");

  if (saveBtn) {
    saveBtn.disabled = true;
  }

  try {
    const result = await apiPost("/api/reflection/from-prompt", {
      promptId: selectedPrompt.id,
      answer
    });

    if (saveBtn) {
      saveBtn.disabled = false;
    }

    if (!result) return;

    if (!result.ok) {
      setStatus(result.data.error || "save failed");
      return;
    }

    answerInput.value = "";
    selectedPrompt = null;

    document
      .querySelectorAll(".pill")
      .forEach((button) => button.classList.remove("active"));

    renderSuggestions([]);
    renderCurrentPrompt();

    setStatus("reflection saved");
  } catch (err) {
    if (saveBtn) {
      saveBtn.disabled = false;
    }

    setStatus("server error");
    console.error(err);
  }
}

diceBtn?.addEventListener("click", rollDice);
saveBtn?.addEventListener("click", saveReflection);

document.querySelectorAll(".pill").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".pill").forEach((item) => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    loadSuggested(button.dataset.feeling);
  });
});

logoutBtnSide?.addEventListener("click", logout);
mobileReflectionLogoutBtn?.addEventListener("click", logout);

setupMobileReflectionMenu();

window.addEventListener("DOMContentLoaded", () => {
  const token = requireAuth();

  if (!token) return;

  renderCurrentPrompt();
});