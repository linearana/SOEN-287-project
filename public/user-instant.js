console.log("instant user-request.js loaded");

// ---------------------- GET RESOURCE INFO ----------------------
const urlParams = new URLSearchParams(window.location.search);
const resourceIDParam = urlParams.get("id");
const resourceID = resourceIDParam ? Number(resourceIDParam) : null;

const messageBox = document.getElementById("message");
const resourceTypeName = document.getElementById("resourceTitle").textContent.trim();
const dateInput = document.getElementById("date");

let bookingInProgress = false;
const TIMES = [12, 13, 14, 15, 16, 17];

// ---------------------- BUILD TABLE FROM resources.json ----------------------
async function buildTableFromResource() {
  console.log("buildTableFromResource() for INSTANT resource");

  let resources = [];
  try {
    const res = await fetch("http://localhost:4000/api/resources");
    resources = await res.json();
  } catch (err) {
    console.error("SERVER OFFLINE → cannot load resources.", err);
    alert("Cannot load resources from server.");
    return;
  }

  console.log("Loaded resources:", resources);

  // Prefer ID from ?id=...; else match by title (Study Rooms, Conference Rooms, etc.)
  let resource = null;
  if (resourceID && !Number.isNaN(resourceID)) {
    resource = resources.find(r => r.id === resourceID);
  }
  if (!resource) {
    resource = resources.find(
      r =>
        r.title &&
        r.title.trim().toLowerCase() === resourceTypeName.toLowerCase()
    );
  }

  if (!resource) {
    console.error("❌ Instant resource not found for page:", {
      resourceID,
      resourceTypeName,
      available: resources.map(r => ({ id: r.id, title: r.title }))
    });
    alert("Could not find matching resource configuration for this page.");
    return;
  }

  console.log("Matched instant resource:", resource);

  const tbody = document.querySelector("table.atable tbody");
  if (!tbody) {
    console.error("❌ tbody for .atable not found");
    return;
  }
  tbody.innerHTML = "";

  const roomsArray = resource.rooms.split(",").map(r => r.trim());
  console.log("Rooms for this instant resource:", roomsArray);

  roomsArray.forEach((roomName, roomIndex) => {
    const tr = document.createElement("tr");

    // Room name
    const tdRoom = document.createElement("td");
    tdRoom.textContent = roomName;
    tr.appendChild(tdRoom);

    // Time slots
    TIMES.forEach((hour, colIndex) => {
      const td = document.createElement("td");
      td.dataset.room = roomName;
      td.dataset.time = String(hour);

      const baseStatus =
        resource.roomsStatus?.[roomIndex]?.[colIndex] || "available";

      if (baseStatus === "unavailable") {
        td.textContent = "unavailable";
        td.classList.add("unavailable");
      } else {
        td.textContent = "available";
        td.classList.add("available");
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  console.log("Instant table rows built:", tbody.children.length);

  attachCellClickHandlers();
  await updateBookedSlots();
}

// ---------------------- OVERLAY BOOKINGS ON TABLE ----------------------
async function updateBookedSlots() {
  const selectedDate = dateInput.value;
  if (!selectedDate) {
    console.log("No date selected yet, skipping updateBookedSlots (instant).");
    return;
  }

  let bookings = [];
  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    bookings = await res.json();
  } catch (err) {
    console.warn("SERVER OFFLINE → cannot load bookings.", err);
    return;
  }

  console.log("Current bookings (instant):", bookings);

  document.querySelectorAll("td[data-room]").forEach(cell => {
    const room = cell.dataset.room;
    const time = cell.dataset.time;

    const match = bookings.find(
      b =>
        b.resource === room &&
        b.hour === time &&
        b.date === selectedDate &&
        (b.status === "Booked" || b.status === "booked")
    );

    if (match) {
      cell.classList.add("booked");
      cell.classList.remove("available");
      cell.textContent = "booked";
    } else if (cell.textContent !== "unavailable") {
      cell.classList.remove("booked");
      cell.classList.add("available");
      cell.textContent = "available";
    }
  });
}

// ---------------------- HANDLE CELL CLICK → INSTANT BOOK ----------------------
async function handleCellClick() {
  const cell = this;

  // login check
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
  if (!currentUser) {
    alert("⚠️ You must be logged in to make a booking.");
    window.location.href = "login.html";
    return;
  }

  const selectedDate = dateInput.value;
  if (!selectedDate) {
    alert("Select a date first.");
    return;
  }

  const room = cell.dataset.room;
  const time = cell.dataset.time;

  console.log("Instant cell clicked:", { room, time, selectedDate });

  if (bookingInProgress) {
    alert("⚠️ You already made a booking. Refresh the page to book again.");
    return;
  }

  // cannot book unavailable or already booked cells
  if (cell.textContent === "unavailable" || cell.textContent === "booked") {
    return;
  }

  // Check if user already booked this resource type for that day
  let bookings = [];
  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    bookings = await res.json();
  } catch (err) {
    console.warn("SERVER OFFLINE → cannot validate existing bookings.", err);
  }

  const existingBooking = bookings.find(
    b =>
      b.username === currentUser.email &&
      b.item === resourceTypeName &&
      b.date === selectedDate &&
      (b.status === "Booked" || b.status === "booked")
  );

  if (existingBooking) {
    alert("⚠️ You already have a booking for this resource type on that date.");
    return;
  }

  const booking = {
    id: Date.now(),
    username: currentUser.email,
    resource: room,          // specific room (e.g., "LB 251")
    item: resourceTypeName,  // resource type (e.g., "Study Rooms")
    date: selectedDate,
    hour: time
    // status will be set to "Booked" by backend for Instant bookingType
  };

  bookingInProgress = true;

  try {
    const res = await fetch("http://localhost:4000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking)
    });

    if (!res.ok) {
      const data = await res.json();
      alert("Error: " + data.error);
      bookingInProgress = false;
      return;
    }
  } catch (err) {
    alert("Server unreachable.");
    bookingInProgress = false;
    return;
  }

  // INSTANT: mark as booked immediately
  cell.classList.add("booked");
  cell.classList.remove("available");
  cell.textContent = "booked";

  // Optional: PATCH resource availability (same as your original)
  if (resourceIDParam) {
    try {
      await fetch(`http://localhost:4000/api/resources/${resourceIDParam}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newRoomStatus: "booked",
          roomIndex: room,
          timeIndex: time
        })
      });
    } catch (err) {
      console.warn("Failed to PATCH resource availability:", err);
    }
  }

  messageBox.textContent =
    `✔ Booking confirmed: ${room} at ${time}:00 on ${selectedDate}`;

  await updateBookedSlots();
  bookingInProgress = false;
}

// ---------------------- ATTACH CLICK HANDLERS ----------------------
function attachCellClickHandlers() {
  const cells = document.querySelectorAll("td[data-room]");
  cells.forEach(cell => cell.addEventListener("click", handleCellClick));
  console.log("Instant click handlers attached to cells:", cells.length);
}

// ---------------------- INITIAL LOAD ----------------------
window.addEventListener("load", async () => {
  console.log("window.load fired on INSTANT availability page");

  if (!dateInput.value) {
    dateInput.value = new Date().toISOString().split("T")[0];
    console.log("Default date set to:", dateInput.value);
  }

  await buildTableFromResource();
});

dateInput.addEventListener("change", updateBookedSlots);
