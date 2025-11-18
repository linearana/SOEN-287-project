// verify user is logged in, if not, redirect to login page
document.addEventListener("DOMContentLoaded", () => {
  const cells = document.querySelectorAll("td.available");

  cells.forEach(cell => {
    cell.addEventListener("click", () => {
      const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
      
      if (!currentUser) {
        alert("⚠️ You must be logged in to book a resource.");
        window.location.href = "login.html";
      }
    });
  });
});

//automatically choose date
let ele = document.getElementById("date");
var today = new Date();
var d = String(today.getDate()).padStart(2, '0');
var m = String(today.getMonth() + 1).padStart(2, '0');
var y = today.getFullYear();
ele.value = y + "-" + m + "-" + d;