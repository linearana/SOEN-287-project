// login check
const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
if (!currentUser) {
  alert("⚠️ You must be logged in.");
  window.location.href = "login.html";
}

//get resource ID
urlParams = new URLSearchParams(window.location.search);
resourceID = urlParams.get("id");

const messageBox = document.getElementById("message");
const resourceTypeName = document.getElementById("resourceTitle").textContent.trim();

const dateInput = document.getElementById("date");

// time slots used as table columns
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
  tbody.innerHTML = ""; // clear whatever is there

  const roomsArray = resource.rooms.split(",").map(r => r.trim());

  roomsArray.forEach((roomName, roomIndex) => {
    const tr = document.createElement("tr");

    // first column: room name
    const tdRoom = document.createElement("td");
    tdRoom.textContent = roomName;
    tr.appendChild(tdRoom);

    // time slot columns
    TIMES.forEach((hour, colIndex) => {
      const td = document.createElement("td");
      td.dataset.room = roomName;
      td.dataset.time = String(hour);

      // use base availability from resources.json (if present)
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

  // after building rows, attach click handlers
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
      cell.textContent = "booked";
    } else if (cell.textContent !== "unavailable") {
      cell.classList.remove("booked");
      cell.classList.add("available");
      cell.textContent = "available";
    }
  });
}

// ---------------------- SEND REQUEST (ATTACH AFTER TABLE BUILT) ----------------------
function attachCellClickHandlers() {
  document.querySelectorAll("td[data-room]").forEach(cell => {
    cell.addEventListener("click", async (event) => {
      // stop any weird default behaviours
      event.preventDefault();
      event.stopPropagation();

      if (cell.classList.contains("booked") || cell.textContent === "X") return;

    const room = cell.dataset.room;
    const time = cell.dataset.time;
    const dateInput = document.getElementById("date").value;

    console.log("Clicked:", room, time);

    if (bookingInProgress) {
      alert("⚠️ You already made a booking. Refresh the page to book again.");
      return;
    }

    // cannot book unavailable cells or booked ones
    if (cell.textContent === "unavailable" || cell.textContent === "booked") return;

    if (!dateInput) {
      alert("Select a date first.");
      return;
    }

    let bookings = [];
    try {
      const res = await fetch("http://localhost:4000/api/bookings");
      bookings = await res.json();
    } catch (err) {
      console.warn("SERVER OFFLINE → cannot validate existing bookings.");
    }

    const existingBooking = bookings.find(
      b =>
        b.username === currentUser.email &&
        b.item === resourceTypeName &&
        b.date === dateInput &&
        (b.status === "Booked" || b.status === "pending")
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
      date: dateInput,
      hour: time,
      status: "booked"
    };

    //  lock booking so user can't book twice
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
        bookingInProgress = false; // unlock on server error
        return;
      }

    // UI update
    cell.classList.add("booked");
    cell.classList.remove("available");
    cell.textContent = "booked";

    // update resource availability
    await fetch(`http://localhost:4000/api/resources/${resourceID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        newRoomStatus: "booked",
        roomIndex: room,
        timeIndex: time
       })
      });

      const selectedDate = new Date(rawDate).toLocaleDateString();
      const room = cell.dataset.room;
      const time = cell.dataset.time;

      // check if this user already has booking for THIS resource type that day
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
        // status determined by backend based on bookingType
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

      // Just refresh slots to reflect backend's status (Booked or Pending)
      await updateBookedSlots();

      const msg = `📩 Booking created for ${room} at ${time}:00 on ${selectedDate}`;
      messageBox.textContent = msg;
      sessionStorage.setItem("lastBookingMessage", msg);
      sessionStorage.setItem("lastBookingMessageTime", Date.now().toString());
    });
  });
}

// ---------------------- DATE HANDLING + INITIAL LOAD ----------------------
dateInput.addEventListener("change", () => {
  sessionStorage.setItem("selectedDate", dateInput.value);
  updateBookedSlots();
});

window.onload = () => {
  let ele = document.getElementById("date");
  ele.value = new Date().toISOString().split("T")[0];
  updateBookedSlots();
};

  if (savedDate) {
    dateInput.value = savedDate;       // use last date from this tab
  } else {
    dateInput.value = new Date().toISOString().split("T")[0]; // default today
  }

  // build table from resources.json before loading bookings
  await buildTableFromResource();
  await updateBookedSlots();

  // restore message if still recent
  const savedMsg = sessionStorage.getItem("lastBookingMessage");
  const savedMsgTime = Number(sessionStorage.getItem("lastBookingMessageTime") || 0);
  const now = Date.now();
  if (savedMsg && now - savedMsgTime < 30000) {
    messageBox.textContent = savedMsg;
  }
});
