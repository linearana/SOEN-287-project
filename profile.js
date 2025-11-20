document.addEventListener("DOMContentLoaded", () => {
  // Get user from sessionStorage
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));


  if (!currentUser) {
    // Not logged in → redirect to login
    window.location.href = "login.html";
    return;
  }

  // Populate profile fields
  document.getElementById("fullName").textContent = 
    `${currentUser.firstName} ${currentUser.lastName}`.trim();
  document.getElementById("studentId").textContent = currentUser.studentId;
  document.getElementById("email").textContent = currentUser.email;
  document.getElementById("role").textContent =
    currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);

});
