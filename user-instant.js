  // 🔹 Login check
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
    if (!currentUser) {
      alert("⚠️ You must be logged in to book a resource.");
      window.location.href = "login.html";
    }

    // 🔹 Booking type (instant or request)
    const resourceType = "instant"; // change to "request" for equipment

    // type of room or service booked
    const resourceTypeName = document.getElementById("resourceTitle").textContent.trim();


    const messageBox = document.getElementById("message");
    let hasBooked = false; // track if user already booked
    function updateBookedSlots() {
  const selectedDate = new Date(document.getElementById("date").value).toLocaleDateString();
  const allBookings = JSON.parse(localStorage.getItem("bookings")) || [];

  document.querySelectorAll(".available, .booked").forEach(cell => {
    const room = cell.dataset.room;
    const time = cell.dataset.time;

    const match = allBookings.find(
      b => b.resource === room && b.hour === time && b.date === selectedDate
    );

    if (match) {
      cell.classList.remove("available");
      cell.classList.add("booked");
      cell.textContent = "Booked";
    }
  });
}
    document.querySelectorAll(".available").forEach(cell => {
      cell.addEventListener("click", () => {

        if (cell.classList.contains("booked") || cell.textContent === "X") {
        return;
        }
        if (hasBooked) {
          alert("⚠️ You can only book one slot at a time.");
          return;
        }

         const dateInput = document.getElementById("date").value.trim();
        // prompt user to choose a date
         if (!dateInput) {
          alert("⚠️ Please select a date before booking.");
          document.getElementById("date").focus(); // highlight the date box
          return;
        }

        const room = cell.dataset.room;
        const time = cell.dataset.time;
        const rawDate = document.getElementById("date").value.trim();
        const [y, m, d] = rawDate.split("-");
        const date = new Date(y, m - 1, d).toLocaleDateString();



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
        
        let allBookings = JSON.parse(localStorage.getItem("bookings")) || [];

        allBookings.push({
        username: currentUser.username,
        resource: room,   
        item: resourceTypeName,   
        date: date,
        hour: time,
        status: (resourceType === "instant") ? "Booked" : "Pending"
        });

        localStorage.setItem("bookings", JSON.stringify(allBookings));

        hasBooked = true; // prevent further bookings
      });

    });

window.onload = updateBookedSlots;
    
//automatically choose date
let ele = document.getElementById("date");
var today = new Date();
var d = String(today.getDate()).padStart(2, '0');
var m = String(today.getMonth() + 1).padStart(2, '0');
var y = today.getFullYear();
ele.value = y + "-" + m + "-" + d;