const BASE_URL = "https://alignn-app.vercel.app";

/* =====================================================
   PAGE ELEMENTS
===================================================== */

const planTitle = document.getElementById("planTitle");
const planCategory = document.getElementById("planCategory");
const planDescription = document.getElementById("planDescription");

const levelsContainer = document.getElementById("levelsContainer");
const videosContainer = document.getElementById("videosContainer");

const selectedProgramContainer = document.getElementById(
  "selectedProgramContainer"
);

const levelSectionTitle = document.getElementById(
  "levelSectionTitle"
);

const videoSectionTitle = document.getElementById(
  "videoSectionTitle"
);

/* =====================================================
   DESKTOP NAVIGATION
===================================================== */

const backBtn = document.getElementById("backBtn");

const categoryButtons = document.querySelectorAll(
  ".workout-category-btn"
);

/* =====================================================
   MOBILE NAVIGATION
===================================================== */

const mobileWorkoutMenuBtn = document.getElementById(
  "mobileWorkoutMenuBtn"
);

const mobileWorkoutMenu = document.getElementById(
  "mobileWorkoutMenu"
);

const mobileWorkoutMenuClose = document.getElementById(
  "mobileWorkoutMenuClose"
);

const mobileWorkoutMenuOverlay = document.getElementById(
  "mobileWorkoutMenuOverlay"
);

const mobileWorkoutLogoutBtn = document.getElementById(
  "mobileWorkoutLogoutBtn"
);

const mobileWorkoutLinks = document.querySelectorAll(
  ".mobile-workout-link"
);

/* =====================================================
   BACKGROUND ELEMENTS
===================================================== */

const workoutBgImage = document.getElementById(
  "workoutBgImage"
);

const workoutBgVideo = document.getElementById(
  "workoutBgVideo"
);

/* =====================================================
   PAGE STATE
===================================================== */

let currentPlan = null;
let workoutVideoInterval = null;

const specialLevelTitles = {
  nutrition: "Choose Your Goal and Learn More",
  recovery: "Choose Your Recovery Support"
};

/* =====================================================
   GENERAL HELPERS
===================================================== */

function getCurrentSlug() {
  const params = new URLSearchParams(window.location.search);

  return params.get("plan") || "build-muscle";
}

function goToDashboard() {
  window.location.href = "./dashboard.html";
}

function goToWorkoutPlan(plan) {
  if (!plan) return;

  window.location.href =
    `./workout-plan.html?plan=${encodeURIComponent(plan)}`;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .trim();
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  element.textContent = text;

  return element;
}

/* =====================================================
   MOBILE MENU
===================================================== */

function openWorkoutMenu() {
  if (!mobileWorkoutMenu || !mobileWorkoutMenuOverlay) {
    return;
  }

  mobileWorkoutMenu.classList.remove("hidden");
  mobileWorkoutMenuOverlay.classList.remove("hidden");

  mobileWorkoutMenu.setAttribute("aria-hidden", "false");
  mobileWorkoutMenuOverlay.setAttribute(
    "aria-hidden",
    "false"
  );

  if (mobileWorkoutMenuBtn) {
    mobileWorkoutMenuBtn.setAttribute(
      "aria-expanded",
      "true"
    );
  }

  document.body.classList.add("mobile-menu-open");
}

function closeWorkoutMenu() {
  if (!mobileWorkoutMenu || !mobileWorkoutMenuOverlay) {
    return;
  }

  mobileWorkoutMenu.classList.add("hidden");
  mobileWorkoutMenuOverlay.classList.add("hidden");

  mobileWorkoutMenu.setAttribute("aria-hidden", "true");
  mobileWorkoutMenuOverlay.setAttribute(
    "aria-hidden",
    "true"
  );

  if (mobileWorkoutMenuBtn) {
    mobileWorkoutMenuBtn.setAttribute(
      "aria-expanded",
      "false"
    );
  }

  document.body.classList.remove("mobile-menu-open");
}

function setupNavigation() {
  if (backBtn) {
    backBtn.addEventListener("click", goToDashboard);
  }

  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      goToWorkoutPlan(button.dataset.plan);
    });
  });

  if (mobileWorkoutMenuBtn) {
    mobileWorkoutMenuBtn.addEventListener(
      "click",
      openWorkoutMenu
    );
  }

  if (mobileWorkoutMenuClose) {
    mobileWorkoutMenuClose.addEventListener(
      "click",
      closeWorkoutMenu
    );
  }

  if (mobileWorkoutMenuOverlay) {
    mobileWorkoutMenuOverlay.addEventListener(
      "click",
      closeWorkoutMenu
    );
  }

  mobileWorkoutLinks.forEach((button) => {
    button.addEventListener("click", () => {
      const plan = button.dataset.plan;

      if (!plan) return;

      closeWorkoutMenu();
      goToWorkoutPlan(plan);
    });
  });

  if (mobileWorkoutMenu) {
    mobileWorkoutMenu
      .querySelectorAll("a")
      .forEach((link) => {
        link.addEventListener(
          "click",
          closeWorkoutMenu
        );
      });
  }

  if (mobileWorkoutLogoutBtn) {
    mobileWorkoutLogoutBtn.addEventListener(
      "click",
      () => {
        closeWorkoutMenu();
        clearSessionAndRedirect();
      }
    );
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeWorkoutMenu();
    }
  });
}

/* =====================================================
   ACTIVE CATEGORY
===================================================== */

function highlightActiveCategory(slug) {
  categoryButtons.forEach((button) => {
    const isActive = button.dataset.plan === slug;

    button.classList.toggle("active", isActive);
    button.setAttribute(
      "aria-pressed",
      String(isActive)
    );
  });

  mobileWorkoutLinks.forEach((button) => {
    const isActive = button.dataset.plan === slug;

    button.classList.toggle("active", isActive);
    button.setAttribute(
      "aria-current",
      isActive ? "page" : "false"
    );
  });
}

/* =====================================================
   PAGE BACKGROUND
===================================================== */

function updateWorkoutBackground(planKey) {
  if (!workoutBgImage || !workoutBgVideo) {
    return;
  }

  workoutBgImage.classList.remove("active-bg");
  workoutBgVideo.classList.remove("active-bg");

  workoutBgVideo.pause();

  if (planKey === "recovery") {
    workoutBgVideo.classList.add("active-bg");

    workoutBgVideo
      .play()
      .catch(() => {});

    return;
  }

  workoutBgImage.classList.add("active-bg");

  if (planKey === "nutrition") {
    workoutBgImage.src =
      "./backgrounds/nutrition.jpg";
  } else {
    workoutBgImage.src =
      "./backgrounds/fitness.jpg";
  }
}

/* =====================================================
   ERROR DISPLAY
===================================================== */

function showPageError(title, message) {
  if (planTitle) {
    planTitle.textContent = title;
  }

  if (planDescription) {
    planDescription.textContent = message;
  }

  if (planCategory) {
    planCategory.textContent = "";
    planCategory.style.display = "none";
  }

  if (levelsContainer) {
    levelsContainer.innerHTML = "";
  }

  if (videosContainer) {
    videosContainer.innerHTML = "";
  }

  if (selectedProgramContainer) {
    selectedProgramContainer.innerHTML = "";
  }
}

/* =====================================================
   LOAD WORKOUT PLAN
===================================================== */

async function loadWorkoutPlan() {
  const token = requireAuth();

  if (!token) return;

  const slug = getCurrentSlug();

  highlightActiveCategory(slug);
  updateWorkoutBackground(slug);

  try {
    const response = await fetchWithAuth(
      `${BASE_URL}/api/workout-plans/${encodeURIComponent(slug)}`,
      {
        method: "GET"
      }
    );

    if (!response) return;

    const data = await response.json();

    if (!response.ok) {
      showPageError(
        "Unable to load workout plan",
        data.message ||
          data.error ||
          "The workout plan could not be loaded."
      );

      return;
    }

    currentPlan = data;
    renderWorkoutPlan(data);
  } catch (error) {
    console.error("Workout page error:", error);

    showPageError(
      "Unable to load workout plan",
      error.message ||
        "Something went wrong while loading this page."
    );
  }
}

/* =====================================================
   RENDER MAIN WORKOUT PAGE
===================================================== */

function renderWorkoutPlan(plan) {
  if (
    !planTitle ||
    !planDescription ||
    !levelsContainer ||
    !videosContainer
  ) {
    return;
  }

  const slug = plan.slug || getCurrentSlug();

  planTitle.textContent =
    plan.title || "Workout Plan";

  planDescription.textContent =
    plan.description || "";

  if (planCategory) {
    planCategory.textContent = "";
    planCategory.style.display = "none";
  }

  if (videoSectionTitle) {
    videoSectionTitle.textContent = "";
    videoSectionTitle.style.display = "none";
  }

  if (levelSectionTitle) {
    levelSectionTitle.textContent =
      specialLevelTitles[slug] ||
      "Choose Your Level";
  }

  const educationalVideos = (
    plan.videos || []
  ).filter((video) => {
    return (
      normalizeText(video.category) ===
      normalizeText("Educational Video")
    );
  });

  renderVideos(educationalVideos);
  renderLevelCards(plan.levels || [], slug);
}

/* =====================================================
   YOUTUBE HELPERS
===================================================== */

function getYouTubeId(url) {
  if (!url) return "";

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname
        .replace("/", "")
        .split("/")[0];
    }

    if (
      parsedUrl.hostname.includes("youtube.com")
    ) {
      if (parsedUrl.pathname.includes("/embed/")) {
        return parsedUrl.pathname
          .split("/embed/")[1]
          .split("/")[0];
      }

      if (parsedUrl.pathname.includes("/shorts/")) {
        return parsedUrl.pathname
          .split("/shorts/")[1]
          .split("/")[0];
      }

      return parsedUrl.searchParams.get("v") || "";
    }
  } catch (error) {
    const fallbackMatch = String(url).match(
      /(?:v=|youtu\.be\/|embed\/|shorts\/)([^&?/]+)/
    );

    return fallbackMatch
      ? fallbackMatch[1]
      : "";
  }

  return "";
}

function getYouTubeThumbnail(url) {
  const videoId = getYouTubeId(url);

  return videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : "";
}

/* =====================================================
   VIDEO CAROUSEL
===================================================== */

function clearWorkoutCarousel() {
  if (!workoutVideoInterval) return;

  clearInterval(workoutVideoInterval);
  workoutVideoInterval = null;
}

function renderVideos(videos) {
  if (!videosContainer) return;

  videosContainer.innerHTML = "";
  videosContainer.classList.remove(
    "video-carousel"
  );

  clearWorkoutCarousel();

  if (!Array.isArray(videos) || videos.length === 0) {
    const emptyBox = createTextElement(
      "div",
      "workout-empty-box",
      "No educational videos added yet."
    );

    videosContainer.appendChild(emptyBox);
    return;
  }

  videosContainer.classList.add(
    "video-carousel"
  );

  let currentIndex = 0;

  function showVideo(index) {
    const video = videos[index];

    if (!video) return;

    videosContainer.innerHTML = "";

    const videoLink =
      document.createElement("a");

    videoLink.className =
      "workout-video-card active-video";

    videoLink.href = video.video_url || "#";
    videoLink.target = "_blank";
    videoLink.rel = "noopener noreferrer";

    const thumbnail = getYouTubeThumbnail(
      video.video_url
    );

    if (thumbnail) {
      const image =
        document.createElement("img");

      image.src = thumbnail;
      image.alt =
        video.title || "Workout video";

      videoLink.appendChild(image);
    }

    const dotsContainer =
      document.createElement("div");

    dotsContainer.className = "video-dots";

    videos.forEach((_, dotIndex) => {
      const dot =
        document.createElement("button");

      dot.className =
        dotIndex === index
          ? "video-dot active"
          : "video-dot";

      dot.type = "button";

      dot.setAttribute(
        "aria-label",
        `Show video ${dotIndex + 1}`
      );

      dot.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          event.stopPropagation();

          currentIndex = dotIndex;
          showVideo(currentIndex);
        }
      );

      dotsContainer.appendChild(dot);
    });

    videoLink.appendChild(dotsContainer);
    videosContainer.appendChild(videoLink);
  }

  showVideo(currentIndex);

  if (videos.length > 1) {
    workoutVideoInterval = setInterval(
      () => {
        currentIndex =
          (currentIndex + 1) %
          videos.length;

        showVideo(currentIndex);
      },
      4000
    );
  }
}

/* =====================================================
   LEVEL CARDS
===================================================== */

function renderLevelCards(levels, slug) {
  if (
    !levelsContainer ||
    !selectedProgramContainer
  ) {
    return;
  }

  levelsContainer.innerHTML = "";
  selectedProgramContainer.innerHTML = "";

  if (!Array.isArray(levels) || levels.length === 0) {
    const emptyBox = createTextElement(
      "div",
      "workout-empty-box",
      "This plan exists, but no levels have been added yet."
    );

    levelsContainer.appendChild(emptyBox);
    return;
  }

  const sortedLevels = [...levels].sort(
    (first, second) => {
      return (
        Number(first.sort_order || 1) -
        Number(second.sort_order || 1)
      );
    }
  );

  sortedLevels.forEach((level) => {
    const card =
      document.createElement("button");

    card.className =
      "workout-level-choice";

    card.type = "button";

    const title = createTextElement(
      "h3",
      "",
      level.level || "Workout Level"
    );

    const description = createTextElement(
      "p",
      "",
      level.focus ||
        "Tap to view this workout."
    );

    card.appendChild(title);
    card.appendChild(description);

    card.addEventListener("click", () => {
      document
        .querySelectorAll(
          ".workout-level-choice"
        )
        .forEach((button) => {
          button.classList.remove("active");
          button.setAttribute(
            "aria-pressed",
            "false"
          );
        });

      card.classList.add("active");
      card.setAttribute(
        "aria-pressed",
        "true"
      );

      renderSelectedProgram(level, slug);
    });

    levelsContainer.appendChild(card);
  });
}

/* =====================================================
   SELECTED PROGRAM
===================================================== */

function scrollToSelectedProgram() {
  if (!selectedProgramContainer) return;

  window.requestAnimationFrame(() => {
    selectedProgramContainer.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}

function splitTextIntoItems(value) {
  if (!value) return [];

  return String(value)
    .split(".")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createOutlineSection(
  heading,
  items
) {
  const section =
    document.createElement("div");

  section.className = "outline-section";

  const title = createTextElement(
    "h4",
    "",
    heading
  );

  const list = document.createElement("ul");

  const safeItems =
    Array.isArray(items) && items.length
      ? items
      : ["Not listed yet."];

  safeItems.forEach((item) => {
    const listItem =
      document.createElement("li");

    listItem.textContent = item;

    list.appendChild(listItem);
  });

  section.appendChild(title);
  section.appendChild(list);

  return section;
}

function renderSelectedProgram(level, slug) {
  if (!selectedProgramContainer) return;

  selectedProgramContainer.innerHTML = "";

  if (slug === "nutrition") {
    renderNutritionVideos(level);
    scrollToSelectedProgram();
    return;
  }

 if (
  slug === "recovery" &&
  level.level === "Resources"
) {
  renderRecoveryResourcesVideos();
  scrollToSelectedProgram();
  return;
}

  if (
    slug === "recovery" &&
    level.level === "Nutrition"
  ) {
    renderRecoveryNutrition();
    scrollToSelectedProgram();
    return;
  }

  const article =
    document.createElement("article");

  article.className =
    "selected-program-card workout-program-outline";

  const isRecoveryWorkout =
    slug === "recovery" &&
    level.level === "Workouts";

  if (!isRecoveryWorkout) {
    const frequencyItems =
      splitTextIntoItems(level.frequency);

    const formatItems =
      splitTextIntoItems(level.format);

    article.appendChild(
      createOutlineSection(
        "Frequency",
        frequencyItems
      )
    );

    article.appendChild(
      createOutlineSection(
        "Format",
        formatItems
      )
    );
  }

  const exercises =
    Array.isArray(level.workout_exercises)
      ? [...level.workout_exercises]
      : [];

  exercises.sort((first, second) => {
    return (
      Number(first.sort_order || 1) -
      Number(second.sort_order || 1)
    );
  });

  const exerciseNames = exercises.map(
    (exercise) =>
      exercise.name || "Unnamed exercise"
  );

  const exerciseHeading =
    slug === "progressive-overload"
      ? "Examples"
      : "Exercises";

  article.appendChild(
    createOutlineSection(
      exerciseHeading,
      exerciseNames.length
        ? exerciseNames
        : ["No details added yet."]
    )
  );

  selectedProgramContainer.appendChild(
    article
  );

  scrollToSelectedProgram();
}

/* =====================================================
   NUTRITION
===================================================== */

function renderNutritionVideos(level) {
  if (!selectedProgramContainer) return;

  const videos = currentPlan?.videos || [];

  const matchingVideos = videos.filter(
    (video) => {
      return (
        normalizeText(video.category) ===
        normalizeText(level.level)
      );
    }
  );

  const article =
    document.createElement("article");

  article.className =
    "selected-program-card workout-program-outline nutrition-selected-card";

  const wrapper =
    document.createElement("div");

  wrapper.className =
    "nutrition-selected-videos";

  wrapper.appendChild(
    createTextElement(
      "h3",
      "",
      level.level || "Nutrition"
    )
  );

  if (matchingVideos.length === 0) {
    wrapper.appendChild(
      createTextElement(
        "p",
        "muted",
        "No videos added yet."
      )
    );

    article.appendChild(wrapper);
    selectedProgramContainer.appendChild(
      article
    );

    return;
  }

  const videoList =
    document.createElement("div");

  videoList.className =
    "nutrition-video-list";

  matchingVideos.forEach((video) => {
    const link =
      document.createElement("a");

    link.className =
      "nutrition-video-item";

    link.href = video.video_url || "#";
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const thumbnail = getYouTubeThumbnail(
      video.video_url
    );

    if (thumbnail) {
      const image =
        document.createElement("img");

      image.src = thumbnail;
      image.alt =
        video.title ||
        "Nutrition video";

      link.appendChild(image);
    }

    link.appendChild(
      createTextElement(
        "span",
        "nutrition-video-title",
        video.title || "Nutrition video"
      )
    );

    videoList.appendChild(link);
  });

  wrapper.appendChild(videoList);
  article.appendChild(wrapper);

  selectedProgramContainer.appendChild(
    article
  );
}

/* =====================================================
   RECOVERY RESOURCES
===================================================== */

function renderRecoveryResourcesVideos() {
  if (!selectedProgramContainer) return;

  const allVideos = Array.isArray(currentPlan?.videos)
    ? currentPlan.videos
    : [];

  const groups = [
    {
      title: "🧘 Yoga",
      category: "Yoga"
    },
    {
      title: "🤸 Pilates",
      category: "Pilates"
    },
    {
      title: "🦵 Mobility & Stretching",
      category: "Mobility & Stretching"
    },
    {
      title: "🌬️ Breathwork & Relaxation",
      category: "Breathwork & Relaxation"
    },
    {
      title: "😴Sleep & Recovery",
      category: "Sleep & Recovery"
    }
  ];

  const article = document.createElement("article");
  article.className =
    "selected-program-card recovery-resources-card";

  const layout = document.createElement("div");
  layout.className = "recovery-resources-layout";

  const categoryList = document.createElement("div");
  categoryList.className = "recovery-category-row";

  const videoSection = document.createElement("div");
  videoSection.className = "recovery-selected-resource";

  function getVideosForCategory(category) {
    return allVideos
      .filter((video) => {
        return (
          normalizeText(video.category) ===
          normalizeText(category)
        );
      })
      .sort((first, second) => {
        return (
          Number(first.sort_order || 1) -
          Number(second.sort_order || 1)
        );
      });
  }

  function closeOpenResource() {
    categoryList
      .querySelectorAll(".recovery-category-card")
      .forEach((button) => {
        button.classList.remove("active");
        button.setAttribute("aria-expanded", "false");
      });

    videoSection.remove();
  }

  function renderCategoryVideos(group, button) {
    const isAlreadyOpen =
      button.classList.contains("active") &&
      videoSection.previousElementSibling === button;

    closeOpenResource();

    if (isAlreadyOpen) {
      return;
    }

    button.classList.add("active");
    button.setAttribute("aria-expanded", "true");

    videoSection.innerHTML = "";

    const groupVideos = getVideosForCategory(
      group.category
    );

    if (groupVideos.length === 0) {
      const emptyMessage = createTextElement(
        "p",
        "muted recovery-resource-empty",
        "No videos have been added to this category yet."
      );

      videoSection.appendChild(emptyMessage);

      button.insertAdjacentElement(
        "afterend",
        videoSection
      );

      return;
    }

    const videoList = document.createElement("div");
    videoList.className =
      "recovery-resource-video-list";

    groupVideos.forEach((video) => {
      const videoLink = document.createElement("a");

      videoLink.className =
        "recovery-resource-video-card";

      videoLink.href = video.video_url || "#";
      videoLink.target = "_blank";
      videoLink.rel = "noopener noreferrer";

      const thumbnailWrapper =
        document.createElement("div");

      thumbnailWrapper.className =
        "recovery-video-thumbnail-wrapper";

      const thumbnail = getYouTubeThumbnail(
        video.video_url
      );

      if (thumbnail) {
        const image = document.createElement("img");

        image.src = thumbnail;
        image.alt =
          video.title || "Recovery video";

        thumbnailWrapper.appendChild(image);
      }

      const videoCopy = document.createElement("div");
      videoCopy.className = "recovery-video-copy";

      const videoTitle = createTextElement(
        "h4",
        "",
        video.title || "Recovery video"
      );

      videoCopy.appendChild(videoTitle);

      videoLink.appendChild(thumbnailWrapper);
      videoLink.appendChild(videoCopy);

      videoList.appendChild(videoLink);
    });

    videoSection.appendChild(videoList);

    button.insertAdjacentElement(
      "afterend",
      videoSection
    );
  }

  groups.forEach((group) => {
    const groupVideos = getVideosForCategory(
      group.category
    );

    const button = document.createElement("button");

    button.className = "recovery-category-card";
    button.type = "button";
    button.setAttribute("aria-expanded", "false");

    const title = createTextElement(
      "span",
      "recovery-category-title",
      group.title
    );

    const count = createTextElement(
      "span",
      "recovery-category-count",
      `${groupVideos.length} ${
        groupVideos.length === 1
          ? "video"
          : "videos"
      }`
    );

    const chevron = createTextElement(
      "span",
      "recovery-category-chevron",
      "›"
    );

    button.appendChild(title);
    button.appendChild(count);
    button.appendChild(chevron);

    button.addEventListener("click", () => {
      renderCategoryVideos(group, button);
    });

    categoryList.appendChild(button);
  });

  layout.appendChild(categoryList);
  article.appendChild(layout);

  selectedProgramContainer.appendChild(article);
}

/* =====================================================
   RECOVERY NUTRITION
===================================================== */

function getRecoveryNutritionGroups() {
  return [
    {
      key: "protein",
      title: "Protein & Muscle Repair",
      emoji: "🥩",
      countLabel: "9 foods",
      items: [
        "Chicken",
        "Turkey",
        "Fish",
        "Eggs",
        "Greek Yogurt",
        "Cottage Cheese",
        "Tofu",
        "Lentils",
        "Beans"
      ]
    },
    {
      key: "hydration",
      title: "Hydration & Electrolytes",
      emoji: "💧",
      countLabel: "6 options",
      items: [
        "Water",
        "Coconut Water",
        "Electrolyte Drinks",
        "Watermelon",
        "Oranges",
        "Cucumbers"
      ]
    },
    {
      key: "inflammation",
      title: "Anti-Inflammatory Nutrition",
      emoji: "🥑",
      countLabel: "5 foods",
      items: [
        "Berries",
        "Leafy Greens",
        "Olive Oil",
        "Avocados",
        "Salmon"
      ]
    },
    {
      key: "meals",
      title: "Recovery Meals",
      emoji: "🍽️",
      countLabel: "5 meals",
      items: [
        "Chicken + Rice + Vegetables",
        "Salmon + Sweet Potato + Broccoli",
        "Greek Yogurt + Fruit",
        "Eggs + Toast + Fruit",
        "Protein Smoothie"
      ]
    },
    {
      key: "supplements",
      title: "Supplements & Recovery",
      emoji: "💊",
      countLabel: "3 videos",
      videos: [
        {
          title: "What Does Creatine Do?",
          url: "https://www.youtube.com/watch?v=NclX6EW0pr0&t=98s"
        },
        {
          title: "Why You Should Take Magnesium",
          url: "https://www.youtube.com/watch?v=97y5gQQ3gTA"
        },
        {
          title: "Why You Need Vitamin D",
          url: "https://www.youtube.com/watch?v=iLDYbSX5MLA"
        }
      ]
    }
  ];
}

function createRecoveryNutritionButton(group, isActive = false) {
  const button = document.createElement("button");

  button.className = isActive
    ? "recovery-nutrition-category active"
    : "recovery-nutrition-category";

  button.type = "button";
  button.dataset.nutritionCategory = group.key;
  button.setAttribute("aria-pressed", String(isActive));

  const titleRow = document.createElement("span");
  titleRow.className = "recovery-nutrition-category-title";

  const emoji = document.createElement("span");
  emoji.className = "recovery-nutrition-category-emoji";
  emoji.textContent = group.emoji;

  const title = document.createElement("span");
  title.className = "recovery-nutrition-category-name";
  title.textContent = group.title;

  const count = document.createElement("span");
  count.className = "recovery-nutrition-category-count";
  count.textContent = group.countLabel;

  titleRow.appendChild(emoji);
  titleRow.appendChild(title);

const chevron = document.createElement("span");
chevron.className = "recovery-nutrition-category-chevron";
chevron.textContent = "›";

button.appendChild(titleRow);
button.appendChild(count);
button.appendChild(chevron);

  return button;
}

function renderRecoveryNutritionItems(group, contentContainer) {
  contentContainer.innerHTML = "";

  if (Array.isArray(group.videos)) {
    const videoGrid = document.createElement("div");
    videoGrid.className = "recovery-nutrition-video-grid";

    group.videos.forEach((video) => {
      const link = document.createElement("a");

      link.className = "recovery-nutrition-video-card";
      link.href = video.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      const thumbnail = getYouTubeThumbnail(video.url);

      if (thumbnail) {
        const image = document.createElement("img");
        image.src = thumbnail;
        image.alt = video.title;

        link.appendChild(image);
      }

      const title = document.createElement("h4");
      title.textContent = video.title;

      link.appendChild(title);
      videoGrid.appendChild(link);
    });

    contentContainer.appendChild(videoGrid);
    return;
  }

  const itemsGrid = document.createElement("div");
  itemsGrid.className = "recovery-nutrition-items-grid";

  group.items.forEach((item) => {
    const itemCard = document.createElement("div");
    itemCard.className = "recovery-nutrition-item";

    const marker = document.createElement("span");
    marker.className = "recovery-nutrition-item-marker";
    marker.textContent = "•";

    const itemText = document.createElement("span");
    itemText.textContent = item;

    itemCard.appendChild(marker);
    itemCard.appendChild(itemText);

    itemsGrid.appendChild(itemCard);
  });

  contentContainer.appendChild(itemsGrid);
}

function placeRecoveryNutritionContent(
  categoryRow,
  contentContainer,
  clickedButton
) {
  const isMobile = window.matchMedia(
    "(max-width: 700px)"
  ).matches;

  if (isMobile) {
    clickedButton.insertAdjacentElement(
      "afterend",
      contentContainer
    );
  } else {
    categoryRow.insertAdjacentElement(
      "afterend",
      contentContainer
    );
  }
}

function renderRecoveryNutrition() {
  if (!selectedProgramContainer) return;

  selectedProgramContainer.innerHTML = "";

  const groups = getRecoveryNutritionGroups();

  const article = document.createElement("article");
  article.className =
    "selected-program-card recovery-nutrition-card";

  const layout = document.createElement("div");
  layout.className = "recovery-nutrition-layout";

  const categoryList = document.createElement("div");
  categoryList.className =
    "recovery-nutrition-category-row";

  const contentContainer =
    document.createElement("div");

  contentContainer.className =
    "recovery-nutrition-content";

  function closeOpenNutrition() {
    categoryList
      .querySelectorAll(
        ".recovery-nutrition-category"
      )
      .forEach((button) => {
        button.classList.remove("active");
        button.setAttribute(
          "aria-expanded",
          "false"
        );
      });

    contentContainer.remove();
  }

  function toggleNutritionGroup(group, button) {
    const isAlreadyOpen =
      button.classList.contains("active") &&
      contentContainer.previousElementSibling ===
        button;

    closeOpenNutrition();

    if (isAlreadyOpen) {
      return;
    }

    button.classList.add("active");
    button.setAttribute(
      "aria-expanded",
      "true"
    );

    renderRecoveryNutritionItems(
      group,
      contentContainer
    );

    button.insertAdjacentElement(
      "afterend",
      contentContainer
    );
  }

  groups.forEach((group) => {
    const button =
      createRecoveryNutritionButton(
        group,
        false
      );

    button.setAttribute(
      "aria-expanded",
      "false"
    );

    button.addEventListener("click", () => {
      toggleNutritionGroup(group, button);
    });

    categoryList.appendChild(button);
  });

  layout.appendChild(categoryList);
  article.appendChild(layout);

  selectedProgramContainer.appendChild(article);
}

/* =====================================================
   INITIALIZE PAGE
===================================================== */

window.addEventListener(
  "DOMContentLoaded",
  () => {
    setupNavigation();
    loadWorkoutPlan();
  }
);

window.addEventListener(
  "beforeunload",
  clearWorkoutCarousel
);