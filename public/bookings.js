console.log("Bookings JS loaded.");

const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
if (!currentUser) {
  alert("You must be logged in.");
  window.location.href = "login.html";
}

const tableBody = document.getElementById("bookingsBody");
const cancelMessage = document.getElementById("cancelBookingMessage");

// load user bookings
async function loadBookings() {
  tableBody.innerHTML = ""; // reset table

  let allBookings = [];

  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    allBookings = await res.json();
  } catch (err) {
    console.error("Server unreachable → cannot load bookings.");
    return;
  }

  // Filter user bookings and sort newest → oldest
  const userBookings = allBookings
  .filter(b => b.username === currentUser.email)
  .sort((a, b) => b.id - a.id);  // newest first


  if (userBookings.length === 0) {
    tableBody.innerHTML = `
      <tr><td colspan="6">No bookings found.</td></tr>`;
    return;
  }

  userBookings.forEach(booking => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${booking.resource}</td>
      <td>${booking.item}</td>
      <td>${booking.date}</td>
      <td>${booking.hour}:00</td>
      <td>${booking.status}</td>
      <td><button data-id="${booking.id}" data-title="${booking.item}" data-room="${booking.resource}" data-time="${booking.hour}" class="cancelBtn">Cancel</button></td>
    `;

    tableBody.appendChild(row);
  });

  attachCancelHandlers();
}

// cancel booking
function attachCancelHandlers() {
  const cancelButtons = document.querySelectorAll(".cancelBtn");

  cancelButtons.forEach(btn => {
    btn.addEventListener("click", async () => {
      const bookingId = btn.dataset.id;

      // confirmation popup
      const confirmed = confirm("Are you sure you want to cancel this booking?");
      if (!confirmed) return;

      try {
        const res = await fetch(`http://localhost:4000/api/bookings/${bookingId}`, {
          method: "DELETE"
        });

        if (!res.ok) {
          const data = await res.json();
          alert("Error: " + data.error);
          return;
        }

        alert("✔ Booking cancelled.");
        loadBookings(); // reload table
      } catch (err) {
        console.error(err);
        alert("Server unreachable.");
      }

      const response = await fetch("/api/resources");
      const resources = await response.json();

      const resourceToCancel = resources.find(resource => resource.title === btn.dataset.title)
      let resourceID = resourceToCancel.id;

      await fetch(`http://localhost:4000/api/resources/${resourceID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          newRoomStatus: "available",
          roomIndex: btn.dataset.room,
          timeIndex: btn.dataset.time
        })
      });

      
    });
  });
}

// initialize
loadBookings();
