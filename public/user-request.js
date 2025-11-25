const urlParams = new URLSearchParams(window.location.search);
const resourceID = urlParams.get("id");

const messageBox = document.getElementById("message");
const resourceTypeName = document.getElementById("resourceTitle").textContent.trim();

let bookingInProgress = false;

// ---------------------- UPDATE BOOKED/PENDING SLOTS ----------------------
async function updateBookedSlots() {
  const selectedDate = document.getElementById("date").value; // ISO format yyyy-mm-dd

  let bookings = [];
  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    bookings = await res.json();
  } catch {
    console.warn("Server offline, cannot load bookings.");
    return;
  }

  document.querySelectorAll("td[data-room]").forEach(cell => {
    const room = cell.dataset.room;
    const time = cell.dataset.time;

    const match = bookings.find(
      b =>
        b.resource === room &&
        String(b.hour) === String(time) &&
        b.date === selectedDate
    );

    if (match) {
      cell.classList.remove("available");
      cell.classList.add(match.status); // "booked" or "pending"
      cell.textContent = match.status;
    } else {
      if (cell.textContent !== "X") {
        cell.classList.remove("booked", "pending");
        cell.classList.add("available");
        cell.textContent = "available";
      }
    }
  });
}

// ---------------------- EVENT DELEGATION FOR CLICK ----------------------
document.getElementById("tableBody").addEventListener("click", async (e) => {
  const cell = e.target.closest("td[data-room]");
  if (!cell) return;

  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
  if (!currentUser) {
    alert("⚠️ You must be logged in.");
    window.location.href = "login.html";
    return;
  }

  if (["booked", "unavailable", "pending"].includes(cell.textContent)) return;

  const dateInput = document.getElementById("date").value.trim();
  if (!dateInput) {
    alert("⚠️ Select a date first.");
    return;
  }

  // enforce 7-day minimum
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + 7);

  const selectedDate = new Date(dateInput);
  if (selectedDate < minDate) {
    alert("⚠️ You can only book at least 7 days in advance.");
    return;
  }

  const room = cell.dataset.room;
  const time = cell.dataset.time;

  if (bookingInProgress) {
    alert("⚠️ You already made a booking.");
    return;
  }

  let bookings = [];
  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    bookings = await res.json();
  } catch (err) {
    console.warn("SERVER OFFLINE → cannot validate existing bookings.");
  }

  const existingBooking = bookings.find(
    b =>
      b.username === currentUser.email &&
      b.item === resourceTypeName &&
      b.date === dateInput &&
      (b.status === "booked" || b.status === "pending")
  );

  if (existingBooking) {
    alert("⚠️ You already booked this resource type for that day.");
    return;
  }

  // ---------------------- MATCH BOOKINGS.JSON STRUCTURE ----------------------
  const booking = {
    id: Date.now(),
    username: currentUser.email,
    resource: room,              // room name
    item: resourceTypeName,      // resource type
    date: dateInput,             // ISO yyyy-mm-dd
    hour: String(time),          // string hour
    status: "pending"            // always pending → admin approval
  };

  bookingInProgress = true;

  try {
    const res = await fetch("http://localhost:4000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking)
    });

    if (!res.ok) {
      const data = await res.json();
      alert("Error: " + data.error);
      bookingInProgress = false;
      return;
    }
  } catch {
    alert("⚠️ Cannot contact server.");
    return;
  }

  cell.classList.remove("available");
  cell.classList.add("pending");
  cell.textContent = "pending";

  messageBox.textContent = `📩 Request sent for ${room} at ${time}:00 on ${dateInput}`;
  updateBookedSlots();
});

// ---------------------- AUTO-CHOOSE DATE ----------------------
window.onload = () => {
  const ele = document.getElementById("date");
  const today = new Date();
  today.setDate(today.getDate() + 7); // enforce 7 days ahead

  const minDate = today.toISOString().split("T")[0];
  ele.value = minDate;
  ele.min = minDate; // prevent selecting earlier dates

  updateBookedSlots();
};

document.getElementById("date").addEventListener("change", updateBookedSlots);
