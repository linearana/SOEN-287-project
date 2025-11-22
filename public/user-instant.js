console.log("JS loaded, attaching handlers…");

// login check
const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
if (!currentUser) {
  alert("You must be logged in.");
  window.location.href = "login.html";
}

const messageBox = document.getElementById("message");
const resourceTypeName =
  document.getElementById("resourceTitle").textContent.trim();

//load booked slots
async function updateBookedSlots() {
  const dateInput = document.getElementById("date").value;

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
      b => b.resource === room && b.hour === time && b.date === dateInput
    );

    if (match) {
      cell.classList.add("booked");
      cell.classList.remove("available");
      cell.style.background = "red";
      cell.style.color = "black";
      cell.textContent = "Booked";
    } else if (cell.textContent !== "X") {
      cell.classList.remove("booked");
      cell.classList.add("available");
      cell.style.background = "";
      cell.style.color = "black";
      cell.textContent = "Available";
    }
  });
}

// PREVENT DOUBLE BOOKING
let bookingInProgress = false;  
//  resets automatically when page refreshes

// BOOK SLOT
document.querySelectorAll("td[data-room]").forEach(cell => {
  cell.addEventListener("click", async () => {

    const room = cell.dataset.room;
    const time = cell.dataset.time;
    const dateInput = document.getElementById("date").value;

    console.log("Clicked:", room, time);

    if (bookingInProgress) {
      alert("⚠️ You already made a booking. Refresh the page to book again.");
      return;
    }

    // cannot book X cells or booked ones
    if (cell.textContent === "X" || cell.classList.contains("booked")) return;

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
        (b.status === "Booked" || b.status === "Pending")
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
      status: "Booked"
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
    } catch (err) {
      alert("Server unreachable.");
      bookingInProgress = false; // unlock on failure
      return;
    }

    // UI update
    cell.classList.add("booked");
    cell.classList.remove("available");
    cell.style.backgroundColor = "red";
    cell.style.color = "black";
    cell.textContent = "Booked";

    messageBox.textContent =
      `✔ Booking confirmed: ${room} at ${time}:00 on ${dateInput}`;

    updateBookedSlots();
  });
});

window.onload = () => {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("date").value = today;
  updateBookedSlots();
};

document.getElementById("date").addEventListener("change", updateBookedSlots);
