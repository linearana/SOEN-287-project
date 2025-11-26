// ---------------------- GET RESOURCE ID ----------------------
const urlParams = new URLSearchParams(window.location.search);
const resourceID = urlParams.get("id");

const messageBox = document.getElementById("message");

// We'll reuse the hours you already use everywhere
const HOURS = [12, 13, 14, 15, 16, 17];

// ---------------------- BUILD TABLE (STRUCTURE ONLY) ----------------------
async function loadAvailabilities(resourceID) {
  if (!resourceID) {
    console.error("No resourceID in URL (e.g. ?id=3)");
    return;
  }

  // 1. Get resource metadata
  let resources;
  try {
    const resResources = await fetch("http://localhost:4000/api/resources");
    resources = await resResources.json();
  } catch (err) {
    console.error("Failed to load resources:", err);
    return;
  }

  const resource = resources.find(r => String(r.id) === String(resourceID));

  if (!resource) {
    console.error("Resource not found for id:", resourceID);
    return;
  }

  // 2. Update page info
  document.title = resource.title + " | Campus Booking";
  const titleEl = document.getElementById("resourceTitle");
  if (titleEl) titleEl.textContent = resource.title;

  // Some entries use rulesResource, some use rules → fallback
  const rulesEl = document.getElementById("rulesUser");
  if (rulesEl) {
    rulesEl.textContent = resource.rulesResource || resource.rules || "";
  }

  // 3. Build table skeleton based ONLY on rooms (not roomsStatus anymore)
  const roomsArray = resource.rooms.split(",").map(r => r.trim());
  const tableBody = document.getElementById("tableBody");
  if (!tableBody) {
    console.error('No <tbody id="tableBody"> found');
    return;
  }

  tableBody.innerHTML = ""; // clear old rows

  roomsArray.forEach(room => {
    const row = document.createElement("tr");

    // room name
    row.innerHTML = `<td>${room}</td>`;

    // for each hour create an "available" slot; real status will come from bookings.json
    HOURS.forEach(hour => {
      row.innerHTML += `
        <td class="available" data-room="${room}" data-time="${hour}">
          available
        </td>
      `;
    });

    tableBody.appendChild(row);
  });

  // 4. Overlay bookings for the current date (bookings.json drives status)
  await updateBookedSlots();

  // 5. Load behavior script based on bookingType
  if (resource.bookingType === "Instant") {
    const script = document.createElement("script");
    script.src = "user-instant.js";
    document.body.appendChild(script);
  } else if (resource.bookingType === "Request") {
    const script = document.createElement("script");
    script.src = "user-request.js";
    document.body.appendChild(script);
  } else {
    console.warn("Unknown bookingType:", resource.bookingType);
  }
}

// ---------------------- UPDATE SLOTS FROM bookings.json ----------------------
async function updateBookedSlots() {
  const dateInput = document.getElementById("date");
  if (!dateInput) {
    console.error("No #date input found");
    return;
  }

  const selectedDate = dateInput.value; // expecting yyyy-mm-dd
  if (!selectedDate) {
    console.log("No date selected yet → skip overlay");
    return;
  }

  let bookings = [];
  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    bookings = await res.json();
  } catch (err) {
    console.warn("Server offline, cannot load bookings.", err);
    return;
  }

  // Optional but cleaner: only consider bookings for THIS resource type
  const resourceTitle = document
    .getElementById("resourceTitle")
    ?.textContent
    .trim();

  if (resourceTitle) {
    bookings = bookings.filter(b => b.item === resourceTitle);
  }

  // Also only consider this selected date
  bookings = bookings.filter(b => b.date === selectedDate);

  const cells = document.querySelectorAll("td[data-room]");

  // 1️⃣ Reset ALL cells to "available" before applying bookings
  cells.forEach(cell => {
    cell.className = "available";
    cell.textContent = "available";
  });

  // 2️⃣ Apply bookings from bookings.json for this day
  cells.forEach(cell => {
    const room = cell.dataset.room;
    const time = cell.dataset.time;

    const match = bookings.find(
      b =>
        b.resource === room &&
        String(b.hour) === String(time) &&
        b.date === selectedDate
    );

    if (!match) return;

    const status = String(match.status || "").toLowerCase();

    // wipe old classes
    cell.className = "";

    if (status === "unavailable") {
      // admin block
      cell.classList.add("unavailable");
      cell.textContent = "X";
    } else if (status === "pending") {
      cell.classList.add("pending");
      cell.textContent = "Pending";
    } else if (status === "booked") {
      cell.classList.add("booked");
      cell.textContent = "Booked";
    } else {
      // any other status we didn't expect: still treat as booked-ish
      cell.classList.add("booked");
      cell.textContent = match.status;
    }
  });
}

// ---------------------- AUTO-CHOOSE DATE & INITIAL LOAD ----------------------
window.onload = () => {
  const ele = document.getElementById("date");
  if (ele && !ele.value) {
    ele.value = new Date().toISOString().split("T")[0]; // today
  }
  loadAvailabilities(resourceID);
};

document.getElementById("date").addEventListener("change", updateBookedSlots);

