const BASE_URL = "http://localhost:5000";

const moodStatsStatus = document.getElementById("moodStatsStatus");
const moodChart = document.getElementById("moodChart");
const moodChartEmpty = document.getElementById("moodChartEmpty");
const saveMoodBtn = document.getElementById("saveMoodBtn");
const loadMoodHistoryBtn = document.getElementById("loadMoodHistoryBtn");
const loadMoodStatsBtn = document.getElementById("loadMoodStatsBtn");
const moodStatus = document.getElementById("moodStatus");
const intensityInput = document.getElementById("intensityInput");
const notesInput = document.getElementById("notesInput");
const moodHistoryList = document.getElementById("moodHistoryList");
const moodButtons = document.querySelectorAll(".moodBtn");
const logoutBtnSide = document.getElementById("logoutBtnSide");

let selectedMood = null;
let moodChartInstance = null;

function setStatus(msg) {
  moodStatus.textContent = `Status: ${msg}`;
}

function setMoodStatsStatus(msg) {
  moodStatsStatus.textContent = `Status: ${msg}`;
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

function getMoodColor(mood) {
  const colors = {
    happy: "#7c5cff",
    sad: "#b39cff",
    anxious: "#f59e0b",
    overwhelmed: "#ef4444",
    numb: "#94a3b8",
    hopeful: "#10b981"
  };

  return colors[mood.toLowerCase()] || "#7c5cff";
}

function renderMoodChart(stats, total) {
  const entries = Object.entries(stats || {});

  if (moodChartInstance) {
    moodChartInstance.destroy();
    moodChartInstance = null;
  }

  if (entries.length === 0 || total === 0) {
    moodChart.style.display = "none";
    moodChartEmpty.style.display = "flex";
    moodChartEmpty.textContent = "No mood stats yet.";
    return;
  }

  moodChart.style.display = "block";
  moodChartEmpty.style.display = "none";

  const labels = entries.map(([mood]) => mood.charAt(0).toUpperCase() + mood.slice(1));
  const values = entries.map(([, count]) => count);
  const backgroundColors = entries.map(([mood]) => getMoodColor(mood));

  moodChartInstance = new Chart(moodChart, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: backgroundColors,
          borderColor: "#ffffff",
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 18,
            usePointStyle: true,
            boxWidth: 10,
            font: {
              size: 13
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const percent = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${context.label}: ${value} (${percent}%)`;
            }
          }
        }
      }
    }
  });
}

async function saveMood() {
  const token = requireAuth();
  if (!token) return;

  const intensity = intensityInput.value.trim();
  const notes = notesInput.value.trim();

  if (!selectedMood) {
    setStatus("Select a mood first");
    return;
  }

  setStatus("Saving mood...");
  saveMoodBtn.disabled = true;

  try {
    const res = await fetchWithAuth(`${BASE_URL}/api/mood`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mood: selectedMood,
        intensity: intensity ? Number(intensity) : null,
        notes
      })
    });

    if (!res) {
      saveMoodBtn.disabled = false;
      return;
    }

    const data = await res.json();
    saveMoodBtn.disabled = false;

    if (!res.ok) {
      setStatus(data.error || "failed to save mood");
      return;
    }

    intensityInput.value = "";
    notesInput.value = "";
    setStatus("mood saved");

    loadMoodStats();
    loadMoodHistory();
  } catch (err) {
    saveMoodBtn.disabled = false;
    setStatus("failed to save mood");
    console.error(err);
  }
}

async function loadMoodHistory() {
  const token = requireAuth();
  if (!token) return;

  setStatus("loading mood history...");
  loadMoodHistoryBtn.disabled = true;

  try {
    const res = await fetchWithAuth(`${BASE_URL}/api/mood`, {
      method: "GET"
    });

    if (!res) {
      loadMoodHistoryBtn.disabled = false;
      return;
    }

    const data = await res.json();
    loadMoodHistoryBtn.disabled = false;

    if (!res.ok) {
      setStatus(data.error || "Failed to load mood history");
      return;
    }

    const moods = data.moods || [];

    if (moods.length === 0) {
      moodHistoryList.innerHTML = `<div class="muted small">No mood entries found yet.</div>`;
      setStatus("no moods yet");
      return;
    }

    moodHistoryList.innerHTML = "";

    moods.forEach((item) => {
      const card = document.createElement("div");
      card.className = "historyCard";

      card.innerHTML = `
        <div class="historyDate">${formatDate(item.created_at)}</div>
        <div class="historyPrompt">Mood: ${item.mood}</div>
        <div class="historyAnswer">Intensity: ${item.intensity ?? "—"}</div>
        <div class="historyAnswer">${item.notes || "No notes."}</div>
      `;

      moodHistoryList.appendChild(card);
    });

    setStatus(`loaded ${moods.length} mood entr${moods.length === 1 ? "y" : "ies"}`);
  } catch (err) {
    loadMoodHistoryBtn.disabled = false;
    setStatus("failed to load mood history");
    console.error(err);
  }
}

async function loadMoodStats() {
  const token = requireAuth();
  if (!token) return;

  setMoodStatsStatus("loading mood insights...");
  loadMoodStatsBtn.disabled = true;

  try {
    const res = await fetchWithAuth(`${BASE_URL}/api/mood/stats`, {
      method: "GET"
    });

    if (!res) {
      loadMoodStatsBtn.disabled = false;
      return;
    }

    const data = await res.json();
    loadMoodStatsBtn.disabled = false;

    if (!res.ok) {
      setMoodStatsStatus(data.error || "Failed to load mood insights");
      return;
    }

    renderMoodChart(data.stats, data.total);
    setMoodStatsStatus("mood insights loaded");
  } catch (err) {
    loadMoodStatsBtn.disabled = false;
    setMoodStatsStatus("failed to load mood insights");
    console.error(err);
  }
}

moodButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    moodButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedMood = btn.dataset.mood;
    setStatus(`selected mood: ${selectedMood}`);
  });
});

saveMoodBtn.addEventListener("click", saveMood);
loadMoodHistoryBtn.addEventListener("click", loadMoodHistory);
loadMoodStatsBtn.addEventListener("click", loadMoodStats);

if (logoutBtnSide) {
  logoutBtnSide.addEventListener("click", logout);
}

window.addEventListener("DOMContentLoaded", () => {
  loadMoodStats();
});