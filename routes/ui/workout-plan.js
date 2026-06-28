const BASE_URL = "http://localhost:5000";

const planTitle = document.getElementById("planTitle");
const planCategory = document.getElementById("planCategory");
const planDescription = document.getElementById("planDescription");
const levelsContainer = document.getElementById("levelsContainer");
const videosContainer = document.getElementById("videosContainer");
const selectedProgramContainer = document.getElementById("selectedProgramContainer");
const levelSectionTitle = document.getElementById("levelSectionTitle");
const videoSectionTitle = document.getElementById("videoSectionTitle");
const backBtn = document.getElementById("backBtn");
const categoryButtons = document.querySelectorAll(".workout-category-btn");

const workoutBgImage = document.getElementById("workoutBgImage");
const workoutBgVideo = document.getElementById("workoutBgVideo");

function updateWorkoutBackground(planKey) {
  if (!workoutBgImage || !workoutBgVideo) return;

  workoutBgImage.classList.remove("active-bg");
  workoutBgVideo.classList.remove("active-bg");

  if (planKey === "recovery") {
    workoutBgVideo.classList.add("active-bg");
    workoutBgVideo.play().catch(() => {});
    return;
  }

  workoutBgImage.classList.add("active-bg");

  if (planKey === "nutrition") {
    workoutBgImage.src = "./backgrounds/nutrition.jpg";
  } else {
    workoutBgImage.src = "./backgrounds/fitness.jpg";
  }
}
let currentPlan = null;
let workoutVideoInterval = null;

const specialLevelTitles = {
  nutrition: "Choose Your Goal and Learn More",
  recovery: "Choose Your Recovery Support"
};

if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.href = "./dashboard.html";
  });
}

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const plan = button.dataset.plan;
    if (!plan) return;

    window.location.href = `./workout-plan.html?plan=${plan}`;
  });
});

function getCurrentSlug() {
  const params = new URLSearchParams(window.location.search);
  return params.get("plan") || "build-muscle";
}

function highlightActiveCategory(slug) {
  categoryButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.plan === slug);
  });
}

async function loadWorkoutPlan() {
  const token = requireAuth();
  if (!token) return;

  const slug = getCurrentSlug();
  highlightActiveCategory(slug);
  updateWorkoutBackground(slug);

  try {
    const res = await fetchWithAuth(`${BASE_URL}/api/workout-plans/${slug}`, {
      method: "GET"
    });

    const data = await res.json();

    if (!res.ok) {
      showPageError("Unable to load workout plan", data.message || data.error || "Server error.");
      return;
    }

    currentPlan = data;
    renderWorkoutPlan(data);
  } catch (error) {
    console.error("Workout page error:", error);
    showPageError("Unable to load workout plan", error.message || "Something went wrong.");
  }
}

function showPageError(title, message) {
  planTitle.textContent = title;
  planDescription.textContent = message;
  planCategory.textContent = "";
  levelsContainer.innerHTML = "";
  videosContainer.innerHTML = "";
  selectedProgramContainer.innerHTML = "";
}

function renderWorkoutPlan(plan) {
  planTitle.textContent = plan.title || "Workout Plan";
  planCategory.style.display = "none";
  planDescription.textContent = plan.description || "";

  const slug = plan.slug;

  if (videoSectionTitle) {
    videoSectionTitle.style.display = "none";
    videoSectionTitle.textContent = "";
  }

  levelSectionTitle.textContent = specialLevelTitles[slug] || "Choose Your Level";

  const topVideos = (plan.videos || []).filter((video) => {
    return normalizeText(video.category) === normalizeText("Educational Video");
  });

  renderVideos(topVideos);

  renderLevelCards(plan.levels || [], slug);
}

function clearWorkoutCarousel() {
  if (workoutVideoInterval) {
    clearInterval(workoutVideoInterval);
    workoutVideoInterval = null;
  }
}

function getYouTubeId(url) {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/);
  return match ? match[1] : "";
}

function getYouTubeThumbnail(url) {
  const videoId = getYouTubeId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
}

function renderVideos(videos) {
  videosContainer.innerHTML = "";
  videosContainer.classList.remove("video-carousel");
  clearWorkoutCarousel();

  if (!videos.length) {
    videosContainer.innerHTML = `
      <div class="workout-empty-box">
        No educational videos added yet.
      </div>
    `;
    return;
  }

  videosContainer.classList.add("video-carousel");

  let currentIndex = 0;

  function showVideo(index) {
    const video = videos[index];
    const thumbnail = getYouTubeThumbnail(video.video_url);

    videosContainer.innerHTML = `
      <a class="workout-video-card active-video" href="${video.video_url}" target="_blank" rel="noopener noreferrer">
        ${thumbnail ? `<img src="${thumbnail}" alt="${video.title}" />` : ""}

        <div class="video-dots">
          ${videos
            .map(
              (_, dotIndex) => `
                <button 
                  class="video-dot ${dotIndex === index ? "active" : ""}" 
                  type="button">
                </button>
              `
            )
            .join("")}
        </div>
      </a>
    `;

    document.querySelectorAll(".video-dot").forEach((dot, dotIndex) => {
      dot.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        currentIndex = dotIndex;
        showVideo(currentIndex);
      });
    });
  }

  showVideo(currentIndex);

  workoutVideoInterval = setInterval(() => {
    currentIndex = (currentIndex + 1) % videos.length;
    showVideo(currentIndex);
  }, 4000);
}

function renderLevelCards(levels, slug) {
  levelsContainer.innerHTML = "";
  selectedProgramContainer.innerHTML = "";

  if (!levels.length) {
    levelsContainer.innerHTML = `
      <div class="workout-empty-box">
        This plan exists, but no cards have been added yet.
      </div>
    `;
    return;
  }

  const sortedLevels = [...levels].sort((a, b) => (a.sort_order || 1) - (b.sort_order || 1));

  sortedLevels.forEach((level) => {
    const card = document.createElement("button");
    card.className = "workout-level-choice";
    card.type = "button";

    card.innerHTML = `
      <h3>${level.level}</h3>
      <p>${level.focus || "Tap to view details"}</p>
    `;

    card.addEventListener("click", () => {
      document.querySelectorAll(".workout-level-choice").forEach((btn) => {
        btn.classList.remove("active");
      });

      card.classList.add("active");
      renderSelectedProgram(level, slug);
    });

    levelsContainer.appendChild(card);
  });
}

function renderSelectedProgram(level, slug) {
  if (slug === "nutrition") {
    selectedProgramContainer.innerHTML = `
      <article class="selected-program-card workout-program-outline nutrition-selected-card">
        ${renderNutritionVideos(level)}
      </article>
    `;

    selectedProgramContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (slug === "recovery" && level.level === "Recovery Resources") {
    selectedProgramContainer.innerHTML = `
      <article class="selected-program-card workout-program-outline recovery-resources-card">
        ${renderRecoveryResourcesVideos()}
      </article>
    `;

    selectedProgramContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (slug === "recovery" && level.level === "Recovery Nutrition") {
    selectedProgramContainer.innerHTML = `
      <article class="selected-program-card workout-program-outline recovery-resources-card">
        ${renderRecoveryNutrition()}
      </article>
    `;

    selectedProgramContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const exercises = level.workout_exercises || [];
  const sortedExercises = [...exercises].sort((a, b) => (a.sort_order || 1) - (b.sort_order || 1));

  const isRecoveryWorkout = slug === "recovery" && level.level === "Recovery Workouts";

  selectedProgramContainer.innerHTML = `
    <article class="selected-program-card workout-program-outline">

      ${
        isRecoveryWorkout
          ? ""
          : `
          
            <div class="outline-section">
              <h4>Frequency</h4>
              <ul>
                ${(level.frequency || "Not listed yet")
                  .split(".")
                  .filter((item) => item.trim())
                  .map((item) => `<li>${item.trim()}</li>`)
                  .join("")}
              </ul>
            </div>

            <div class="outline-section">
              <h4>Format</h4>
              <ul>
                ${(level.format || "Not listed yet")
                  .split(".")
                  .filter((item) => item.trim())
                  .map((item) => `<li>${item.trim()}</li>`)
                  .join("")}
              </ul>
            </div>
          `
      }

      <div class="outline-section">
        <h4>${slug === "progressive-overload" ? "Examples" : "Exercises"}</h4>
        <ul>
          ${
            sortedExercises.length
              ? sortedExercises.map((exercise) => `<li>${exercise.name}</li>`).join("")
              : `<li>No details added yet.</li>`
          }
        </ul>
      </div>
    </article>
  `;

  selectedProgramContainer.scrollIntoView({ behavior: "smooth", block: "start" });
}

function normalizeText(value) {
  return (value || "").toLowerCase().trim();
}

function renderNutritionVideos(level) {
  const videos = currentPlan?.videos || [];

  const matchingVideos = videos.filter((video) => {
    return normalizeText(video.category) === normalizeText(level.level);
  });

  if (!matchingVideos.length) {
    return `
      <div class="nutrition-selected-videos">
        <h3>${level.level}</h3>
        <p class="muted">No videos added yet.</p>
      </div>
    `;
  }

  return `
    <div class="nutrition-selected-videos">
      <h3>${level.level}</h3>

      <div class="nutrition-video-list">
        ${matchingVideos
          .map((video) => {
            const thumbnail = getYouTubeThumbnail(video.video_url);

            return `
              <a class="nutrition-video-item" href="${video.video_url}" target="_blank" rel="noopener noreferrer">
                ${thumbnail ? `<img src="${thumbnail}" alt="${video.title}" />` : ""}
                <span class="nutrition-video-title">${video.title}</span>
              </a>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderRecoveryResourcesVideos() {
  const videos = currentPlan?.videos || [];

  const groups = [
    "Yoga",
    "Pilates",
    "Mobility & Stretching",
    "Breathwork & Relaxation",
    "Sleep & Recovery"
  ];

  return `
    <div class="recovery-resource-layout">
      ${groups
        .map((group) => {
          const groupVideos = videos.filter((video) => {
            return normalizeText(video.category) === normalizeText(group);
          });

          return `
            <section class="recovery-resource-box">
              <h3>${group}</h3>

              ${
                groupVideos.length
                  ? `<ul>
                      ${groupVideos
                        .map((video) => {
                          const thumbnail = getYouTubeThumbnail(video.video_url);

                          return `
                            <li>
                              <a class="recovery-resource-link" href="${video.video_url}" target="_blank" rel="noopener noreferrer">
                                ${thumbnail ? `<img src="${thumbnail}" alt="${video.title}" />` : ""}
                                <span>${video.title}</span>
                              </a>
                            </li>
                          `;
                        })
                        .join("")}
                    </ul>`
                  : `<p class="muted">No videos added yet.</p>`
              }
            </section>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderRecoveryNutrition() {
  return `
    <div class="recovery-resource-layout">

      <section class="recovery-resource-box">
        <h3>🥩 Protein & Muscle Repair</h3>
        <ul>
          <li>Chicken</li>
          <li>Turkey</li>
          <li>Fish</li>
          <li>Eggs</li>
          <li>Greek Yogurt</li>
          <li>Cottage Cheese</li>
          <li>Tofu</li>
          <li>Lentils</li>
          <li>Beans</li>
        </ul>
      </section>

      <section class="recovery-resource-box">
        <h3>💧 Hydration & Electrolytes</h3>
        <ul>
          <li>Water</li>
          <li>Coconut Water</li>
          <li>Electrolyte Drinks</li>
          <li>Watermelon</li>
          <li>Oranges</li>
          <li>Cucumbers</li>
        </ul>
      </section>

      <section class="recovery-resource-box">
        <h3>🥑 Anti-Inflammatory Nutrition</h3>
        <ul>
          <li>Berries</li>
          <li>Leafy Greens</li>
          <li>Olive Oil</li>
          <li>Avocados</li>
          <li>Salmon</li>
        </ul>
      </section>

      <section class="recovery-resource-box">
        <h3>🍽️ Recovery Meals</h3>
        <ul>
          <li>Chicken + Rice + Vegetables</li>
          <li>Salmon + Sweet Potato + Broccoli</li>
          <li>Greek Yogurt + Fruit</li>
          <li>Eggs + Toast + Fruit</li>
          <li>Protein Smoothie</li>
        </ul>
      </section>

      <section class="recovery-resource-box">
        <h3>💊 Supplements & Recovery Support</h3>

        <ul class="supplement-video-list">
          <li>
            <a href="https://www.youtube.com/watch?v=NclX6EW0pr0&t=98s"
               target="_blank"
               rel="noopener noreferrer"
               class="recovery-resource-link">
              <img src="${getYouTubeThumbnail("https://www.youtube.com/watch?v=NclX6EW0pr0&t=98s")}" alt="Creatine">
              <span>What Does Creatine Do?</span>
            </a>
          </li>

          <li>
            <a href="https://www.youtube.com/watch?v=97y5gQQ3gTA"
               target="_blank"
               rel="noopener noreferrer"
               class="recovery-resource-link">
              <img src="${getYouTubeThumbnail("https://www.youtube.com/watch?v=97y5gQQ3gTA")}" alt="Magnesium">
              <span>Why You Should Take Magnesium</span>
            </a>
          </li>

          <li>
            <a href="https://www.youtube.com/watch?v=iLDYbSX5MLA"
               target="_blank"
               rel="noopener noreferrer"
               class="recovery-resource-link">
              <img src="${getYouTubeThumbnail("https://www.youtube.com/watch?v=iLDYbSX5MLA")}" alt="Vitamin D">
              <span>Why You Need Vitamin D</span>
            </a>
          </li>
        </ul>
      </section>

    </div>
  `;
}

loadWorkoutPlan();