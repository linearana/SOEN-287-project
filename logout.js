document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // Clear current user
      sessionStorage.removeItem("currentUser");
      // Redirect to home
      window.location.href = "home.html";
    });
  }
});
