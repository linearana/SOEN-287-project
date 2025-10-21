  // 🔹 Login check
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
      alert("⚠️ You must be logged in to book a resource.");
      window.location.href = "login.html";
    }

    // 🔹 Booking type (instant or request)
    const resourceType = "instant"; // change to "request" for equipment

    document.querySelectorAll(".available").forEach(cell => {
      cell.addEventListener("click", () => {
        if (hasBooked) {
          alert("⚠️ You can only book one slot at a time.");
          return;
        }

        const room = cell.dataset.room;
        const time = cell.dataset.time;
        const date = document.getElementById("date").value || "selected date";

        (resourceType === "instant") {
          cell.classList.remove("available");
          cell.classList.add("unavailable");
          cell.textContent = "Unavailable";
          messageBox.textContent = `✅ Availability removed for ${room} at ${time}:00 on ${date}`;
      })
    });