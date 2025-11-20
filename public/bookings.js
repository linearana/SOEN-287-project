console.log("bookings.js loaded");

// login check
const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
if (!currentUser) {
  alert("⚠️ You must be logged in to book.");
  window.location.href = "login.html";
}


const resourceTypeName = "";

const messageBox = document.getElementById("message");

// ---------------------- LOAD BOOKED SLOTS ----------------------
async function updateBookedSlots() {
  console.log("Updating booked slots…");

  const dateInput = document.getElementById("date");
  if (!dateInput) return; // page has no date selector (like My Bookings page)

  const selectedDate = dateInput.value;

  let bookings = [];

  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    bookings = await res.json();
  } catch (err) {
    console.warn("⚠️ Server offline, cannot load bookings.");
    return;
  }

  const cells = document.querySelectorAll("td[data-room]");
  console.log("Cells found:", cells.length);

  cells.forEach(cell => {
    const room = cell.dataset.room;
    const time = cell.dataset.time;

    const match = bookings.find(
      b =>
        b.resource === room &&
        b.hour === time &&
        b.date === selectedDate
    );

    if (match) {
      cell.classList.add("booked");
      cell.classList.remove("available");
      cell.style.backgroundColor = "red";
      cell.style.color = "white";
      cell.textContent = "Booked";
    } else {
      if (cell.textContent !== "X") {
        cell.classList.remove("booked");
        cell.classList.add("available");
        cell.style.backgroundColor = "";
        cell.style.color = "black";
        cell.textContent = "Available";
      }
    }
  });
}

// ---------------------- BOOK SLOT ----------------------
function attachBookingHandlers() {
  console.log("Attaching click handlers…");

  const cells = document.querySelectorAll("td[data-room]");
  console.log("Clickable cells:", cells.length);

  cells.forEach(cell => {
    cell.addEventListener("click", async () => {
      console.log("Clicked:", cell.dataset.room, cell.dataset.time);

      if (cell.classList.contains("booked") || cell.textContent === "X") return;

      const dateInput = document.getElementById("date");
      if (!dateInput || !dateInput.value) {
        alert("⚠️ Select a date first.");
        return;
      }

      const booking = {
        id: Date.now(),
        username: currentUser.email,
        resource: cell.dataset.room,
        item: resourceTypeName,
        date: dateInput.value,   // exact YYYY-MM-DD
        hour: cell.dataset.time,
        status: "Booked"
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
} catch (err) {
  alert("⚠️ Cannot contact server.");
  return;
}

      // Update UI
      cell.classList.add("booked");
      cell.classList.remove("available");
      cell.style.backgroundColor = "red";
      cell.style.color = "white";
      cell.textContent = "Booked";

      if (messageBox) {
        messageBox.textContent =
          `✔ Booking confirmed: ${booking.resource} at ${booking.hour}:00 on ${booking.date}`;
      }
    });
  });
}

window.onload = () => {
  const dateInput = document.getElementById("date");

  if (dateInput) {
    // auto-fill today's date
    dateInput.value = new Date().toISOString().split("T")[0];

    updateBookedSlots();
    attachBookingHandlers();

    dateInput.addEventListener("change", updateBookedSlots);
  }
};
