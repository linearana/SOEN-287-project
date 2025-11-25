document.addEventListener("DOMContentLoaded", () => {
  messageBox = document.getElementById("message");
  let hasBooked = false; // prevent multiple bookings

  // Attach click handlers to all available slots
  document.querySelectorAll(".available").forEach(cell => {
    cell.addEventListener("click", () => {
      //Check login state
      const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
      if (!currentUser) {
        alert("⚠️ You must be logged in to book a resource.");
        window.location.href = "login.html";
        return;
      }

      // Prevent multiple bookings
      if (hasBooked) {
        alert("⚠️ You can only book one slot at a time.");
        return;
      }

      // Booking details
      const room = cell.dataset.room;
      const time = cell.dataset.time;
      const date = document.getElementById("date").value || "selected date";

      // Mark as booked (or pending if you want request mode)
      cell.classList.remove("available");
      cell.classList.add("booked");
      cell.textContent = "Booked";

      messageBox.textContent = `✅ Booking confirmed for ${room} at ${time}:00 on ${date}`;

      hasBooked = true;
    });
  });
});