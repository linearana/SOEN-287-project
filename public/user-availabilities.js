// ---------------------- GET RESOURCE ID ----------------------
const urlParams = new URLSearchParams(window.location.search);
const resourceID = urlParams.get("id");

const messageBox = document.getElementById("message");

// ---------------------- BUILD TABLE ----------------------
async function loadAvailabilities(resourceID) {
  // 1. Get bookings
  const resBookings = await fetch("http://localhost:4000/api/bookings");
  const bookings = await resBookings.json();

  // 2. Get resource metadata
  const resResources = await fetch("http://localhost:4000/api/resources");
  const resources = await resResources.json();
  const resource = resources.find(r => r.id == resourceID);

  if (!resource) {
    console.error("Resource not found");
    return;
  }

  // 3. Update page info
  document.title = resource.title;
  document.getElementById("resourceTitle").textContent = resource.title;
  document.getElementById("rulesUser").textContent = resource.rulesResource;

  // 4. Build table skeleton
  const roomsArray = resource.rooms.split(",").map(r => r.trim());
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = ""; // clear old rows

  roomsArray.forEach(room => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${room}</td>`;

    for (let hour = 12; hour <= 17; hour++) {
      row.innerHTML += `
        <td class="available" data-room="${room}" data-time="${hour}">
          available
        </td>
      `;
    }

    tableBody.appendChild(row);
  });

  // 5. Overlay bookings
  updateBookedSlots();

  // 6. Load booking type script
  if (resource.bookingType === "Instant") {
    const script = document.createElement("script");
    script.src = "user-instant.js";
    document.body.appendChild(script);
  } else if (resource.bookingType === "Request") {
    const script = document.createElement("script");
    script.src = "user-request.js";
    document.body.appendChild(script);
  }
}

// ---------------------- UPDATE BOOKED/PENDING SLOTS ----------------------
async function updateBookedSlots() {
  const selectedDate = document.getElementById("date").value; // ISO format yyyy-mm-dd

  let bookings = [];
  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    bookings = await res.json();
  } catch {
    console.warn("Server offline, cannot load bookings.");
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
      cell.classList.remove("available");
      cell.classList.add(match.status); // "booked" or "pending"
      cell.textContent = match.status;
    } else {
      if (cell.textContent !== "X") {
        cell.classList.remove("booked", "pending");
        cell.classList.add("available");
        cell.textContent = "available";
      }
    }
  });
}

// ---------------------- AUTO-CHOOSE DATE ----------------------
window.onload = () => {
  const ele = document.getElementById("date");
  ele.value = new Date().toISOString().split("T")[0]; // today
  loadAvailabilities(resourceID);
};

document.getElementById("date").addEventListener("change", updateBookedSlots);
