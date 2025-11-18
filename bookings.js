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

userBookings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
userBookings = userBookings.reverse();

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
      <td><input type="button" value="Cancel" onclick="cancelBooking(this)"></td>
    `;

    bookingsBody.appendChild(row);
  });
}

let deletedBookings = [];
function cancelBooking(button) {
  if(confirm("Are you sure you want to cancel this booking ?")) {
    const row = button.parentElement.parentElement; // td -> tr
    const index = Array.from(bookingsBody.children).indexOf(row);
    
    // Remove from userBookings array and localStorage
    if (index > -1) {
      const bookingToCancel = userBookings[index];
      deletedBookings.push(bookingToCancel);
      localStorage.setItem("deletedBookings", JSON.stringify(deletedBookings));
      userBookings.splice(index, 1);
      
      // Update localStorage
      let allBookings = JSON.parse(localStorage.getItem("bookings")) || [];
      allBookings = allBookings.filter(b => b.username !== currentUser.username || userBookings.includes(b));
      localStorage.setItem("bookings", JSON.stringify(allBookings));
      row.remove();
      document.getElementById("cancelBookingMessage").innerHTML = `✅ Booking for ${bookingToCancel.resource} on ${bookingToCancel.date} at ${bookingToCancel.hour}:00 has been cancelled.`;
    }
  }
}

renderBookings();