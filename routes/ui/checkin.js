const BASE_URL = "https://alignn-app.vercel.app";

const mentalStateInput = document.getElementById("mentalStateInput");
const reflectionInput = document.getElementById("reflectionInput");
const saveCheckinBtn = document.getElementById("saveCheckinBtn");
const loadCheckinHistoryBtn = document.getElementById("loadCheckinHistoryBtn");
const checkinStatus = document.getElementById("checkinStatus");
const checkinHistoryList = document.getElementById("checkinHistoryList");
const logoutBtnSide = document.getElementById("logoutBtnSide");

function setStatus(msg) {
  checkinStatus.textContent = `Status: ${msg}`;
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

async function saveCheckin() {
  const token = requireAuth();
  if (!token) return;

  const mental_state = mentalStateInput.value.trim();
  const reflection = reflectionInput.value.trim();

  if (!mental_state) {
    setStatus("Enter your mental state first");
    return;
  }

  setStatus("Saving check-in...");
  saveCheckinBtn.disabled = true;

  try {
    const res = await fetchWithAuth(`${BASE_URL}/api/checkin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mental_state,
        reflection
      })
    });

    if (!res) {
      saveCheckinBtn.disabled = false;
      return;
    }

    const data = await res.json();
    saveCheckinBtn.disabled = false;

    if (!res.ok) {
      setStatus(data.error || "Failed to save check-in");
      return;
    }

    mentalStateInput.value = "";
    reflectionInput.value = "";
    setStatus("check-in saved");

    loadCheckinHistory();
  } catch (err) {
    saveCheckinBtn.disabled = false;
    setStatus("server error");
    console.error(err);
  }
}

async function loadCheckinHistory() {
  const token = requireAuth();
  if (!token) return;

  setStatus("loading check-in history...");
  loadCheckinHistoryBtn.disabled = true;

  try {
    const res = await fetchWithAuth(`${BASE_URL}/api/checkin`, {
      method: "GET"
    });

    if (!res) {
      loadCheckinHistoryBtn.disabled = false;
      return;
    }

    const data = await res.json();
    loadCheckinHistoryBtn.disabled = false;

    if (!res.ok) {
      setStatus(data.error || "failed to load check-ins");
      return;
    }

    const checkins = data.checkins || [];

    if (checkins.length === 0) {
      checkinHistoryList.innerHTML = `
        <div class="muted small">No check-ins found yet.</div>
      `;
      setStatus("no check-ins yet");
      return;
    }

    checkinHistoryList.innerHTML = "";

    checkins.forEach((item) => {
      const card = document.createElement("div");
      card.className = "historyCard";

      card.innerHTML = `
        <div class="historyDate">${formatDate(item.created_at)}</div>
        <div class="historyPrompt">Mental state: ${item.mental_state}</div>
        <div class="historyAnswer">${item.reflection || "No reflection added."}</div>
      `;

      checkinHistoryList.appendChild(card);
    });

    setStatus(`loaded ${checkins.length} check-in(s)`);
  } catch (err) {
    loadCheckinHistoryBtn.disabled = false;
    setStatus("server error");
    console.error(err);
  }
}

saveCheckinBtn.addEventListener("click", saveCheckin);
loadCheckinHistoryBtn.addEventListener("click", loadCheckinHistory);

if (logoutBtnSide) {
  logoutBtnSide.addEventListener("click", logout);
}

window.addEventListener("DOMContentLoaded", () => {
  loadCheckinHistory();
});