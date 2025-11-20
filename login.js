const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const response = await fetch("http://localhost:4000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    // save session
    sessionStorage.setItem("currentUser", JSON.stringify(data.user));

    // redirect
    if (data.user.role === "admin") {
      window.location.href = "admin-home.html";
    } else {
      window.location.href = "user-home.html";
    }

  } catch (err) {
    console.warn("Backend offline. Using fallback accounts.");

    // fallback login if server is down
    if (email === "admin" && password === "admin123") {
      sessionStorage.setItem("currentUser", JSON.stringify({ email, role: "admin" }));
      window.location.href = "admin-home.html";
      return;
    }
    if (email === "student" && password === "student123") {
      sessionStorage.setItem("currentUser", JSON.stringify({ email, role: "student" }));
      window.location.href = "user-home.html";
      return;
    }

    alert("Invalid login or server offline.");
  }
});
