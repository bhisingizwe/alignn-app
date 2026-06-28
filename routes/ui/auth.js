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
  return user ? JSON.parse(user) : null;
}

function isLoggedIn() {
  return !!getToken();
}

function clearSessionAndRedirect() {
  removeToken();
  window.location.href = "./home.html";
}

function requireAuth() {
  const token = getToken();

  if (!token) {
    clearSessionAndRedirect();
    return null;
  }

  return token;
}

async function fetchWithAuth(url, options = {}) {
  const token = getToken();

  if (!token) {
    clearSessionAndRedirect();
    return null;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
      }
    });

    if (res.status === 401 || res.status === 403) {
      clearSessionAndRedirect();
      return null;
    }

    return res;
  } catch (err) {
    console.error("Network/Auth error:", err);
    clearSessionAndRedirect(); // ← this is the key upgrade
    return null;
  }
}