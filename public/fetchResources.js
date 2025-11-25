document.addEventListener("DOMContentLoaded", async () => {
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || {};
  const role = currentUser.role || "student";

  const container = document.getElementById("resourcesContainer");
  if (!container) {
    console.error("❌ #resourcesContainer not found.");
    return;
  }

  container.innerHTML = "<p>Loading resources...</p>";

  // FETCH resources
  let resources = [];
  try {
    const res = await fetch("http://localhost:4000/api/resources");
    resources = await res.json();
  } catch (err) {
    console.error("❌ Could not fetch resources:", err);
    container.innerHTML = "<p>Cannot connect to server.</p>";
    return;
  }

  container.innerHTML = ""; // clear loader

  resources.forEach(r => {
    // Skip disabled for normal users
    if (role !== "admin" && r.status === "disabled") return;

    const div = document.createElement("div");
    div.classList.add("card");
    div.dataset.id = r.id;

    div.innerHTML = `
      <img src="${r.image}" alt="${r.title}">
      <h3>${r.title}</h3>
      <p>${r.description}</p>
      <a href="user-availabilities.html?id=${r.id}">
        <button>View Availability</button>
      </a>

      ${ role === "admin" ? `
        <button class="toggle-btn">${r.status === "disabled" ? "Enable" : "Disable"}</button>
      ` : "" }
    `;

    container.appendChild(div);
  });

  // If no cards appear
  if (container.innerHTML.trim() === "") {
    container.innerHTML = "<p>No resources available.</p>";
  }
});
