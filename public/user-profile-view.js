document.addEventListener("DOMContentLoaded", () => {
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

  if (!currentUser) {
    alert("You must be logged in.");
    window.location.href = "login.html";
    return;
  }

  // insert text values
  document.getElementById("firstName").textContent = currentUser.firstName;
  document.getElementById("lastName").textContent = currentUser.lastName;
  document.getElementById("studentId").textContent = currentUser.studentId;
  document.getElementById("email").textContent = currentUser.email;

  document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(sessionStorage.getItem("currentUser"));

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // Fill profile fields
  document.getElementById("firstName").textContent = user.firstName;
  document.getElementById("lastName").textContent = user.lastName;
  document.getElementById("studentId").textContent = user.studentId;
  document.getElementById("email").textContent = user.email;

  // Profile picture (view page)
  const pic = document.getElementById("profilePic");
  pic.src = user.picture || "images/user.png";  // fallback image
});
});