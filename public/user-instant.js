// ---------------------- GET RESOURCE ID ----------------------
const urlParams = new URLSearchParams(window.location.search);
const resourceID = urlParams.get("id");

const messageBox = document.getElementById("message");
const resourceTypeName = document.getElementById("resourceTitle").textContent.trim();

// ---------------------- LOAD BOOKED / BLOCKED SLOTS ----------------------
async function updateBookedSlots() {
  const dateInput = document.getElementById("date").value; // ISO yyyy-mm-dd

  let bookings = [];
  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    bookings = await res.json();
  } catch (err) {
    console.warn("SERVER OFFLINE → cannot load bookings.");
    return;
  }

  document.querySelectorAll("td[data-room]").forEach(cell => {
    const room = cell.dataset.room;
    const time = cell.dataset.time;

    const match = bookings.find(
      b =>
        b.resource === room &&
        String(b.hour) === String(time) &&
        b.date === dateInput
    );

    // Reset first (but keep hard X if you ever had structural X)
    cell.classList.remove("booked", "pending", "unavailable");
    if (cell.textContent === "X") {
      cell.classList.add("unavailable");
      return;
    }

    if (!match) {
      cell.classList.add("available");
      cell.textContent = "available";
      return;
    }

    const status = String(match.status || "").toLowerCase();

    if (status === "unavailable") {
      cell.classList.add("unavailable");
      cell.textContent = "X";
    } else if (status === "booked") {
      cell.classList.add("booked");
      cell.textContent = "booked";
    } else if (status === "pending") {
      cell.classList.add("pending");
      cell.textContent = "pending";
    } else {
      // any other unknown status – treat as booked
      cell.classList.add("booked");
      cell.textContent = match.status;
    }
  });
}

// ---------------------- PREVENT DOUBLE-CLICK ONLY ----------------------
let bookingInProgress = false;

// ---------------------- BOOK SLOT ----------------------
document.querySelectorAll("td[data-room]").forEach(cell => {
  cell.addEventListener("click", async () => {
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
    if (!currentUser) {
      alert("You must be logged in.");
      window.location.href = "login.html";
      return;
    }

    const dateInput = document.getElementById("date").value.trim();
    if (!dateInput) {
      alert("⚠️ Select a date first.");
      return;
    }

    const room = cell.dataset.room;
    const time = cell.dataset.time;

    // don’t book blocked or already booked cells
    if (cell.classList.contains("unavailable") ||
        cell.classList.contains("booked") ||
        cell.classList.contains("pending")) {
      return;
    }

    if (bookingInProgress) {
      // just stop double-click spam; server also protects anyway
      return;
    }

    bookingInProgress = true;

    let bookings = [];
    try {
      const res = await fetch("http://localhost:4000/api/bookings");
      bookings = await res.json();
    } catch (err) {
      console.warn("SERVER OFFLINE → cannot validate existing bookings.");
    }

    // one booking per resource type *per day* (different days allowed)
    const existingBooking = bookings.find(
      b =>
        b.username === currentUser.email &&
        b.item === resourceTypeName &&
        b.date === dateInput &&
        (b.status === "Booked" || b.status === "Pending")
    );

    if (existingBooking) {
      alert("⚠️ You already booked this resource type for that day.");
      bookingInProgress = false;
      return;
    }

    const booking = {
      id: Date.now(),
      username: currentUser.email,
      resource: room,
      item: resourceTypeName,
      date: dateInput,
      hour: time
      // status will be forced to "Booked" on backend for Instant type
    };

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

    messageBox.textContent =
      `✔ Booking confirmed: ${room} at ${time}:00 on ${dateInput}`;

    await updateBookedSlots();
    bookingInProgress = false; // allow another booking (on another day, etc.)
  });
});

// ---------------------- DATE HANDLING ----------------------
window.onload = () => {
  const ele = document.getElementById("date");
  ele.value = new Date().toISOString().split("T")[0]; // today
  updateBookedSlots();
};

document.getElementById("date").addEventListener("change", () => {
  updateBookedSlots();
  bookingInProgress = false; // new date → allow booking again
});
