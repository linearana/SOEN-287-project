// 🔹 Login check
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    alert("⚠️ You must be logged in to book a resource.");
    window.location.href = "login.html";
  }

  // 🔹 Booking type (instant or request)
  const resourceType = "instant"; // change to "request" for equipment

  const messageBox = document.getElementById("message");
  
  document.querySelectorAll("td").forEach(cell => {
  const updates = [];
  cell.addEventListener("click", () => {
    const room = cell.dataset.room;
    const time = cell.dataset.time;
    const date = document.getElementById("date").value || "selected date";
    let action = "";

    if (cell.classList.contains("available")) {
      cell.classList.remove("available");
      cell.classList.add("unavailable");
      cell.textContent = "Unavailable";
      action = "made unavailable";
      messageBox.innerHTML += `✅ Availability removed for ${room} at ${time}:00 on ${date} <br>`;
    } 
    else if (cell.classList.contains("booked")) {
      cell.classList.remove("booked");
      cell.classList.add("unavailable");
      cell.textContent = "Unavailable";
      action = "booking cancelled";
      messageBox.innerHTML += `✅ Availability removed for ${room} at ${time}:00 on ${date}, user will be notified of cancellation. <br>`;
    } 
    else {
      cell.classList.remove("unavailable");
      cell.classList.add("available");
      cell.textContent = "Available";
      action = "restored availability";
      messageBox.innerHTML += `🔁 Availability restored for ${room} at ${time}:00 on ${date} <br>`;
    }
    updates.push({ room, time, date, action });
  });
});

// to modify
function confirmChanges() {
  if (messageBox.innerHTML === "") {
    alert("No changes to confirm.");
    return;
  }
  if (confirm("Apply all changes?")) {
    messageBox.innerHTML = "";
  }
}

  // Disable resource function
  function disableResource(button) {
    if (confirm("Are you sure you want to disable this resource?")) {
      const card = button.closest(".card");
      card.classList.add("disabled");
      alert("⚠️ This resource has been disabled and is no longer available for booking.");
    }
  }