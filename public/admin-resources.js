async function loadResources() {
  const res = await fetch("/api/resources");
  const resources = await res.json();

  const resourceContainer = document.getElementsByClassName("cards")[0];
  resourceContainer.innerHTML = "";

  resources.forEach(element => {
    const div = document.createElement("div");
    div.dataset.id = element.id;
    div.classList.add("card");

    if (element.status === "disabled") {
      div.classList.add("disabled");
    }

   div.innerHTML = `
  <img src="${element.image}" alt="${element.title}" />
  <h3>${element.title}</h3>
  <p>${element.description}</p>
  <a href="admin-availabilities.html?id=${element.id}">
    <button ${element.status === "disabled" ? "disabled" : ""}>Edit</button>
  </a>
  ${
    element.status === "disabled"
      ? `<button onclick="enableResource(this)">Enable</button>`
      : `<button onclick="disableResource(this)">Disable</button>`
  }
`;


    resourceContainer.appendChild(div);
  });
}

// Disable a resource and cancel its bookings
async function disableResource(buttonEl) {
  const card = buttonEl.closest(".card");
  const resourceId = card.dataset.id;

  try {
    const res = await fetch(`/api/resources/${resourceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "disabled" })
    });

    if (!res.ok) {
      alert("❌ Failed to disable resource.");
      return;
    }

    const data = await res.json();
    alert(`✅ Resource "${data.resource.title}" disabled and all bookings cancelled.`);

    loadResources();
  } catch (err) {
    console.error("Error disabling resource:", err);
    alert("⚠️ Server error while disabling resource.");
  }
}

// Enable a resource back
async function enableResource(buttonEl) {
  const card = buttonEl.closest(".card");
  const resourceId = card.dataset.id;

  try {
    const res = await fetch(`/api/resources/${resourceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "enabled" })
    });

    if (!res.ok) {
      alert("❌ Failed to enable resource.");
      return;
    }

    const data = await res.json();
    alert(`✅ Resource "${data.resource.title}" enabled.`);

    loadResources();
  } catch (err) {
    console.error("Error enabling resource:", err);
    alert("⚠️ Server error while enabling resource.");
  }
}

// Initial load
loadResources();
