const BASE_URL = "https://alignn-app.vercel.app";

const dashboardStatus = document.getElementById("dashboardStatus");
const reflectionCount = document.getElementById("reflectionCount");
const latestReflection = document.getElementById("latestReflection");
const lastMood = document.getElementById("lastMood");
const lastJournalEntry = document.getElementById("lastJournalEntry");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const timeGreeting = document.getElementById("timeGreeting");
const logoutBtnSide = document.getElementById("logoutBtnSide");

const aiChatForm = document.getElementById("aiChatForm");
const aiChatInput = document.getElementById("aiChatInput");
const aiChatMessages = document.getElementById("aiChatMessages");
const aiUsageText = document.getElementById("aiUsageText");
const suggestionButtons = document.querySelectorAll(".ai-suggestion-btn");
const workoutPlanCards = document.querySelectorAll(".workout-plan-card");

function setStatus(msg) {
  if (dashboardStatus) dashboardStatus.textContent = `Status: ${msg}`;
}

function logout() {
  clearSessionAndRedirect();
}

function setTimeGreeting() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Late night";
}

function goToWorkoutPlan(plan) {
  if (!plan) return;
  window.location.href = `./workout-plan.html?plan=${plan}`;
}

function setupWorkoutCardNavigation() {
  workoutPlanCards.forEach((card) => {
    card.addEventListener("click", () => {
      goToWorkoutPlan(card.dataset.plan);
    });
  });
}

function setupMobileWorkoutMenu() {
  const mobileWorkoutMenuBtn = document.getElementById("mobileWorkoutMenuBtn");
  const mobileWorkoutMenu = document.getElementById("mobileWorkoutMenu");
  const mobileWorkoutMenuClose = document.getElementById("mobileWorkoutMenuClose");

  if (!mobileWorkoutMenuBtn || !mobileWorkoutMenu) return;

  mobileWorkoutMenuBtn.addEventListener("click", () => {
    mobileWorkoutMenu.classList.remove("hidden");
  });

  if (mobileWorkoutMenuClose) {
    mobileWorkoutMenuClose.addEventListener("click", () => {
      mobileWorkoutMenu.classList.add("hidden");
    });
  }

  mobileWorkoutMenu.querySelectorAll(".mobile-workout-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      goToWorkoutPlan(btn.dataset.plan);
    });
  });
}

function updateAIUsageText(remaining, limit) {
  if (!aiUsageText) return;
  aiUsageText.textContent = `${remaining}/${limit} messages left today`;
}

async function loadAIUsage() {
  try {
    const res = await fetchWithAuth(`${BASE_URL}/api/ai/usage`, {
      method: "GET"
    });

    if (!res) return;

    const data = await res.json();

    if (!res.ok) {
      updateAIUsageText(5, 5);
      return;
    }

    updateAIUsageText(data.remaining, data.limit);
  } catch (err) {
    console.error("AI usage load error:", err);
    updateAIUsageText(5, 5);
  }
}

function addMessage(text, type) {
  if (!aiChatMessages) return;

  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");

  if (type === "user") {
    messageDiv.classList.add("user-message");
  } else {
    messageDiv.classList.add("assistant-message");
  }

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  messageDiv.appendChild(paragraph);
  aiChatMessages.appendChild(messageDiv);
  aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
}

async function sendAIMessage(userMessage) {
  try {
    const res = await fetchWithAuth(`${BASE_URL}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: userMessage })
    });

    if (!res) return;

    const data = await res.json();

    if (!res.ok) {
      addMessage(
        data.reply || "Alignn AI is unavailable right now. Please try again later.",
        "assistant"
      );

      if (typeof data.remaining === "number" && typeof data.limit === "number") {
        updateAIUsageText(data.remaining, data.limit);
      }

      return;
    }

    addMessage(data.reply, "assistant");
    updateAIUsageText(data.remaining, data.limit);
  } catch (err) {
    console.error("AI chat error:", err);
    addMessage("Alignn AI is having trouble responding right now. Please try again soon.", "assistant");
  }
}

if (aiChatForm) {
  aiChatForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const userMessage = aiChatInput.value.trim();
    if (!userMessage) return;

    addMessage(userMessage, "user");
    aiChatInput.value = "";
    aiChatInput.disabled = true;

    const submitButton = aiChatForm.querySelector("button");
    if (submitButton) submitButton.disabled = true;

    addMessage("Thinking...", "assistant");

    const thinkingMessage = aiChatMessages.lastElementChild;

    await sendAIMessage(userMessage);

    if (
      thinkingMessage &&
      thinkingMessage.classList.contains("assistant-message") &&
      thinkingMessage.textContent === "Thinking..."
    ) {
      thinkingMessage.remove();
    }

    aiChatInput.disabled = false;
    if (submitButton) submitButton.disabled = false;
    aiChatInput.focus();
  });
}

suggestionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    aiChatInput.value = button.textContent;
    aiChatInput.focus();
  });
});

async function loadProfile() {
  const token = requireAuth();
  if (!token) return;

  try {
    const res = await fetchWithAuth(`${BASE_URL}/api/auth/me`, {
      method: "GET"
    });

    if (!res) return;

    const data = await res.json();

    if (!res.ok) {
      profileName.textContent = "Béni";
      profileEmail.textContent = "Profile unavailable";
      timeGreeting.textContent = setTimeGreeting();
      return;
    }

    const user = data.user;
    saveUser(user);

    let firstName = "Béni";

    if (user.name && user.name.trim() !== "") {
      firstName = user.name.trim().split(" ")[0];
    }

    profileName.textContent = firstName;
    profileEmail.textContent = user.email || "No email available";
    timeGreeting.textContent = setTimeGreeting();
  } catch (err) {
    console.error("Profile load error:", err);
    profileName.textContent = "Béni";
    profileEmail.textContent = "Profile unavailable";
    timeGreeting.textContent = setTimeGreeting();
  }
}

async function loadDashboard() {
  const token = requireAuth();
  if (!token) return;

  setStatus("loading dashboard...");

  try {
    const [reflectionRes, moodRes, journalRes] = await Promise.all([
      fetchWithAuth(`${BASE_URL}/api/reflection`, { method: "GET" }),
      fetchWithAuth(`${BASE_URL}/api/mood`, { method: "GET" }),
      fetchWithAuth(`${BASE_URL}/api/journal`, { method: "GET" })
    ]);

    if (!reflectionRes || !moodRes || !journalRes) return;

    const reflectionData = await reflectionRes.json();
    const moodData = await moodRes.json();
    const journalData = await journalRes.json();

    if (!reflectionRes.ok) {
      setStatus(reflectionData.error || "failed to load reflections");
      return;
    }

    if (!moodRes.ok) {
      setStatus(moodData.error || "failed to load moods");
      return;
    }

    if (!journalRes.ok) {
      setStatus(journalData.error || "failed to load journal entries");
      return;
    }

    const reflections = reflectionData.reflections || [];
    const moods = moodData.moods || [];
    const journalEntries = journalData.entries || [];

    reflectionCount.textContent = reflections.length;

    latestReflection.textContent =
      reflections.length > 0
        ? reflections[0].prompt || "No prompt available."
        : "No reflections yet.";

    if (moods.length > 0) {
      const latestMood = moods[0];

      const moodText = latestMood.mood
        ? latestMood.mood.charAt(0).toUpperCase() + latestMood.mood.slice(1)
        : "Unknown mood";

      const intensityText = latestMood.intensity
        ? ` • Intensity ${latestMood.intensity}`
        : "";

      lastMood.textContent = `${moodText}${intensityText}`;
    } else {
      lastMood.textContent = "No moods yet.";
    }

    if (journalEntries.length > 0) {
      const latestJournal = journalEntries[0];

      lastJournalEntry.textContent =
        latestJournal.title ||
        latestJournal.prompt ||
        latestJournal.content ||
        "Untitled entry";
    } else {
      lastJournalEntry.textContent = "No journal entries yet.";
    }

    setStatus("dashboard loaded");
  } catch (err) {
    console.error("Dashboard load error:", err);
    setStatus("failed to load dashboard");
  }
}

if (logoutBtnSide) {
  logoutBtnSide.addEventListener("click", logout);
}

setupWorkoutCardNavigation();
setupMobileWorkoutMenu();

if (timeGreeting) {
  timeGreeting.textContent = setTimeGreeting();
}

loadProfile();
loadDashboard();
loadAIUsage();