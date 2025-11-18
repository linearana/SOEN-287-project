const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const firstName = document.getElementById("fname").value.trim();
  const lastName = document.getElementById("lname").value.trim();
  const studentId = document.getElementById("id").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const response = await fetch("http://localhost:4000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, studentId, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      alert("❌ " + (data.error || "Signup failed"));
      return;
    }

    // Save session info
    sessionStorage.setItem("currentUser", JSON.stringify(data.user));

    // Redirect to user home
    window.location.href = "user-home.html";
  } catch (err) {
    console.error(err);
    alert("⚠️ Server error. Please try again later.");
  }
});
