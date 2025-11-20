document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault(); 

      sessionStorage.removeItem("currentUser");
      sessionStorage.removeItem("hasBooked");

      window.location.href = "home.html";
    });
  }
});

