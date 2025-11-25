const bookingsBody = document.getElementById("adminBookingsBody");

async function loadBookings() {
  let bookings = [];

  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    bookings = await res.json();
  } catch {
    alert("⚠️ Cannot load bookings from server.");
    return;
  }

  bookingsBody.innerHTML = "";
  console.log(bookings);
  bookings.forEach(b => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${b.username}</td>
      <td>${b.resource}</td>
      <td>${b.item}</td>
      <td>${b.date}</td>
      <td>${b.hour}:00</td>
      <td>${b.status}</td>
      <td>
        ${
          b.status === "pending"
            ? `
              <button onclick="updateBooking(${b.id}, 'Booked')">Approve</button>
              <button onclick="updateBooking(${b.id}, 'Declined')">Decline</button>
            `
            : "-"
        }
      </td>
    `;

    bookingsBody.appendChild(row);
  });
}

async function updateBooking(id, newStatus) {
  try {
    const res = await fetch("http://localhost:4000/api/bookings/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus })
    });

    if (!res.ok) {
      const data = await res.json();
      alert("❌ " + data.error);
      return;
    }

    loadBookings();
  } catch {
    alert("⚠️ Server error updating booking.");
  }
}

window.onload = loadBookings;
