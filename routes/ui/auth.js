function saveToken(token) {
  localStorage.setItem("token", token);
}

function getToken() {
  return localStorage.getItem("token");
}

function removeToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function saveUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

function getUser() {
  const user = localStorage.getItem("user");

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch (error) {
    console.error("Invalid stored user data:", error);
    localStorage.removeItem("user");
    return null;
  }
}

function decodeTokenPayload(token) {
  try {
    const payloadPart = token.split(".")[1];

    if (!payloadPart) {
      return null;
    }

    const normalizedPayload = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const paddedPayload =
      normalizedPayload +
      "=".repeat(
        (4 - (normalizedPayload.length % 4)) % 4
      );

    const decodedPayload = atob(paddedPayload);

    return JSON.parse(
      decodeURIComponent(
        decodedPayload
          .split("")
          .map((character) => {
            return `%${character
              .charCodeAt(0)
              .toString(16)
              .padStart(2, "0")}`;
          })
          .join("")
      )
    );
  } catch (error) {
    console.error("Unable to decode token:", error);
    return null;
  }
}

function isLoggedIn() {
  const token = getToken();

  if (!token) {
    return false;
  }

  const payload = decodeTokenPayload(token);

  if (!payload) {
    removeToken();
    return false;
  }

  const currentTime = Math.floor(Date.now() / 1000);

  if (
    typeof payload.exp === "number" &&
    payload.exp <= currentTime
  ) {
    removeToken();
    return false;
  }

  return true;
}

function getReturnPage() {
  return isLoggedIn()
    ? "./dashboard.html"
    : "./login.html";
}

function setupSmartBackButtons() {
  const smartBackButtons = document.querySelectorAll(
    "[data-smart-back]"
  );

  smartBackButtons.forEach((link) => {
    const destination = getReturnPage();

    link.setAttribute("href", destination);

    link.addEventListener("click", (event) => {
      event.preventDefault();

      const currentDestination = getReturnPage();

      window.location.replace(currentDestination);
    });
  });
}

function clearSessionAndRedirect() {
  removeToken();
  window.location.replace("./login.html");
}

function requireAuth() {
  if (!isLoggedIn()) {
    clearSessionAndRedirect();
    return null;
  }

  return getToken();
}

async function fetchWithAuth(url, options = {}) {
  const token = requireAuth();

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
      }
    });

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      clearSessionAndRedirect();
      return null;
    }

    return response;
  } catch (error) {
    console.error("Network/Auth error:", error);

    return null;
  }
}

function initializeAuthHelpers() {
  setupSmartBackButtons();
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeAuthHelpers
  );
} else {
  initializeAuthHelpers();
}