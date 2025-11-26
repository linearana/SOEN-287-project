console.log("admin.js loaded");

/* ------------------ GLOBALS ------------------ */

const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
if (!currentUser) {
  alert("⚠️ You must be logged in to access admin tools.");
  window.location.href = "login.html";
}

const messageBox      = document.getElementById("message");
const tableBody       = document.getElementById("tableBody");
const dateInput       = document.getElementById("date");
const resourceTitleEl = document.getElementById("resourceTitle");
const urlParams       = new URLSearchParams(window.location.search);
const resourceID      = Number(urlParams.get("id"));

const HOURS = [12, 13, 14, 15, 16, 17];
let currentResource = null;


/* ------------------ INIT DATE ------------------ */

function ensureDateDefault() {
  if (!dateInput) return;
  if (!dateInput.value) {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, "0");
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const y = today.getFullYear();
    dateInput.value = `${y}-${m}-${d}`;
  }
}

function getSelectedDate() {
  const val = dateInput?.value.trim();
  if (!val) {
    alert("⚠️ Please select a date first.");
    throw new Error("No date selected");
  }
  return val;
}


/* ------------------ BUILD TABLE ------------------ */

async function buildAdminTable() {
  if (!tableBody) return;

  if (!resourceID) {
    console.error("❌ No ?id=... in URL for resource.");
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
    alert("Resource not found.");
    return;
  }

  currentResource = resource;

  document.title = resource.title + " - Admin";
  const h1 = document.querySelector("h1");
  if (h1) h1.textContent = "Admin " + resource.title + " | Campus Booking";
  if (resourceTitleEl) resourceTitleEl.textContent = resource.title;

  const rulesEl = document.getElementById("rulesAdmin");
  if (rulesEl && resource.rulesResource) {
    rulesEl.textContent = resource.rulesResource;
  }

  tableBody.innerHTML = "";

  const roomsArray = resource.rooms.split(",").map(r => r.trim());

  roomsArray.forEach((roomName, indexRoom) => {
    const row = document.createElement("tr");

    const roomCell = document.createElement("td");
    roomCell.textContent = roomName;
    row.appendChild(roomCell);

    HOURS.forEach((hour, slotIndex) => {
      const td = document.createElement("td");
      td.dataset.room = roomName;
      td.dataset.time = String(hour);

      const base = resource.roomsStatus?.[indexRoom]?.[slotIndex];
      if (base === "unavailable" || base === "X") {
        td.classList.add("unavailable");
        td.textContent = "X";
      } else {
        td.classList.add("available");
        td.textContent = "available";
      }

      row.appendChild(td);
    });

    tableBody.appendChild(row);
  });

  await updateAdminSlots();
}


/* ------------------ UPDATE SLOTS (FIXED) ------------------ */

async function updateAdminSlots() {
  if (!tableBody) return;

  let date;
  try { date = getSelectedDate(); } catch { return; }

  let bookings = [];
  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    bookings = await res.json();
  } catch (err) {
    console.error("Cannot load bookings:", err);
    return;
  }

  const resourceTitle = currentResource?.title ?? null;
  if (resourceTitle) {
    bookings = bookings.filter(b => b.item === resourceTitle);
  }

  const bookingMap = new Map();
  bookings.forEach(b => {
    if (b.date === date) {
      bookingMap.set(`${b.resource}|${b.hour}`, b.status.toLowerCase());
    }
  });

  const rows = Array.from(tableBody.querySelectorAll("tr"));

  rows.forEach((row, indexRoom) => {
    const cells = row.querySelectorAll("td[data-room]");

    cells.forEach(cell => {
      const room = cell.dataset.room;
      const time = cell.dataset.time;

      const slotIndex = HOURS.indexOf(Number(time));
      const base = currentResource.roomsStatus?.[indexRoom]?.[slotIndex];

      // RESET TO BASE STATE
      if (base === "unavailable" || base === "X") {
        cell.className = "unavailable";
        cell.textContent = "X";
      } else {
        cell.className = "available";
        cell.textContent = "available";
      }

      // APPLY BOOKING STATUS
      const key = `${room}|${time}`;
      if (!bookingMap.has(key)) return;

      const status = bookingMap.get(key);
      cell.className = status;

      if (status === "unavailable") {
        cell.textContent = "X";
      } else if (status === "pending") {
        cell.textContent = "Pending";
      } else if (status === "booked") {
        cell.textContent = "Booked";
      }
    });
  });
}


/* ------------------ ACTIONS ------------------ */

async function makeSlotUnavailable(room, time, date) {
  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    const bookings = await res.json();

    const existing = bookings.find(
      b =>
        b.resource === room &&
        String(b.hour) === String(time) &&
        b.date === date &&
        b.status !== "Unavailable"
    );

    if (existing) {
      await fetch(`http://localhost:4000/api/bookings/${existing.id}`, {
        method: "DELETE"
      });
      if (messageBox) {
        messageBox.innerHTML +=
          `❌ Removed existing booking for ${room} at ${time}:00 on ${date}.<br>`;
      }
    }

    const blockBooking = {
      username: "__ADMIN__",
      resource: room,
      item: resourceTitleEl ? resourceTitleEl.textContent.trim() : "",
      date,
      hour: String(time),
      status: "Unavailable"
    };

    await fetch("http://localhost:4000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blockBooking)
    });

    if (messageBox) {
      messageBox.innerHTML +=
        `❌ Marked ${room} at ${time}:00 as unavailable for ${date}.<br>`;
    }

  } catch (err) {
    console.error("Error blocking slot:", err);
    alert("⚠️ Server error while updating availability.");
  }

  await updateAdminSlots();
}

async function makeSlotAvailable(room, time, date) {
  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    const bookings = await res.json();

    const blocks = bookings.filter(
      b =>
        b.resource === room &&
        String(b.hour) === String(time) &&
        b.date === date &&
        b.status === "Unavailable"
    );

    for (const b of blocks) {
      await fetch(`http://localhost:4000/api/bookings/${b.id}`, {
        method: "DELETE"
      });
    }

    if (blocks.length > 0 && messageBox) {
      messageBox.innerHTML +=
        `🔁 Restored availability for ${room} at ${time}:00 on ${date}.<br>`;
    }
  } catch (err) {
    console.error("Error restoring slot:", err);
    alert("⚠️ Server error while restoring availability.");
  }

  await updateAdminSlots();
}


/* ------------------ CLICK HANDLER ------------------ */

function attachClickHandler() {
  if (!tableBody) return;

  tableBody.addEventListener("click", async e => {
    const cell = e.target.closest("td");
    if (!cell || !cell.dataset.room || !cell.dataset.time) return;

    let date;
    try { date = getSelectedDate(); } catch { return; }

    const room = cell.dataset.room;
    const time = cell.dataset.time;

    if (cell.classList.contains("available")) {
      await makeSlotUnavailable(room, time, date);
    } else if (cell.classList.contains("unavailable")) {
      await makeSlotAvailable(room, time, date);
    } else if (
      cell.classList.contains("booked") ||
      cell.classList.contains("pending")
    ) {
      await makeSlotUnavailable(room, time, date);
    }
  });
}


/* ------------------ CONFIRM CHANGES ------------------ */

function confirmChanges() {
  if (!messageBox) return;

  if (messageBox.innerHTML === "") {
    alert("No changes to confirm.");
    return;
  }

  if (confirm("Apply all changes? (They are already saved — this just clears messages.)")) {
    messageBox.innerHTML = "";
  }
}


/* ------------------ DOM READY ------------------ */

document.addEventListener("DOMContentLoaded", () => {
  ensureDateDefault();
  buildAdminTable().then(() => attachClickHandler());

  if (dateInput) {
    dateInput.addEventListener("change", () => updateAdminSlots());
  }
});
