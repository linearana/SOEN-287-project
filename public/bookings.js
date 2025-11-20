// Login check
const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
if (!currentUser) location.href = "login.html";

// DOM elements
const bookingsBody = document.getElementById("bookingsBody");

// Load from backend OR localStorage fallback
async function loadBookings() {
  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    return await res.json();
  } catch {
    return JSON.parse(localStorage.getItem("bookings") || "[]");
  }
}

async function renderBookings() {
  const allBookings = await loadBookings();

  const userBookings = allBookings.filter(
    b => b.userEmail === currentUser.email
  );

  bookingsBody.innerHTML = "";

  if (userBookings.length === 0) {
    bookingsBody.innerHTML = `
      <tr><td colspan="6">No bookings yet.</td></tr>
    `;
    return;
  }

  userBookings.forEach(b => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${b.resource}</td>
      <td>${b.item}</td>
      <td>${b.date}</td>
      <td>${b.hour}:00</td>
      <td>${b.status}</td>
      <td><button class="cancelBtn" data-id="${b.id}">Cancel</button></td>
    `;

    bookingsBody.appendChild(row);
  });

  // cancel buttons
  document.querySelectorAll(".cancelBtn").forEach(btn => {
    btn.onclick = async () => {
      let bookings = await loadBookings();
      bookings = bookings.filter(b => b.id != btn.dataset.id);

      try {
        await fetch("http://localhost:4000/api/bookings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookings)
        });
      } catch {
        localStorage.setItem("bookings", JSON.stringify(bookings));
      }

      renderBookings();
    };
  });
}

renderBookings();
