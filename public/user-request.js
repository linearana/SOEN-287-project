// ---------------------- GET RESOURCE ID ----------------------
const urlParams = new URLSearchParams(window.location.search);
const resourceID = urlParams.get("id");

const messageBox = document.getElementById("message");
const resourceTypeName = document.getElementById("resourceTitle").textContent.trim();

// ---------------------- UPDATE BOOKED / PENDING / UNAVAILABLE SLOTS ----------------------
async function updateBookedSlots() {
  const selectedDate = document.getElementById("date").value; // ISO yyyy-mm-dd
  if (!selectedDate) return;

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
      // Normalize status for CSS: "Booked" -> "booked", etc.
      const statusClass = match.status.toLowerCase(); // booked / pending / unavailable

      cell.classList.remove("available", "booked", "pending", "unavailable");
      cell.classList.add(statusClass);
      cell.textContent = statusClass; // keep lower-case labels in the table
    } else {
      if (cell.textContent !== "X") {
        cell.classList.remove("booked", "pending", "unavailable");
        cell.classList.add("available");
        cell.textContent = "available";
      }
    }
  });
}

// ---------------------- CLICK HANDLER (SEND REQUEST) ----------------------
document.getElementById("tableBody").addEventListener("click", async (e) => {
  const cell = e.target.closest("td[data-room]");
  if (!cell) return;

  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
  if (!currentUser) {
    alert("⚠️ You must be logged in.");
    window.location.href = "login.html";
    return;
  }

  // if slot is already not bookable, do nothing
  if (["booked", "unavailable", "pending"].includes(cell.textContent)) return;

  const dateInput = document.getElementById("date").value.trim();
  if (!dateInput) {
    alert("⚠️ Select a date first.");
    return;
  }

  // 🔹 Enforce 7-day minimum in advance
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + 7);

  const selectedDateObj = new Date(dateInput);
  if (selectedDateObj < minDate) {
    alert("⚠️ You can only book at least 7 days in advance.");
    return;
  }

  const room = cell.dataset.room;
  const time = cell.dataset.time;

  // ---------------------- CHECK EXISTING BOOKINGS (same user + item + date) ----------------------
  let bookings = [];
  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    bookings = await res.json();
  } catch (err) {
    console.warn("SERVER OFFLINE → cannot validate existing bookings.");
  }

  // Backend uses "Booked" / "Pending" (capitalized)
  const existingBooking = bookings.find(
    b =>
      b.username === currentUser.email &&
      b.item === resourceTypeName &&
      b.date === dateInput &&
      (b.status === "Booked" || b.status === "Pending")
  );

  if (existingBooking) {
    alert("⚠️ You already booked this resource type for that day.");
    return;
  }

  // ---------------------- CREATE BOOKING OBJECT ----------------------
  const booking = {
    id: Date.now(),
    username: currentUser.email,
    resource: room,              // specific room
    item: resourceTypeName,      // resource type (Art Studios, Engineering Labs...)
    date: dateInput,             // ISO yyyy-mm-dd
    hour: String(time),
    // Backend will set status based on bookingType, but we can be explicit:
    status: "Pending"
  };

  try {
    const res = await fetch("http://localhost:4000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking)
    });

    if (!res.ok) {
      const data = await res.json();
      alert("Error: " + data.error);
      return;
    }
  } catch {
    alert("⚠️ Cannot contact server.");
    return;
  }

  // Update clicked cell visually
  cell.classList.remove("available");
  cell.classList.add("pending");
  cell.textContent = "pending";

  messageBox.textContent =
    `📩 Request sent for ${room} at ${time}:00 on ${dateInput}`;

  updateBookedSlots();
});

// ---------------------- DATE DEFAULT (7 DAYS AHEAD) ----------------------
window.onload = () => {
  const ele = document.getElementById("date");
  const today = new Date();
  today.setDate(today.getDate() + 7); // enforce 7 days ahead for initial value

  const minDate = today.toISOString().split("T")[0];
  ele.value = minDate;
  ele.min = minDate; // prevent selecting earlier dates in the picker

  updateBookedSlots();
};

document.getElementById("date").addEventListener("change", updateBookedSlots);
