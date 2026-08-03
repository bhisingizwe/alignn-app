const BASE_URL = "https://alignn-app.vercel.app";

const historyList = document.getElementById("historyList");
const detailTitle = document.getElementById("detailTitle");
const historyDetailSection = document.getElementById(
  "historyDetailSection"
);

const logoutBtn = document.getElementById("logoutBtn");
const mobileLogoutBtn = document.getElementById(
  "mobileLogoutBtn"
);

const mobileMenuBtn = document.getElementById(
  "mobileMenuBtn"
);

const mobileMenuClose = document.getElementById(
  "mobileMenuClose"
);

const mobileMenuOverlay = document.getElementById(
  "mobileMenuOverlay"
);

const mobileWorkoutMenu = document.getElementById(
  "mobileWorkoutMenu"
);

const reflectionCount = document.getElementById(
  "reflectionCount"
);

const moodCount = document.getElementById("moodCount");

const journalCount = document.getElementById(
  "journalCount"
);

const checkinCount = document.getElementById(
  "checkinCount"
);

const reflectionLatest = document.getElementById(
  "reflectionLatest"
);

const moodLatest = document.getElementById(
  "moodLatest"
);

const journalLatest = document.getElementById(
  "journalLatest"
);

const checkinLatest = document.getElementById(
  "checkinLatest"
);

const historyCards = document.querySelectorAll(
  ".history-summary-card"
);

const mobileMenuLinks = document.querySelectorAll(
  ".mobile-nav-link, .mobile-workout-link"
);

let historyData = {
  reflections: [],
  moods: [],
  journals: [],
  checkins: []
};

function logout() {
  clearSessionAndRedirect();
}

function openMobileMenu() {
  if (!mobileWorkoutMenu || !mobileMenuOverlay) {
    return;
  }

  mobileWorkoutMenu.classList.remove("hidden");
  mobileMenuOverlay.classList.remove("hidden");

  mobileWorkoutMenu.setAttribute(
    "aria-hidden",
    "false"
  );

  mobileMenuOverlay.setAttribute(
    "aria-hidden",
    "false"
  );

  mobileMenuBtn?.setAttribute(
    "aria-expanded",
    "true"
  );

  document.body.classList.add("mobile-menu-open");
}

function closeMobileMenu() {
  if (!mobileWorkoutMenu || !mobileMenuOverlay) {
    return;
  }

  mobileWorkoutMenu.classList.add("hidden");
  mobileMenuOverlay.classList.add("hidden");

  mobileWorkoutMenu.setAttribute(
    "aria-hidden",
    "true"
  );

  mobileMenuOverlay.setAttribute(
    "aria-hidden",
    "true"
  );

  mobileMenuBtn?.setAttribute(
    "aria-expanded",
    "false"
  );

  document.body.classList.remove("mobile-menu-open");
}

function formatDate(dateString) {
  if (!dateString) {
    return "No date available";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "No date available";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function formatEntryCount(count) {
  return `${count} ${count === 1 ? "entry" : "entries"}`;
}

function getLatest(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return items[0];
}

function updateSummaryCards() {
  const latestReflection = getLatest(
    historyData.reflections
  );

  const latestMood = getLatest(
    historyData.moods
  );

  const latestJournal = getLatest(
    historyData.journals
  );

  const latestCheckin = getLatest(
    historyData.checkins
  );

  reflectionCount.textContent = formatEntryCount(
    historyData.reflections.length
  );

  moodCount.textContent = formatEntryCount(
    historyData.moods.length
  );

  journalCount.textContent = formatEntryCount(
    historyData.journals.length
  );

  checkinCount.textContent = formatEntryCount(
    historyData.checkins.length
  );

  reflectionLatest.textContent = latestReflection
    ? formatDate(latestReflection.created_at)
    : "No reflections yet";

  moodLatest.textContent = latestMood
    ? formatDate(latestMood.created_at)
    : "No mood logs yet";

  journalLatest.textContent = latestJournal
    ? formatDate(latestJournal.created_at)
    : "No journal entries yet";

  checkinLatest.textContent = latestCheckin
    ? formatDate(latestCheckin.created_at)
    : "No check-ins yet";
}

async function fetchHistory(endpoint) {
  const response = await fetchWithAuth(
    `${BASE_URL}${endpoint}`,
    {
      method: "GET"
    }
  );

  if (!response) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Failed to load history"
    );
  }

  return data;
}

async function loadHistory() {
  const token = requireAuth();

  if (!token) {
    return;
  }

  try {
    const [
      reflectionData,
      moodData,
      journalData,
      checkinData
    ] = await Promise.all([
      fetchHistory("/api/reflection"),
      fetchHistory("/api/mood"),
      fetchHistory("/api/journal"),
      fetchHistory("/api/checkin")
    ]);

    historyData.reflections =
      reflectionData?.reflections || [];

    historyData.moods =
      moodData?.moods || [];

    historyData.journals =
      journalData?.entries || [];

    historyData.checkins =
      checkinData?.checkins || [];

    updateSummaryCards();
  } catch (error) {
    console.error(
      "Unable to load history:",
      error
    );
  }
}

function clearActiveCards() {
  historyCards.forEach((card) => {
    card.classList.remove("active");
  });
}

function createHistoryCard({
  date,
  title,
  lines = []
}) {
  const card = document.createElement("article");
  card.className = "historyCard";

  const dateElement = document.createElement("div");
  dateElement.className = "historyDate";
  dateElement.textContent = formatDate(date);

  const titleElement = document.createElement("div");
  titleElement.className = "historyPrompt";
  titleElement.textContent = title;

  card.appendChild(dateElement);
  card.appendChild(titleElement);

  lines.forEach((line) => {
    const answerElement =
      document.createElement("div");

    answerElement.className = "historyAnswer";
    answerElement.textContent = line;

    card.appendChild(answerElement);
  });

  return card;
}

function showEmptyMessage(message) {
  historyList.innerHTML = "";

  const emptyMessage =
    document.createElement("div");

  emptyMessage.className =
    "muted small history-empty-message";

  emptyMessage.textContent = message;

  historyList.appendChild(emptyMessage);
}

function scrollToHistoryDetails() {
  if (!historyDetailSection) {
    return;
  }

  window.requestAnimationFrame(() => {
    historyDetailSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}

function renderReflectionHistory() {
  detailTitle.textContent = "Reflection History";

  if (historyData.reflections.length === 0) {
    showEmptyMessage(
      "No reflections found yet."
    );

    return;
  }

  historyData.reflections.forEach((item) => {
    const card = createHistoryCard({
      date: item.created_at,
      title:
        item.prompt || "Reflection Prompt",
      lines: [
        item.answer || "No answer saved."
      ]
    });

    historyList.appendChild(card);
  });
}

function renderMoodHistory() {
  detailTitle.textContent = "Mood History";

  if (historyData.moods.length === 0) {
    showEmptyMessage(
      "No mood entries found yet."
    );

    return;
  }

  historyData.moods.forEach((item) => {
    const card = createHistoryCard({
      date: item.created_at,
      title: `Mood: ${
        item.mood || "Unknown"
      }`,
      lines: [
        `Intensity: ${
          item.intensity ?? "—"
        }`,
        item.notes || "No notes."
      ]
    });

    historyList.appendChild(card);
  });
}

function renderJournalHistory() {
  detailTitle.textContent = "Journal History";

  if (historyData.journals.length === 0) {
    showEmptyMessage(
      "No journal entries found yet."
    );

    return;
  }

  historyData.journals.forEach((item) => {
    const card = createHistoryCard({
      date: item.created_at,
      title:
        item.title || "Untitled Entry",
      lines: [
        item.content || "No content saved."
      ]
    });

    historyList.appendChild(card);
  });
}

function renderCheckinHistory() {
  detailTitle.textContent = "Check-In History";

  if (historyData.checkins.length === 0) {
    showEmptyMessage(
      "No check-ins found yet."
    );

    return;
  }

  historyData.checkins.forEach((item) => {
    const card = createHistoryCard({
      date: item.created_at,
      title: `Mental state: ${
        item.mental_state || "Unknown"
      }`,
      lines: [
        item.reflection ||
          "No reflection added."
      ]
    });

    historyList.appendChild(card);
  });
}

function renderDetails(type) {
  clearActiveCards();

  const activeCard = document.querySelector(
    `.history-summary-card[data-type="${type}"]`
  );

  if (activeCard) {
    activeCard.classList.add("active");
  }

  historyList.innerHTML = "";

  switch (type) {
    case "reflections":
      renderReflectionHistory();
      break;

    case "moods":
      renderMoodHistory();
      break;

    case "journals":
      renderJournalHistory();
      break;

    case "checkins":
      renderCheckinHistory();
      break;

    default:
      detailTitle.textContent = "Select a card";

      showEmptyMessage(
        "Click a history card above to view entries."
      );

      return;
  }

  scrollToHistoryDetails();
}

historyCards.forEach((card) => {
  card.addEventListener("click", () => {
    renderDetails(card.dataset.type);
  });
});

mobileMenuBtn?.addEventListener(
  "click",
  openMobileMenu
);

mobileMenuClose?.addEventListener(
  "click",
  closeMobileMenu
);

mobileMenuOverlay?.addEventListener(
  "click",
  closeMobileMenu
);

mobileMenuLinks.forEach((link) => {
  link.addEventListener(
    "click",
    closeMobileMenu
  );
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMobileMenu();
  }
});

logoutBtn?.addEventListener(
  "click",
  logout
);

mobileLogoutBtn?.addEventListener(
  "click",
  logout
);

window.addEventListener(
  "DOMContentLoaded",
  loadHistory
);