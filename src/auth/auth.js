export function getRole() {
  return localStorage.getItem("authRole") || "";
}

export function loginAs(role) {
  localStorage.setItem("authRole", role);
  emitAuthChanged();
}

export function logout() {
  localStorage.removeItem("authRole");
  localStorage.removeItem("authProvider");
  localStorage.removeItem("authUser");
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");

  // Clear search history to prevent privacy leak between users
  localStorage.removeItem("jobfinder_search_history");

  emitAuthChanged();
}

export function isEmployer() {
  const role = getRole();
  return role === "recruiter";
}

export function isLoggedIn() {
  return !!getRole();
}

export function loginWithGoogle(role = "seeker", profile) {
  const user = profile || {
    name: "Google User",
    email: "user@example.com",
    avatar:
      "https://www.gstatic.com/images/branding/product/1x/avatar_circle_blue_512dp.png",
  };
  localStorage.setItem("authProvider", "google");
  localStorage.setItem("authUser", JSON.stringify(user));
  // store canonical backend role names (candidate|recruiter|admin)
  const canonical = role === "seeker" ? "candidate" : role;
  localStorage.setItem("authRole", canonical);
  emitAuthChanged();
}

export function getAuthProvider() {
  return localStorage.getItem("authProvider") || "";
}

export function getAuthUser() {
  try {
    return JSON.parse(localStorage.getItem("authUser") || "{}");
  } catch {
    return {};
  }
}

// JWT helpers (for token-based auth flows)
export function setAuthToken(token) {
  if (token) localStorage.setItem("authToken", token);
  emitAuthChanged();
}

export function getAuthToken() {
  return localStorage.getItem("authToken") || "";
}

export function setRefreshToken(token) {
  if (token) localStorage.setItem("refreshToken", token);
}

export function getRefreshToken() {
  return localStorage.getItem("refreshToken") || "";
}

export function decodeJWT(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error("Invalid JWT format: expected 3 parts, got", parts.length);
      return null;
    }
    const payload = parts[1];
    if (!payload) {
      console.error("Empty JWT payload");
      return null;
    }
    // Base64URL decode
    let base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    // Add padding if needed
    const padLength = (4 - (base64.length % 4)) % 4;
    base64 += "=".repeat(padLength);

    const decoded = JSON.parse(atob(base64));
    return decoded;
  } catch (e) {
    console.error(
      "JWT decode error:",
      e,
      "Token:",
      token ? token.substring(0, 50) + "..." : "null"
    );
    return null;
  }
}

export function getCurrentUserId() {
  const token = getAuthToken();
  if (!token) return null;

  const decoded = decodeJWT(token);
  return decoded?.user_id || null;
}

export function getCurrentUserRole() {
  const token = getAuthToken();
  if (!token) return null;

  const decoded = decodeJWT(token);
  return decoded?.role || null;
}

function emitAuthChanged() {
  try {
    window.dispatchEvent(new Event("auth-changed"));
  } catch {}
}
