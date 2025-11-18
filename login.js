const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("username").value.trim(); // treat "username" as email
  const password = document.getElementById("password").value.trim();

  try {
    const response = await fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      alert("❌ " + (data.error || "Login failed"));
      return;
    }

    // Save session info
    sessionStorage.setItem("currentUser", JSON.stringify(data.user));

    // Redirect based on role
    if (data.user.role === "admin") {
      window.location.href = "admin-home.html";
    } else {
      window.location.href = "user-home.html";
    }
  } catch (err) {
    console.error(err);
    alert("⚠️ Server error. Please try again later.");
  }
});
