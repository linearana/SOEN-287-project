console.log("admin-availability.js loaded");

// ---------------------- LOGIN CHECK ----------------------
const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
if (!currentUser) {
  alert("⚠️ You must be logged in to manage availability.");
  window.location.href = "login.html";
}

// ---------------------- GLOBAL STATE ----------------------
const urlParams = new URLSearchParams(window.location.search);
const resourceID = Number(urlParams.get("id")); // e.g. admin-avail.html?id=3

const messageBox = document.getElementById("message");
const tableBody = document.getElementById("tableBody");
const dateInput = document.getElementById("date");

const HOURS = [12, 13, 14, 15, 16, 17];

let adminResource = null; // will hold the resource object (including roomsStatus)

// ---------------------- LOAD RESOURCE + BUILD TABLE ----------------------
async function loadAdminAvailability() {
  if (!resourceID) {
    console.error("No resource id in URL (?id=...)");
    return;
  }

  let resources = [];
  try {
    const res = await fetch("http://localhost:4000/api/resources");
    resources = await res.json();
  } catch (err) {
    console.error("Cannot load resources:", err);
    alert("⚠️ Cannot load resources from server.");
    return;
  }

  const resource = resources.find(r => Number(r.id) === resourceID);
  if (!resource) {
    console.error("Resource not found for id:", resourceID);
    alert("Resource not found.");
    return;
  }

  adminResource = resource; // keep in memory so we can update roomsStatus

  // Optional: update page titles/headings
  const h1 = document.querySelector("h1");
  if (h1) h1.textContent = "Admin " + resource.title + " Availability";

  const titleEl = document.getElementById("resourceTitle");
  if (titleEl) titleEl.textContent = resource.title;

  if (!tableBody) {
    console.error('❌ No <tbody id="tableBody"> found in HTML');
    return;
  }

  tableBody.innerHTML = "";

  const roomsArray = resource.rooms.split(",").map(r => r.trim());

  roomsArray.forEach((roomName, roomIndex) => {
    const row = document.createElement("tr");

    // room name
    const roomCell = document.createElement("td");
    roomCell.textContent = roomName;
    row.appendChild(roomCell);

    // time slots
    HOURS.forEach((hour, timeIndex) => {
      const status =
        resource.roomsStatus?.[roomIndex]?.[timeIndex] || "available";

      const td = document.createElement("td");
      td.dataset.roomIndex = roomIndex;   // index into roomsStatus
      td.dataset.timeIndex = timeIndex;   // index into roomsStatus row
      td.dataset.room = roomName;
      td.dataset.time = String(hour);

      td.classList.add(status); // available/unavailable/booked (if you want)
      td.textContent = status === "unavailable" ? "unavailable" : "available";

      row.appendChild(td);
    });

    tableBody.appendChild(row);
  });

  console.log("Admin availability table built for", resource.title);
}

// ---------------------- CLICK HANDLER: TOGGLE AVAILABILITY ----------------------
if (tableBody) {
  tableBody.addEventListener("click", e => {
    const cell = e.target.closest("td[data-room-index]");
    if (!cell || !adminResource) return;

    const roomIndex = Number(cell.dataset.roomIndex);
    const timeIndex = Number(cell.dataset.timeIndex);

    const room = cell.dataset.room;
    const time = cell.dataset.time;
    const date = (dateInput && dateInput.value) || "selected date";

    let actionText = "";

    // available -> unavailable
    if (cell.classList.contains("available")) {
      cell.classList.remove("available");
      cell.classList.add("unavailable");
      cell.textContent = "unavailable";

      adminResource.roomsStatus[roomIndex][timeIndex] = "unavailable";
      actionText = `✅ Availability removed for ${room} at ${time}:00 on ${date}`;
    }
    // booked -> unavailable (optional, if you overlay bookings)
    else if (cell.classList.contains("booked")) {
      cell.classList.remove("booked");
      cell.classList.add("unavailable");
      cell.textContent = "unavailable";

      adminResource.roomsStatus[roomIndex][timeIndex] = "unavailable";
      actionText =
        `✅ Booking cancelled and slot made unavailable for ${room} ` +
        `at ${time}:00 on ${date}. User will be notified.`;
    }
    // unavailable -> available
    else {
      cell.classList.remove("unavailable");
      cell.classList.add("available");
      cell.textContent = "available";

      adminResource.roomsStatus[roomIndex][timeIndex] = "available";
      actionText = `🔁 Availability restored for ${room} at ${time}:00 on ${date}`;
    }

    if (messageBox && actionText) {
      messageBox.innerHTML += actionText + "<br>";
    }

    console.log("Updated roomsStatus:", adminResource.roomsStatus);
  });
}

// ---------------------- CONFIRM CHANGES: SAVE TO SERVER ----------------------
async function confirmChanges() {
  if (!adminResource) {
    alert("No resource loaded.");
    return;
  }

  if (!messageBox || messageBox.innerHTML.trim() === "") {
    alert("No changes to confirm.");
    return;
  }

  const ok = confirm("Apply all availability changes for this resource?");
  if (!ok) return;

  try {
    const res = await fetch(`http://localhost:4000/api/resources/${resourceID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomsStatus: adminResource.roomsStatus
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Error saving roomsStatus:", data);
      alert("❌ Failed to save changes: " + (data.error || "Unknown error."));
      return;
    }

    alert("✅ Availability changes saved.");
    messageBox.innerHTML = "";
  } catch (err) {
    console.error("Server error saving roomsStatus:", err);
    alert("⚠️ Server error saving changes.");
  }
}

// Make confirmChanges available to the button onclick in HTML
window.confirmChanges = confirmChanges;

// ---------------------- AUTO-CHOOSE DATE ----------------------
if (dateInput) {
  const today = new Date();
  const d = String(today.getDate()).padStart(2, "0");
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const y = today.getFullYear();
  dateInput.value = `${y}-${m}-${d}`;
}

// ---------------------- INITIAL LOAD ----------------------
document.addEventListener("DOMContentLoaded", () => {
  loadAdminAvailability();
});



