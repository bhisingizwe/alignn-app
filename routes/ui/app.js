const BASE_URL = "http://localhost:5000";

const diceBtn = document.getElementById("diceBtn");
const saveBtn = document.getElementById("saveBtn");
const promptText = document.getElementById("promptText");
const answerInput = document.getElementById("answerInput");
const statusEl = document.getElementById("status");
const suggestionList = document.getElementById("suggestionList");
const logoutBtnSide = document.getElementById("logoutBtnSide");

let selectedPrompt = null;

function setStatus(msg) {
  statusEl.textContent = `Status: ${msg}`;
}

function logout() {
  clearSessionAndRedirect();
}

async function apiGet(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  return res.json();
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
  if (!selectedPrompt) {
    promptText.textContent = "Choose a feeling or roll the dice.";
    promptText.classList.add("muted");
    return;
  }

  promptText.classList.remove("muted");
  promptText.textContent = selectedPrompt.question;
}

function renderSuggestions(items) {
  suggestionList.innerHTML = "";

  if (!items || items.length === 0) {
    suggestionList.innerHTML = `
      <div class="muted small">No suggestions found.</div>
    `;
    return;
  }

  items.forEach((p) => {
    const card = document.createElement("div");
    card.className = "suggestionCard";

    card.innerHTML = `
      <div class="small"><b>${p.question}</b></div>
      <div class="muted small">category: ${p.category}</div>
    `;

    card.addEventListener("click", () => {
      document
        .querySelectorAll(".suggestionCard")
        .forEach((c) => c.classList.remove("selected"));

      card.classList.add("selected");

      selectedPrompt = p;
      renderCurrentPrompt();
      setStatus(`selected prompt: ${p.category}`);
    });

    suggestionList.appendChild(card);
  });
}

async function rollDice() {
  requireAuth();

  setStatus("rolling dice...");

  const data = await apiGet("/api/prompts/random?type=reflection");

  if (data.error) {
    setStatus(`error: ${data.error}`);
    return;
  }

  selectedPrompt = data.prompt;
  renderCurrentPrompt();
  setStatus("dice prompt loaded");
}

async function loadSuggested(feeling) {
  requireAuth();

  setStatus(`loading suggestions for: ${feeling}...`);

  const data = await apiGet(
    `/api/prompts/suggested?type=reflection&feeling=${encodeURIComponent(feeling)}`
  );

  if (data.error) {
    renderSuggestions([]);
    setStatus(`error: ${data.error}`);
    return;
  }

  renderSuggestions(data.suggested);
  setStatus(`suggestions loaded: ${feeling}`);
}

async function saveReflection() {
  const token = requireAuth();
  if (!token) return;

  if (!selectedPrompt?.id) {
    setStatus("select a prompt first");
    return;
  }

  const answer = answerInput.value.trim();

  if (!answer) {
    setStatus("write an answer first");
    return;
  }

  setStatus("saving reflection...");
  saveBtn.disabled = true;

  try {
    const result = await apiPost("/api/reflection/from-prompt", {
      promptId: selectedPrompt.id,
      answer
    });

    saveBtn.disabled = false;

    if (!result) return;

    if (!result.ok) {
      setStatus(result.data.error || "save failed");
      return;
    }

    answerInput.value = "";
    setStatus("reflection saved");
  } catch (err) {
    saveBtn.disabled = false;
    setStatus("server error");
    console.error(err);
  }
}

diceBtn.addEventListener("click", rollDice);
saveBtn.addEventListener("click", saveReflection);

document.querySelectorAll(".pill").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".pill").forEach((b) => {
      b.classList.remove("active");
    });

    btn.classList.add("active");
    loadSuggested(btn.dataset.feeling);
  });
});

if (logoutBtnSide) {
  logoutBtnSide.addEventListener("click", logout);
}

window.addEventListener("DOMContentLoaded", () => {
  requireAuth();
  renderCurrentPrompt();
});