/******************************
 * SAVE BOOKING (backend → fallback)
 ******************************/
async function saveBookingToServer(booking) {
  try {
    const res = await fetch("http://localhost:4000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking)
    });

    if (!res.ok) throw new Error();
    return true;

  } catch (err) {
    console.warn("Backend offline. Saving to localStorage.");
    let all = JSON.parse(localStorage.getItem("bookings")) || [];
    all.push(booking);
    localStorage.setItem("bookings", JSON.stringify(all));
    return true;
  }
}


/******************************
 * LOGIN CHECK
 ******************************/
const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
if (!currentUser) {
  alert("⚠️ You must be logged in to book a resource.");
  window.location.href = "login.html";
}


/******************************
 * CONSTANTS
 ******************************/
const resourceType = "instant";
const resourceTypeName = document.getElementById("resourceTitle").textContent.trim();
const messageBox = document.getElementById("message");
let hasBooked = false;


async function updateBookedSlots() {
  document.querySelectorAll("td[data-room]").forEach(cell => {
  if (cell.textContent !== "X") {
    cell.classList.remove("booked");
    cell.classList.add("available");
    cell.style.backgroundColor = "";
    cell.style.color = "";
    cell.textContent = "Available";
  }
});
  const selectedDate = document.getElementById("date").value;  // YYYY-MM-DD

  let allBookings;
  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    if (!res.ok) throw new Error();
    allBookings = await res.json();
  } catch (err) {
    console.warn("Backend offline — using localStorage");
    allBookings = JSON.parse(localStorage.getItem("bookings")) || [];
  }

  document.querySelectorAll("td[data-room]").forEach(cell => {
    const room = cell.dataset.room;
    const time = cell.dataset.time;

    const match = allBookings.find(
      b => b.resource === room &&
           b.hour === time &&
           b.date === selectedDate   // MATCH YYYY-MM-DD
    );

    // Mark as booked visually
    if (match) {
      cell.classList.remove("available");
      cell.classList.add("booked");
      cell.style.backgroundColor = "red";
      cell.style.color = "black";
      cell.textContent = "Booked";
    }
  });
}


document.querySelectorAll("td[data-room]").forEach(cell => {
  cell.addEventListener("click", async () => {

    // Prevent illegal clicks
    if (cell.classList.contains("booked") || cell.textContent === "X") return;

    if (hasBooked) {
      alert("⚠️ You can only book one slot at a time.");
      return;
    }

    const dateInput = document.getElementById("date").value;
    if (!dateInput) {
      alert("⚠️ Please select a date before booking.");
      document.getElementById("date").focus();
      return;
    }

    const room = cell.dataset.room;
    const time = cell.dataset.time;

    // KEEP DATE AS YYYY-MM-DD
    const date = dateInput;

    const booking = {
      username: currentUser.username,
      resource: room,
      item: resourceTypeName,
      date: date,       
      hour: time,
      status: "Booked"
    };

    // Save to backend or fallback
    await saveBookingToServer(booking);

    // Instant UI update
    cell.classList.remove("available");
    cell.classList.add("booked");
    cell.style.backgroundColor = "red";
    cell.style.color = "black";
    cell.textContent = "Booked";

    messageBox.textContent =
      `✅ Booking confirmed for ${room} at ${time}:00 on ${date}`;

    hasBooked = true;

    // Refresh everything safely
    updateBookedSlots();
  });
});


// auto set to todays date
window.onload = () => {
  const ele = document.getElementById("date");
  const today = new Date();
  const d = String(today.getDate()).padStart(2, '0');
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const y = today.getFullYear();

  ele.value = `${y}-${m}-${d}`;

  updateBookedSlots();
};
