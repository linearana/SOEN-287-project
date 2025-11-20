console.log("JS loaded, attaching handlers…");

// Get current user
const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
if (!currentUser) {
  alert("You must be logged in.");
  window.location.href = "login.html";
}

const messageBox = document.getElementById("message");
const resourceTypeName =
  document.getElementById("resourceTitle").textContent.trim();

// ------------------------------------------------------
// Load booked slots from server
// ------------------------------------------------------
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
    } else {
      if (cell.textContent !== "X") {
        cell.classList.remove("booked");
        cell.classList.add("available");
        cell.style.background = "";
        cell.style.color = "black";
        cell.textContent = "Available";
      }
    }
  });
}

// ------------------------------------------------------
// When clicking a cell → send booking to server
// ------------------------------------------------------
document.querySelectorAll("td[data-room]").forEach(cell => {
  cell.addEventListener("click", async () => {
    console.log("Clicked:", cell.dataset.room, cell.dataset.time);

    if (cell.classList.contains("booked") || cell.textContent === "X") return;

    const dateInput = document.getElementById("date").value;
    if (!dateInput) {
      alert("Select a date first.");
      return;
    }

    const booking = {
      id: Date.now(),
      username: currentUser.email,
      resource: cell.dataset.room,
      item: resourceTypeName,
      date: dateInput,
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
        alert("Error: " + data.error);
        return;
      }
    } catch (err) {
      alert("Server unreachable.");
      return;
    }

    cell.classList.add("booked");
    cell.classList.remove("available");
    cell.style.background = "red";
    cell.style.color = "black";
    cell.textContent = "Booked";

    messageBox.textContent =
      `✔ Booking confirmed: ${booking.resource} at ${booking.hour}:00 on ${booking.date}`;

    updateBookedSlots();
  });
});

// Auto-load today's data
window.onload = () => {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("date").value = today;
  updateBookedSlots();
};

document.getElementById("date").addEventListener("change", updateBookedSlots);
