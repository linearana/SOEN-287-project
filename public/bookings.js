console.log("Bookings JS loaded.");

const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
if (!currentUser) {
  alert("You must be logged in.");
  window.location.href = "login.html";
}

const tableBody = document.getElementById("bookingsBody");
const cancelMessage = document.getElementById("cancelBookingMessage");

// ---------------------- LOAD USER BOOKINGS ----------------------
async function loadBookings() {
  tableBody.innerHTML = ""; // reset table

  let allBookings = [];

  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    allBookings = await res.json();
  } catch (err) {
    console.error("Server unreachable → cannot load bookings.");
    tableBody.innerHTML = `
      <tr><td colspan="6">Error loading bookings from server.</td></tr>`;
    return;
  }

  // Filter user bookings and sort newest → oldest
  const userBookings = allBookings
    .filter(b => b.username === currentUser.email)
    .sort((a, b) => b.id - a.id); // newest first

  if (userBookings.length === 0) {
    tableBody.innerHTML = `
      <tr><td colspan="6">No bookings found.</td></tr>`;
    return;
  }

  const now = new Date();

  userBookings.forEach(booking => {
    const row = document.createElement("tr");

    // ----- Determine if this booking is in the past -----
    // Expecting booking.date as "yyyy-mm-dd"
    let isPast = false;
    try {
      const hourStr = String(booking.hour).padStart(2, "0");
      const bookingDateTime = new Date(`${booking.date}T${hourStr}:00`);
      isPast = bookingDateTime < now;
    } catch (e) {
      console.warn("Could not parse booking date/time:", booking);
    }

    // ----- Normalize status -----
    const rawStatus = booking.status || "";
    const statusLower = rawStatus.toLowerCase();

    const isDeclined =
      statusLower === "declined" || statusLower === "rejected";

    const isCancelled = statusLower === "cancelled";

    // Show "Past" status for old bookings that are not declined or cancelled
    let displayStatus = rawStatus;
    if (isPast && !isDeclined && !isCancelled) {
      displayStatus = "Past";
    }

    // ----- Decide if we show a Cancel button -----
    let actionCellHtml = "-";

    // Only allow cancel if:
    //  - booking is not in the past
    //  - booking is not declined/rejected
    //  - booking is not already cancelled
    if (!isPast && !isDeclined && !isCancelled) {
      actionCellHtml = `
        <button
          data-id="${booking.id}"
          data-title="${booking.item}"
          data-room="${booking.resource}"
          data-time="${booking.hour}"
          class="cancelBtn"
        >
          Cancel
        </button>
      `;
    }

    row.innerHTML = `
      <td>${booking.resource}</td>
      <td>${booking.item}</td>
      <td>${booking.date}</td>
      <td>${booking.hour}:00</td>
      <td>${displayStatus}</td>
      <td>${actionCellHtml}</td>
    `;

    tableBody.appendChild(row);
  });

  attachCancelHandlers();
}

// ---------------------- CANCEL BOOKING ----------------------
function attachCancelHandlers() {
  const cancelButtons = document.querySelectorAll(".cancelBtn");

  cancelButtons.forEach(btn => {
    btn.addEventListener("click", async () => {
      const bookingId = btn.dataset.id;

      const confirmed = confirm("Are you sure you want to cancel this booking?");
      if (!confirmed) return;

      try {
        const res = await fetch(
          `http://localhost:4000/api/bookings/${bookingId}`,
          {
            method: "DELETE"
          }
        );

        if (!res.ok) {
          const data = await res.json();
          alert("Error: " + data.error);
          return;
        }

        alert("✔ Booking cancelled.");
      } catch (err) {
        console.error(err);
        alert("Server unreachable.");
        return;
      }

      // Update resource availability (optional but you had it)
      try {
        const response = await fetch("/api/resources");
        const resources = await response.json();

        const resourceToCancel = resources.find(
          resource => resource.title === btn.dataset.title
        );
        if (resourceToCancel) {
          const resourceID = resourceToCancel.id;

          await fetch(`http://localhost:4000/api/resources/${resourceID}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              newRoomStatus: "available",
              roomIndex: btn.dataset.room,
              timeIndex: btn.dataset.time
            })
          });
        }
      } catch (err) {
        console.error("Error updating resource availability:", err);
      }

      // Reload table after cancellation & availability update
      loadBookings();
    });
  });
}

// ---------------------- INITIALIZE ----------------------
loadBookings();
