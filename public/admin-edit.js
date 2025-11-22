// Login check
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
  if (!currentUser) {
    alert("⚠️ You must be logged in to book a resource.");
    window.location.href = "login.html";
  }

  const messageBox = document.getElementById("message");
  
  document.getElementById("tableBody").addEventListener("click", (e) => {
    const cell = e.target;

    if (!cell.dataset.room || !cell.dataset.time) return;

    const updates = [];
    const room = cell.dataset.room;
    const time = cell.dataset.time;
    const date = document.getElementById("date").value || "selected date";
    
    let action = "";

    if (cell.classList.contains("available")) {
      cell.classList.remove("available");
      cell.classList.add("unavailable");
      cell.textContent = "unavailable";
      action = "made unavailable";
      messageBox.innerHTML += `✅ Availability removed for ${room} at ${time}:00 on ${date} <br>`;
    } 
    else if (cell.classList.contains("booked")) {
      cell.classList.remove("booked");
      cell.classList.add("unavailable");
      cell.textContent = "unavailable";
      action = "booking cancelled";
      messageBox.innerHTML += `✅ Availability removed for ${room} at ${time}:00 on ${date}, user will be notified of cancellation. <br>`;
    } 
    else {
      cell.classList.remove("unavailable");
      cell.classList.add("available");
      cell.textContent = "available";
      action = "restored availability";
      messageBox.innerHTML += `🔁 Availability restored for ${room} at ${time}:00 on ${date} <br>`;
    }
    updates.push({ room, time, date, action });
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
async function disableResource(button) {
  const card = button.closest(".card");
  const resourceId = card.dataset.id;
  if (button.textContent === "Disable") {
    if (confirm("Are you sure you want to disable this resource?")) {
      await fetch(`http://localhost:4000/api/resources/${resourceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "disabled" })
      });

      card.classList.add("disabled");
      button.textContent = "Enable"

      alert("⚠️ This resource has been disabled and is no longer available for booking.");
    }
  }
  else {
    if (confirm("Are you sure you want to enable this resource?")) {
      
      await fetch(`/api/resources/${resourceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "enabled" })
      });

      card.classList.remove("disabled");
      button.textContent = "Disable"
      alert("⚠️ This resource has been enabled and is now available for booking.");
    }
  }
}

//automatically choose date
let ele = document.getElementById("date");
var today = new Date();
var d = String(today.getDate()).padStart(2, '0');
var m = String(today.getMonth() + 1).padStart(2, '0');
var y = today.getFullYear();
ele.value = y + "-" + m + "-" + d;