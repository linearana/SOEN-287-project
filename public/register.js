document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const newUser = {
    firstName: document.getElementById("fname").value.trim(),
    lastName: document.getElementById("lname").value.trim(),
    studentId: document.getElementById("sid").value.trim(),
    email: document.getElementById("email").value.trim().toLowerCase(),
    password: document.getElementById("password").value.trim()
  };

  try {
    const res = await fetch("http://localhost:4000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser)
    });

    const data = await res.json();

    if (!res.ok) {
      alert("❌ " + data.error);
      return;
    }

    alert("✅ Account created successfully!");
    window.location.href = "login.html";

  } catch (err) {
    alert("⚠️ Server error");
    console.log(err);
  }
});
