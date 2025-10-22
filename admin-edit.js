  // 🔹 Login check
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
      alert("⚠️ You must be logged in to book a resource.");
      window.location.href = "login.html";
    }

    // 🔹 Booking type (instant or request)
    const resourceType = "instant"; // change to "request" for equipment

    const messageBox = document.getElementById("message");
    let hasBooked = false; // track if user already booked

    document.querySelectorAll(".available").forEach(cell => {
      cell.addEventListener("click", () => {
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
          cell.textContent = "Unavailable";
          messageBox.textContent = `✅ Availability removed for ${room} at ${time}:00 on ${date}`;
        } else {
          cell.classList.remove("available");
          cell.classList.add("booked");
          cell.textContent = "Pending";
          messageBox.textContent = `📩 Request submitted for ${room} at ${time}:00 on ${date} (awaiting admin approval)`;
        }
      })
    });

    // Disable resource function
    function disableResource(button) {
      if (confirm("Are you sure you want to disable this resource?")) {
        const card = button.closest(".card");
        card.classList.add("disabled");
        alert("⚠️ This resource has been disabled and is no longer available for booking.");
      }
    }