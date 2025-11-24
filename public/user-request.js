const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
if (!currentUser) {
  alert("⚠️ You must be logged in.");
  window.location.href = "login.html";
}

//get resource ID
urlParams = new URLSearchParams(window.location.search);
resourceID = urlParams.get("id");

const messageBox = document.getElementById("message");
const resourceTypeName = document
  .getElementById("resourceTitle")
  .textContent
  .trim();

const dateInput = document.getElementById("date");

// time columns used in the table
const TIMES = [12, 13, 14, 15, 16, 17];

// ---------------------- BUILD BASE TABLE FROM RESOURCES ----------------------
async function buildTableFromResource() {
  let resources = [];
  try {
    const res = await fetch("http://localhost:4000/api/resources");
    resources = await res.json();
  } catch {
    console.error("Cannot load resources from server.");
    return;
  }

  const resource = resources.find(r => r.title === resourceTypeName);
  if (!resource) {
    console.error("Resource not found for page:", resourceTypeName);
    return;
  }

  const tbody = document.querySelector("table.atable tbody");
  tbody.innerHTML = ""; // clear existing rows

  const roomsArray = resource.rooms.split(",").map(r => r.trim());

  roomsArray.forEach((roomName, roomIndex) => {
    const tr = document.createElement("tr");

    // First cell: room name (with label like "FA 3-546 - Ceramics" if you want)
    const tdRoom = document.createElement("td");
    tdRoom.textContent = roomName;
    tr.appendChild(tdRoom);

    TIMES.forEach((hour, colIndex) => {
      const td = document.createElement("td");
      td.dataset.room = roomName;
      td.dataset.time = String(hour);

      // read base status from resources.json (if present)
      const baseStatus = resource.roomsStatus?.[roomIndex]?.[colIndex] || "available";

      if (baseStatus === "unavailable") {
        td.textContent = "X";
        td.classList.add("unavailable");
      } else {
        td.textContent = "Available";
        td.classList.add("available");
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  // After building the table, attach click handlers to the new cells
  attachCellClickHandlers();
}

// ---------------------- LOAD BOOKED / PENDING SLOTS ----------------------
async function updateBookedSlots() {
  const rawDate = dateInput.value;
  if (!rawDate) return;

  const selectedDate = new Date(rawDate).toLocaleDateString();

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
        b.hour === time &&
        b.date === selectedDate
    );

    if (match) {
      cell.classList.remove("available");
      cell.classList.add("booked");
      cell.textContent = match.status === "pending" ? "pending" : "booked";
    } else {
      // only reset cells that aren't permanently X
      if (cell.textContent !== "X") {
        cell.classList.remove("booked");
        cell.classList.add("available");
        cell.textContent = "available";
      }
    }
  });
}

// ---------------------- SEND REQUEST ----------------------
document.querySelectorAll("td[data-room]").forEach(cell => {
  cell.addEventListener("click", async () => {
    if (cell.textContent === "booked" || cell.textContent === "unavailable" || cell.textContent === "pending") return;

      if (cell.classList.contains("booked") || cell.textContent === "X") return;

      const rawDate = dateInput.value.trim();
      if (!rawDate) {
        alert("⚠️ Select a date first.");
        return;
      }

    cell.classList.remove("available");
    cell.classList.add("pending");
    cell.textContent = "pending";

    // update resource availability
    await fetch(`http://localhost:4000/api/resources/${resourceID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        newRoomStatus: "pending",
        roomIndex: room,
        timeIndex: time
       })
      });

      const selectedDate = new Date(rawDate).toLocaleDateString();
      const room = cell.dataset.room;
      const time = cell.dataset.time;

      // check if this user already has a booking for THIS resource type on this date
      let bookings = [];
      try {
        const res = await fetch("http://localhost:4000/api/bookings");
        bookings = await res.json();
      } catch {
        alert("⚠️ Cannot contact server to verify existing bookings.");
        return;
      }

      const alreadyHasBookingToday = bookings.some(b =>
        b.username === currentUser.email &&
        b.date === selectedDate &&
        b.item === resourceTypeName &&
        b.status !== "Cancelled" &&
        b.status !== "Rejected"
      );

      if (alreadyHasBookingToday) {
        alert("❌ You already have a booking for this resource on this date.");
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

      try {
        const res = await fetch("http://localhost:4000/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(booking)
        });

        if (!res.ok) {
          const data = await res.json();
          alert("❌ " + data.error);
          return;
        }
      } catch {
        alert("⚠️ Cannot contact server.");
        return;
      }

      cell.classList.remove("available");
      cell.classList.add("booked");
      cell.style.backgroundColor = "orange";
      cell.style.color = "black";
      cell.textContent = "Pending";

      messageBox.textContent =
        `📩 Request sent for ${room} at ${time}:00 on ${selectedDate}`;
      sessionStorage.setItem("lastBookingMessage", messageBox.textContent);
      sessionStorage.setItem("lastBookingMessageTime", Date.now().toString());
    });
  });
}

// ---------------------- DATE HANDLING + INITIAL LOAD ----------------------
dateInput.addEventListener("change", () => {
  sessionStorage.setItem("selectedDate", dateInput.value);
  updateBookedSlots();
});

window.addEventListener("load", async () => {
  const savedDate = sessionStorage.getItem("selectedDate");
  if (savedDate) {
    dateInput.value = savedDate;
  } else {
    dateInput.value = new Date().toISOString().split("T")[0];
  }

  await buildTableFromResource();
  await updateBookedSlots();

  // restore last booking message if recent
  const savedMsg = sessionStorage.getItem("lastBookingMessage");
  const savedMsgTime = Number(sessionStorage.getItem("lastBookingMessageTime") || 0);
  const now = Date.now();
  if (savedMsg && now - savedMsgTime < 30000) {
    messageBox.textContent = savedMsg;
  }
});
