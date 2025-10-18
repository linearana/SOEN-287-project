// Parse resource and type from URL
const params = new URLSearchParams(window.location.search);
const resource = params.get("resource");
const bookingType = params.get("type"); // "instant" or "request"

// Handle submit
document.getElementById("submitBtn").addEventListener("click", () => {
  const selected = document.querySelectorAll(".slot.selected");
  const bookings = [];

  selected.forEach(slot => {
    bookings.push({
      resource: resource,
      item: slot.dataset.item,
      hour: slot.dataset.hour,
      status: bookingType === "instant" ? "confirmed" : "pending"
    });

    // Update UI
    slot.classList.remove("selected");
    if (bookingType === "instant") {
      slot.classList.add("booked");
      slot.textContent = "Booked";
    } else {
      slot.classList.add("pending");
      slot.textContent = "Pending Approval";
    }
  });

  // Save to localStorage
  let saved = JSON.parse(localStorage.getItem("bookings")) || [];
  saved = saved.concat(bookings);
  localStorage.setItem("bookings", JSON.stringify(saved));

  if (bookingType === "instant") {
    alert("✅ Your booking has been confirmed!");
  } else {
    alert("📩 Your request has been sent to the admin for approval.");
  }
});