// Auth Utilities for ADEQ
function autoFillUserData() {
  const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");

  if (userData && userData.email) {
    // Auto-fill booking form
    const nameField = document.getElementById("customerName");
    const emailField = document.getElementById("customerEmail");
    const phoneField = document.getElementById("customerPhone");

    if (nameField)
      nameField.value =
        `${userData.firstName || ""} ${userData.lastName || ""}`.trim();
    if (emailField) emailField.value = userData.email || "";
    if (phoneField) phoneField.value = userData.phone || "";
  }
}

function requireLogin(action = "perform this action") {
  const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const isLoggedIn = !!(userData && userData.email);

  if (!isLoggedIn) {
    alert(`Please login to ${action}`);
    // Trigger login modal if it exists
    const authButton = document.getElementById("headerAuthButton");
    if (authButton) authButton.click();
    return false;
  }
  return true;
}

// Make functions globally available
window.autoFillUserData = autoFillUserData;
window.requireLogin = requireLogin;
