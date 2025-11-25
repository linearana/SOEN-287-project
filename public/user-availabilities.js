// ---------------------- GET RESOURCE ID ----------------------
const urlParams = new URLSearchParams(window.location.search);
const resourceID = urlParams.get("id");

const messageBox = document.getElementById("message");

// ---------------------- BUILD TABLE ----------------------
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
  document.getElementById("resourceTitle").textContent = resource.title;

  // Some entries use rulesResource, some use rules → fallback
  const rulesEl = document.getElementById("rulesUser");
  if (rulesEl) {
    rulesEl.textContent = resource.rulesResource || resource.rules || "";
  }

  // 3. Build table skeleton based on rooms + roomsStatus
  const roomsArray = resource.rooms.split(",").map(r => r.trim());
  const tableBody = document.getElementById("tableBody");
  if (!tableBody) {
    console.error('No <tbody id="tableBody"> found');
    return;
  }

  tableBody.innerHTML = ""; // clear old rows

  // We assume 6 time slots: 12–17
  const HOURS = [12, 13, 14, 15, 16, 17];

  roomsArray.forEach((room, roomIndex) => {
    const row = document.createElement("tr");

    // room name
    row.innerHTML = `<td>${room}</td>`;

    HOURS.forEach((hour, timeIndex) => {
      // base status from resource.roomsStatus, fallback to "available"
      const baseStatus =
        resource.roomsStatus?.[roomIndex]?.[timeIndex] || "available";

      let cellText;
      if (baseStatus === "unavailable") {
        cellText = "X";
      } else {
        cellText = "available";
      }

      row.innerHTML += `
        <td class="${baseStatus}" data-room="${room}" data-time="${hour}">
          ${cellText}
        </td>
      `;
    });

    tableBody.appendChild(row);
  });

  // 4. Overlay bookings for the current date
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

// ---------------------- UPDATE BOOKED/PENDING SLOTS ----------------------
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

  document.querySelectorAll("td[data-room]").forEach(cell => {
    const room = cell.dataset.room;
    const time = cell.dataset.time;

    const match = bookings.find(
      b =>
        b.resource === room &&
        String(b.hour) === String(time) &&
        b.date === selectedDate
    );

    if (match) {
      // Normalize status to lower-case for CSS classes
      const normalizedStatus = String(match.status).toLowerCase(); // "booked", "pending"

      cell.classList.remove("available");
      cell.classList.remove("booked", "pending");
      cell.classList.add(normalizedStatus);

      cell.textContent =
        normalizedStatus === "pending" ? "Pending" : "Booked";
    } else {
      // Restore to base "available" only if not structurally unavailable (we treat 'X' as unavailable)
      if (cell.textContent !== "X") {
        cell.classList.remove("booked", "pending");
        cell.classList.add("available");
        cell.textContent = "available";
      }
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
