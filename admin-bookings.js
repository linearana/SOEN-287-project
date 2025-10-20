const logoutBtn = document.getElementById("logoutBtn");
const adminBookingsBody = document.getElementById("adminBookingsBody");

// Hard-coded sample bookings (instead of backend)
let bookings = [
  { username: "student1", resource: "Study Rooms", item: "LB 251 – Canada", date: "2025-10-26", hour: "10", status: "confirmed" },
  { username: "student2", resource: "Engineering Labs", item: "EV 101 – Circuits Lab", date: "2025-10-27", hour: "14", status: "pending" },
  { username: "student3", resource: "Art Studio", item: "FA 301 – Painting Studio", date: "2025-10-28", hour: "12", status: "pending" },
  { username: "student4", resource: "Film Equipment", item: "Camera Kit A", date: "2025-10-29", hour: "09", status: "rejected" }
];

// Render bookings
function renderBookings() {
  adminBookingsBody.innerHTML = "";

  bookings.forEach((b, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${b.username}</td>
      <td>${b.resource}</td>
      <td>${b.item}</td>
      <td>${b.date}</td>
      <td>${b.hour}:00</td>
      <td class="${b.status}">${b.status}</td>
      <td></td>
    `;

    const actionsCell = row.querySelector("td:last-child");

    if (b.status === "pending") {
      const approveBtn = document.createElement("button");
      approveBtn.textContent = "Approve";
      approveBtn.onclick = () => {
        bookings[index].status = "confirmed";
        renderBookings();
      };

      const rejectBtn = document.createElement("button");
      rejectBtn.textContent = "Reject";
      rejectBtn.onclick = () => {
        bookings[index].status = "rejected";
        renderBookings();
      };

      actionsCell.appendChild(approveBtn);
      actionsCell.appendChild(rejectBtn);
    } else {
      actionsCell.textContent = "-";
    }

    adminBookingsBody.appendChild(row);
  });
}

renderBookings();

// Logout
logoutBtn.addEventListener("click", (e) => {
  e.preventDefault();
  alert("Logged out (demo only)");
  window.location.href = "home.html";
});