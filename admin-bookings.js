// Load bookings (backend → fallback to localStorage)
async function loadBookings() {
  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    console.warn("Backend offline → using localStorage");
    return JSON.parse(localStorage.getItem("bookings")) || [];
  }
}

// Save after admin performs actions
async function saveBookings(bookings) {
  try {
    await fetch("http://localhost:4000/api/bookings/overwrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookings)
    });
  } catch {
    console.warn("Backend offline → saving locally");
    localStorage.setItem("bookings", JSON.stringify(bookings));
  }
}

async function renderAdminBookings() {
  const body = document.getElementById("adminBookingsBody");
  let bookings = await loadBookings();

  body.innerHTML = "";

  bookings.forEach((b, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${b.username}</td>
      <td>${b.resource}</td>
      <td>${b.item}</td>
      <td>${b.date}</td>
      <td>${b.hour}:00</td>
      <td class="${b.status}">${b.status}</td>
      <td>
        ${
          b.status === "Pending"
            ? `
              <button class="approveBtn" data-index="${index}">Approve</button>
              <button class="declineBtn" data-index="${index}">Decline</button>
            `
            : "-"
        }
      </td>
    `;

    body.appendChild(row);
  });

  // Bind all approve buttons
  document.querySelectorAll(".approveBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      let i = btn.dataset.index;
      bookings[i].status = "Booked";
      await saveBookings(bookings);
      renderAdminBookings();
    });
  });

  // Bind all decline buttons
  document.querySelectorAll(".declineBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      let i = btn.dataset.index;
      bookings.splice(i, 1); // remove booking
      await saveBookings(bookings);
      renderAdminBookings();
    });
  });
}

renderAdminBookings();
