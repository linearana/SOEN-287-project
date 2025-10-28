// Check login state
const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
const logoutBtn = document.getElementById("logoutBtn");

if (!currentUser) {
  window.location.href = "login.html"; // redirect if not logged in
}

const bookingsBody = document.getElementById("bookingsBody");

// Load all bookings
let allBookings = JSON.parse(localStorage.getItem("bookings")) || [];

// Filter only this user's bookings
let userBookings = allBookings.filter(b => b.username === currentUser.username);

// Render bookings
function renderBookings() {
  bookingsBody.innerHTML = "";

  if (userBookings.length === 0) {
    bookingsBody.innerHTML = `<tr><td colspan="5">No bookings yet.</td></tr>`;
    return;
  }

  userBookings.forEach(b => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${b.resource}</td>
      <td>${b.item || "-"}</td>
      <td>${b.date || "-"}</td>
      <td>${b.hour ? b.hour + ":00" : "-"}</td>
      <td class="${b.status}">${b.status}</td>
    `;

    bookingsBody.appendChild(row);
  });
}

renderBookings();
