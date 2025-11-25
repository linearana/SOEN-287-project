console.log("user-request.js loaded");

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
  console.log("buildTableFromResource() called");

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

  // Prefer ID if present; otherwise match by title
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
    console.error("❌ Resource not found for page:", {
      resourceID,
      resourceTypeName,
      available: resources.map(r => ({ id: r.id, title: r.title }))
    });
    alert("Could not find matching resource configuration for this page.");
    return;
  }

  console.log("Matched resource:", resource);

  const tbody = document.querySelector("table.atable tbody");
  if (!tbody) {
    console.error("❌ tbody for .atable not found");
    return;
  }
  tbody.innerHTML = "";

  const roomsArray = resource.rooms.split(",").map(r => r.trim());
  console.log("Rooms for this resource:", roomsArray);

  roomsArray.forEach((roomName, roomIndex) => {
    const tr = document.createElement("tr");

    // Room name cell
    const tdRoom = document.createElement("td");
    tdRoom.textContent = roomName;
    tr.appendChild(tdRoom);

    // Time cells
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

  console.log("Table rows built:", tbody.children.length);

  // after building rows, hook up click handlers
  attachCellClickHandlers();

  // and overlay bookings for current date
  await updateBookedSlots();
}

// ---------------------- OVERLAY BOOKINGS ON TABLE ----------------------
async function updateBookedSlots() {
  const rawDate = dateInput.value;
  if (!rawDate) {
    console.log("No date selected yet, skipping updateBookedSlots.");
    return;
  }

  const selectedDate = rawDate; // "yyyy-mm-dd"
  console.log("Updating slots for date:", selectedDate);

  let bookings = [];
  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    bookings = await res.json();
  } catch (err) {
    console.warn("SERVER OFFLINE → cannot load bookings.", err);
    return;
  }

  console.log("Current bookings:", bookings);

  document.querySelectorAll("td[data-room]").forEach(cell => {
    const room = cell.dataset.room;
    const time = cell.dataset.time;

    const match = bookings.find(
      b =>
        b.resource === room &&
        b.hour === time &&
        b.date === selectedDate &&
        (b.status === "Booked" ||
         b.status === "Pending" ||
         b.status === "booked" ||
         b.status === "pending")
    );

    if (match) {
      cell.classList.add("booked");
      cell.classList.remove("available");
      cell.textContent =
        match.status.toLowerCase() === "pending" ? "pending" : "booked";
    } else if (cell.textContent !== "unavailable") {
      cell.classList.remove("booked");
      cell.classList.add("available");
      cell.textContent = "available";
    }
  });
}

// ---------------------- HANDLE CELL CLICK → BOOK ----------------------
async function handleCellClick() {
  const cell = this;

  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
  if (!currentUser) {
    alert("⚠️ You must be logged in to make a booking.");
    window.location.href = "login.html";
    return;
  }

  const rawDate = dateInput.value;
  if (!rawDate) {
    alert("Select a date first.");
    return;
  }

  const selectedDate = rawDate;
  const room = cell.dataset.room;
  const time = cell.dataset.time;

  console.log("Cell clicked:", { room, time, selectedDate });

  if (bookingInProgress) {
    alert("⚠️ You already made a booking. Refresh the page to book again.");
    return;
  }

  if (
    cell.textContent === "unavailable" ||
    cell.textContent === "booked" ||
    cell.textContent === "pending"
  ) {
    return;
  }

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
      (b.status === "Booked" ||
       b.status === "Pending" ||
       b.status === "booked" ||
       b.status === "pending")
  );

  if (existingBooking) {
    alert("⚠️ You already booked this resource type for that day.");
    return;
  }

  const booking = {
    id: Date.now(),
    username: currentUser.email,
    resource: room,
    item: resourceTypeName,
    date: selectedDate,
    hour: time
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

  // optimistic UI
  cell.classList.add("booked");
  cell.classList.remove("available");
  cell.textContent = "pending";

  messageBox.textContent =
    `✔ Booking request: ${room} at ${time}:00 on ${selectedDate}`;

  await updateBookedSlots();

  bookingInProgress = false;
}

// ---------------------- ATTACH CLICK HANDLERS ----------------------
function attachCellClickHandlers() {
  document.querySelectorAll("td[data-room]").forEach(cell => {
    cell.addEventListener("click", handleCellClick);
  });
  console.log("Click handlers attached to cells:", document.querySelectorAll("td[data-room]").length);
}

// ---------------------- INITIAL LOAD ----------------------
window.addEventListener("load", async () => {
  console.log("window.load fired on availability page");

  if (!dateInput.value) {
    dateInput.value = new Date().toISOString().split("T")[0];
    console.log("Default date set to:", dateInput.value);
  }

  await buildTableFromResource();
});

dateInput.addEventListener("change", updateBookedSlots);
