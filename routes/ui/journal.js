const BASE_URL = "http://localhost:5000";

const titleInput = document.getElementById("titleInput");
const contentInput = document.getElementById("contentInput");
const saveJournalBtn = document.getElementById("saveJournalBtn");
const loadJournalHistoryBtn = document.getElementById("loadJournalHistoryBtn");
const journalStatus = document.getElementById("journalStatus");
const journalHistoryList = document.getElementById("journalHistoryList");
const logoutBtnSide = document.getElementById("logoutBtnSide");

function setStatus(msg) {
  journalStatus.textContent = `Status: ${msg}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function logout() {
  clearSessionAndRedirect();
}

async function saveJournal() {
  const token = requireAuth();
  if (!token) return;

  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!content) {
    setStatus("write something first");
    return;
  }

  setStatus("saving journal entry...");
  saveJournalBtn.disabled = true;

  try {
    const res = await fetchWithAuth(`${BASE_URL}/api/journal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        content
      })
    });

    if (!res) {
      saveJournalBtn.disabled = false;
      return;
    }

    const data = await res.json();
    saveJournalBtn.disabled = false;

    if (!res.ok) {
      setStatus(data.error || "failed to save journal entry");
      return;
    }

    titleInput.value = "";
    contentInput.value = "";
    setStatus("journal entry saved");

    loadJournalHistory();
  } catch (err) {
    saveJournalBtn.disabled = false;
    setStatus("server error");
    console.error(err);
  }
}

async function loadJournalHistory() {
  const token = requireAuth();
  if (!token) return;

  setStatus("loading journal history...");
  loadJournalHistoryBtn.disabled = true;

  try {
    const res = await fetchWithAuth(`${BASE_URL}/api/journal`, {
      method: "GET"
    });

    if (!res) {
      loadJournalHistoryBtn.disabled = false;
      return;
    }

    const data = await res.json();
    loadJournalHistoryBtn.disabled = false;

    if (!res.ok) {
      setStatus(data.error || "failed to load journal entries");
      return;
    }

    const entries = data.entries || [];

    if (entries.length === 0) {
      journalHistoryList.innerHTML = `
        <div class="muted small">No journal entries found yet.</div>
      `;
      setStatus("no journal entries yet");
      return;
    }

    journalHistoryList.innerHTML = "";

    entries.forEach((item) => {
      const card = document.createElement("div");
      card.className = "historyCard";

      card.innerHTML = `
        <div class="historyDate">${formatDate(item.created_at)}</div>
        <div class="historyPrompt">${item.title || "Untitled Entry"}</div>
        <div class="historyAnswer">${item.content}</div>
      `;

      journalHistoryList.appendChild(card);
    });

    setStatus(`loaded ${entries.length} journal entr${entries.length === 1 ? "y" : "ies"}`);
  } catch (err) {
    loadJournalHistoryBtn.disabled = false;
    setStatus("server error");
    console.error(err);
  }
}

saveJournalBtn.addEventListener("click", saveJournal);
loadJournalHistoryBtn.addEventListener("click", loadJournalHistory);

if (logoutBtnSide) {
  logoutBtnSide.addEventListener("click", logout);
}

window.addEventListener("DOMContentLoaded", () => {
  loadJournalHistory();
});