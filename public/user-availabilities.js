console.log("user-availability.js loaded");

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

  const ele = document.getElementById("date");
  if (ele) {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (!ele.value) {
      ele.value = todayStr;
    }

    if (resource.bookingType === "Instant") {
      ele.setAttribute("min", todayStr);
      if (ele.value < todayStr) {
        ele.value = todayStr;
      }
    } else if (resource.bookingType === "Request") {
      const minDate = new Date();
      minDate.setDate(today.getDate() + 8);
      const minStr = minDate.toISOString().split("T")[0];

      ele.setAttribute("min", minStr);
      if (ele.value < minStr) {
        ele.value = minStr;
      }
    }
  }

  document.title = resource.title + " | Campus Booking";
  document.getElementById("resourceTitle").textContent = resource.title;

  const rulesEl = document.getElementById("rulesUser");
  if (rulesEl) {
    rulesEl.textContent = resource.rulesResource || resource.rules || "";
  }

  const roomsArray = resource.rooms.split(",").map(r => r.trim());
  const tableBody = document.getElementById("tableBody");
  if (!tableBody) {
    console.error('No <tbody id="tableBody"> found');
    return;
  }

  tableBody.innerHTML = "";

  const HOURS = [12, 13, 14, 15, 16, 17];

  roomsArray.forEach((room, roomIndex) => {
    const row = document.createElement("tr");

    // room name
    row.innerHTML = `<td>${room}</td>`;

    HOURS.forEach((hour, timeIndex) => {
      const baseStatus =
        resource.roomsStatus?.[roomIndex]?.[timeIndex] || "available";

      let cellText = baseStatus === "unavailable" ? "X" : "available";

      row.innerHTML += `
        <td class="${baseStatus}" data-room="${room}" data-time="${hour}">
          ${cellText}
        </td>
      `;
    });

    tableBody.appendChild(row);
  });

  await updateBookedSlots();

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

// ---------------------- UPDATE BOOKINGS ----------------------
async function updateBookedSlots() {
  const dateInput = document.getElementById("date");
  if (!dateInput) {
    console.error("No #date input found");
    return;
  }

  const selectedDate = dateInput.value;
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

    // Reset cell first
    cell.classList.remove("available", "booked", "pending", "unavailable");
    cell.classList.add("available");
    cell.textContent = "available";

    if (match) {
      const status = String(match.status).toLowerCase();

      if (status === "unavailable") {
        cell.classList.remove("available");
        cell.classList.add("unavailable");
        cell.textContent = "X";
      } else if (status === "pending") {
        cell.classList.remove("available");
        cell.classList.add("pending");
        cell.textContent = "Pending";
      } else if (status === "booked") {
        cell.classList.remove("available");
        cell.classList.add("booked");
        cell.textContent = "Booked";
      }
    }
  });
}

// ---------------------- INITIAL LOAD ----------------------
window.onload = () => {
  const ele = document.getElementById("date");
  if (ele && !ele.value) {
    ele.value = new Date().toISOString().split("T")[0]; // today
  }
  loadAvailabilities(resourceID);
};
