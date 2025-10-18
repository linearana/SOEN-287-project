const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  // Hard-coded credentials
  if (username === "admin" && password === "admin123") {
    // Save session info
    localStorage.setItem("currentUser", JSON.stringify({ role: "admin", username }));
    window.location.href = "admin-home.html";
  } else if (username === "student" && password === "student123") {
    localStorage.setItem("currentUser", JSON.stringify({ role: "user", username }));
    window.location.href = "user-home.html";
  } else {
    alert("❌ Invalid username or password. Try 'admin/admin123' or 'student/student123'.");
  }
});