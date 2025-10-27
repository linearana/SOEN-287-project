// 🔹 Login check
const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
if (!currentUser) {
  alert("⚠️ You must be logged in to book a resource.");
  window.location.href = "login.html";
}

// 🔹 Booking type (instant or request)
const resourceType = "request";

 // type of room or service booked
  const resourceTypeName = document.getElementById("resourceTitle").textContent.trim();

const messageBox = document.getElementById("message");
let hasBooked = false; // track if user already booked

document.querySelectorAll(".available").forEach(cell => {
  cell.addEventListener("click", () => {

    if (hasBooked) {
      alert("⚠️ You can only book one slot at a time.");
      return;
    }

    // prevent clicking booked / pending slots
     if (cell.classList.contains("booked") || cell.classList.contains("pending")) {
      return;
    }
    const rawDate = document.getElementById("date").value.trim();
    if (!rawDate) {
      alert("⚠️ Please select a date before booking.");
      document.getElementById("date").focus();
      return;
    }

    const formattedDate = new Date(rawDate).toLocaleDateString();
    const room = cell.dataset.room;
    const time = cell.dataset.time;

   
    cell.classList.remove("available");
    cell.classList.add("booked");
    cell.textContent = resourceType === "instant" ? "Booked" : "Pending";

    if (resourceType === "instant") {
      messageBox.textContent = `✅ Booking confirmed for ${room} at ${time}:00 on ${formattedDate}`;
    } else {
      messageBox.textContent = `📩 Request submitted for ${room} at ${time}:00 on ${formattedDate} (awaiting admin approval)`;
    }

    
    let allBookings = JSON.parse(localStorage.getItem("bookings")) || [];

    allBookings.push({
      username: currentUser.username,
      resource: room,
      hour: time,
      item: resourceTypeName,
      date: formattedDate,
      status: resourceType === "instant" ? "Booked" : "Pending"
    });

    localStorage.setItem("bookings", JSON.stringify(allBookings));

    hasBooked = true;
  });
});


// Runs on page load + date change
function updateBookedSlots() {
  const dateValue = document.getElementById("date").value;
  if (!dateValue) return;

  const selectedDate = new Date(dateValue).toLocaleDateString();
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
      cell.classList.remove("available", "booked", "pending");

      if (match.status === "Pending") {
        cell.classList.add("pending");
        cell.textContent = "Pending";
      } else {
        cell.classList.add("booked");
        cell.textContent = "Booked"; // or "X" for privacy
      }

      cell.style.cursor = "not-allowed";
    }
  });
}

window.onload = updateBookedSlots;

//automatically choose date
let ele = document.getElementById("date");
var today = new Date();
var d = String(today.getDate()).padStart(2, '0');
var m = String(today.getMonth() + 1).padStart(2, '0');
var y = today.getFullYear();
ele.value = y + "-" + m + "-" + d;
