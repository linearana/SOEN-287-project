
document.addEventListener("DOMContentLoaded", () => {
  const cells = document.querySelectorAll("td.available");

  cells.forEach(cell => {
    cell.addEventListener("click", () => {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      
      if (!currentUser) {
        alert("⚠️ You must be logged in to book a resource.");
        window.location.href = "login.html";
      }
    });
  });
});