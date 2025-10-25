
  const messageBox = document.getElementById("message");
  let hasBooked = false; // track if user already booked


  function updateBookedSlots() {
  const selectedDate = new Date(document.getElementById("date").value).toLocaleDateString();
  const allBookings = JSON.parse(localStorage.getItem("bookings")) || [];

  document.querySelectorAll("td").forEach(cell => {
    const room = cell.dataset.room;
    const time = cell.dataset.time;

    const match = allBookings.find(b =>
      b.resource === room &&
      b.hour === time &&
      b.date === selectedDate
    );

    if (match) {
      cell.classList.remove("available");
      cell.classList.add("booked");
      cell.textContent = "X";
      cell.style.cursor = "not-allowed";
    }
  });
}

window.onload = updateBookedSlots;

  // Booking type: "instant" or "request"
  const resourceType = "instant"; 

  document.querySelectorAll(".available").forEach(cell => {
    cell.addEventListener("click", () => {

      if (cell.classList.contains("booked") || cell.textContent === "X") {
      return;
      }
      // Always check login at the moment of click
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (!currentUser) {
        alert("⚠️ You must be logged in to book a resource.");
        window.location.href = "login.html";
        return;
      }

      if (hasBooked) {
        alert("⚠️ You can only book one slot at a time.");
        return;
      }

      const room = cell.dataset.room;
      const time = cell.dataset.time;
      const date = document.getElementById("date").value || "selected date";

      if (resourceType === "instant") {
        cell.classList.remove("available");
        cell.classList.add("booked");
        cell.textContent = "Booked";
        messageBox.textContent = `✅ Booking confirmed for ${room} at ${time}:00 on ${date}`;
      } else {
        cell.classList.remove("available");
        cell.classList.add("booked");
        cell.textContent = "Pending";
        messageBox.textContent = `📩 Request submitted for ${room} at ${time}:00 on ${date} (awaiting admin approval)`;
      }

      hasBooked = true;
    });
  });