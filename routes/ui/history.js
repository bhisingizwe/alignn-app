const BASE_URL = "https://alignn-app.vercel.app";

const loadHistoryBtn = document.getElementById("loadHistoryBtn");
const historyStatus = document.getElementById("historyStatus");
const historyList = document.getElementById("historyList");
const detailTitle = document.getElementById("detailTitle");
const logoutBtnSide = document.getElementById("logoutBtnSide");

const reflectionCount = document.getElementById("reflectionCount");
const moodCount = document.getElementById("moodCount");
const journalCount = document.getElementById("journalCount");
const checkinCount = document.getElementById("checkinCount");

const reflectionLatest = document.getElementById("reflectionLatest");
const moodLatest = document.getElementById("moodLatest");
const journalLatest = document.getElementById("journalLatest");
const checkinLatest = document.getElementById("checkinLatest");

const historyCards = document.querySelectorAll(".history-summary-card");

let historyData = {
  reflections: [],
  moods: [],
  journals: [],
  checkins: []
};

function setStatus(msg) {
  historyStatus.textContent = `Status: ${msg}`;
}

function formatDate(dateString) {
  if (!dateString) return "No date";

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

function getLatest(items) {
  return items && items.length > 0 ? items[0] : null;
}

function updateSummaryCards() {
  const latestReflection = getLatest(historyData.reflections);
  const latestMood = getLatest(historyData.moods);
  const latestJournal = getLatest(historyData.journals);
  const latestCheckin = getLatest(historyData.checkins);

  reflectionCount.textContent = `${historyData.reflections.length} entr${historyData.reflections.length === 1 ? "y" : "ies"}`;
  moodCount.textContent = `${historyData.moods.length} entr${historyData.moods.length === 1 ? "y" : "ies"}`;
  journalCount.textContent = `${historyData.journals.length} entr${historyData.journals.length === 1 ? "y" : "ies"}`;
  checkinCount.textContent = `${historyData.checkins.length} entr${historyData.checkins.length === 1 ? "y" : "ies"}`;

  reflectionLatest.textContent = latestReflection
    ? `Latest: ${latestReflection.prompt || "Reflection"} • ${formatDate(latestReflection.created_at)}`
    : "No reflections yet.";

  moodLatest.textContent = latestMood
    ? `Latest: ${latestMood.mood || "Mood"} • ${formatDate(latestMood.created_at)}`
    : "No mood logs yet.";

  journalLatest.textContent = latestJournal
    ? `Latest: ${latestJournal.title || "Untitled Entry"} • ${formatDate(latestJournal.created_at)}`
    : "No journal entries yet.";

  checkinLatest.textContent = latestCheckin
    ? `Latest: ${latestCheckin.mental_state || "Check-in"} • ${formatDate(latestCheckin.created_at)}`
    : "No check-ins yet.";
}

async function fetchHistory(endpoint) {
  const res = await fetchWithAuth(`${BASE_URL}${endpoint}`, {
    method: "GET"
  });

  if (!res) return null;

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to load history");
  }

  return data;
}

async function loadHistory() {
  const token = requireAuth();
  if (!token) return;

  setStatus("loading history...");
  loadHistoryBtn.disabled = true;

  try {
    const [reflectionData, moodData, journalData, checkinData] = await Promise.all([
      fetchHistory("/api/reflection"),
      fetchHistory("/api/mood"),
      fetchHistory("/api/journal"),
      fetchHistory("/api/checkin")
    ]);

    historyData.reflections = reflectionData?.reflections || [];
    historyData.moods = moodData?.moods || [];
    historyData.journals = journalData?.entries || [];
    historyData.checkins = checkinData?.checkins || [];

    updateSummaryCards();

    setStatus("history loaded");
  } catch (err) {
    console.error(err);
    setStatus("failed to load history");
  } finally {
    loadHistoryBtn.disabled = false;
  }
}

function clearActiveCards() {
  historyCards.forEach((card) => {
    card.classList.remove("active");
  });
}

function renderDetails(type) {
  clearActiveCards();

  const activeCard = document.querySelector(`[data-type="${type}"]`);

  if (activeCard) {
    activeCard.classList.add("active");
  }

  historyList.innerHTML = "";

  if (type === "reflections") {
    detailTitle.textContent = "Reflection History";

    if (historyData.reflections.length === 0) {
      historyList.innerHTML = `<div class="muted small">No reflections found yet.</div>`;
      return;
    }

    historyData.reflections.forEach((item) => {
      const card = document.createElement("div");
      card.className = "historyCard";

      card.innerHTML = `
        <div class="historyDate">${formatDate(item.created_at)}</div>
        <div class="historyPrompt">${item.prompt || "Reflection Prompt"}</div>
        <div class="historyAnswer">${item.answer || "No answer saved."}</div>
      `;

      historyList.appendChild(card);
    });
  }

  if (type === "moods") {
    detailTitle.textContent = "Mood History";

    if (historyData.moods.length === 0) {
      historyList.innerHTML = `<div class="muted small">No mood entries found yet.</div>`;
      return;
    }

    historyData.moods.forEach((item) => {
      const card = document.createElement("div");
      card.className = "historyCard";

      card.innerHTML = `
        <div class="historyDate">${formatDate(item.created_at)}</div>
        <div class="historyPrompt">Mood: ${item.mood || "Unknown"}</div>
        <div class="historyAnswer">Intensity: ${item.intensity ?? "—"}</div>
        <div class="historyAnswer">${item.notes || "No notes."}</div>
      `;

      historyList.appendChild(card);
    });
  }

  if (type === "journals") {
    detailTitle.textContent = "Journal History";

    if (historyData.journals.length === 0) {
      historyList.innerHTML = `<div class="muted small">No journal entries found yet.</div>`;
      return;
    }

    historyData.journals.forEach((item) => {
      const card = document.createElement("div");
      card.className = "historyCard";

      card.innerHTML = `
        <div class="historyDate">${formatDate(item.created_at)}</div>
        <div class="historyPrompt">${item.title || "Untitled Entry"}</div>
        <div class="historyAnswer">${item.content || "No content saved."}</div>
      `;

      historyList.appendChild(card);
    });
  }

  if (type === "checkins") {
    detailTitle.textContent = "Check-In History";

    if (historyData.checkins.length === 0) {
      historyList.innerHTML = `<div class="muted small">No check-ins found yet.</div>`;
      return;
    }

    historyData.checkins.forEach((item) => {
      const card = document.createElement("div");
      card.className = "historyCard";

      card.innerHTML = `
        <div class="historyDate">${formatDate(item.created_at)}</div>
        <div class="historyPrompt">Mental state: ${item.mental_state || "Unknown"}</div>
        <div class="historyAnswer">${item.reflection || "No reflection added."}</div>
      `;

      historyList.appendChild(card);
    });
  }
}

historyCards.forEach((card) => {
  card.addEventListener("click", () => {
    renderDetails(card.dataset.type);
  });
});

loadHistoryBtn.addEventListener("click", loadHistory);

if (logoutBtnSide) {
  logoutBtnSide.addEventListener("click", logout);
}

window.addEventListener("DOMContentLoaded", () => {
  loadHistory();
});