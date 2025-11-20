document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault(); 

      sessionStorage.removeItem("currentUser");
      
      window.location.href = "home.html";
    });
  }
});

