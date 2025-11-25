document.addEventListener("DOMContentLoaded", async () => {
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
  if (!currentUser) {
    alert("You must be logged in.");
    window.location.href = "login.html";
    return;
  }

  // Fill profile fields
  document.getElementById("firstName").textContent = currentUser.firstName;
  document.getElementById("lastName").textContent = currentUser.lastName;
  document.getElementById("studentId").textContent = currentUser.studentId;
  document.getElementById("email").textContent = currentUser.email;

  // Profile picture
  const pic = document.getElementById("profilePic");
  if (!pic) return;

  try {
    // Fetch latest user data from server
    const res = await fetch(`/api/users/${currentUser.id}`);
    const userData = await res.json();

    pic.src = userData.picture || currentUser.picture || "images/user.png";
  } catch (err) {
    console.error("Failed to load user picture:", err);
    pic.src = currentUser.picture || "images/user.png"; // fallback
  }
});