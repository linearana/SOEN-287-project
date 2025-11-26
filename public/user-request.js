console.log("user-request.js loaded (Request-type booking)");

// ---------------------- BASIC SETUP ----------------------
const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
if (!currentUser) {
  alert("⚠️ You must be logged in.");
  window.location.href = "login.html";
}

const messageBox = document.getElementById("message");
const dateInput = document.getElementById("date");
const resourceTypeName = document
  .getElementById("resourceTitle")
  .textContent
  .trim();

// ---------------------- ENFORCE 7-DAYS-IN-ADVANCE ----------------------
(function enforceMinDateForRequest() {
  if (!dateInput) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDateObj = new Date(today);
  minDateObj.setDate(minDateObj.getDate() + 7); // today + 7 days

  const minISO = minDateObj.toISOString().split("T")[0];
  dateInput.min = minISO;

  // If no date or invalid date selected, default to min
  if (!dateInput.value || dateInput.value < minISO) {
    dateInput.value = minISO;
  }

  console.log("Request resource → min selectable date:", dateInput.min);
})();

// ---------------------- CLICK HANDLER (BOOKING LOGIC) ----------------------
async function handleCellClick(event) {
  const cell = event.target.closest("td[data-room]");
  if (!cell) return;

  // Don't book unavailable/booked/pending cells
  if (
    cell.classList.contains("unavailable") ||
    cell.classList.contains("booked") ||
    cell.classList.contains("pending")
  ) {
    return;
  }

  const rawDate = dateInput.value;
  if (!rawDate) {
    alert("⚠️ Please select a date.");
    return;
  }

  // Enforce min date again in JS (in case browser ignores min)
  if (dateInput.min && rawDate < dateInput.min) {
    alert("⚠️ This resource must be booked at least 7 days in advance.");
    dateInput.value = dateInput.min;
    return;
  }

  const room = cell.dataset.room;
  const time = cell.dataset.time;

  // ---------------------- CHECK EXISTING BOOKINGS (FRONTEND GUARD) ----------------------
  let bookings = [];
  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    bookings = await res.json();
  } catch (err) {
    console.warn("Cannot contact server to verify existing bookings.", err);
    alert("⚠️ Cannot verify existing bookings. Try again later.");
    return;
  }

  const alreadyHasBooking = bookings.some(b =>
    b.username === currentUser.email &&
    b.item === resourceTypeName &&
    b.date === rawDate &&
    ["Booked", "Pending", "booked", "pending"].includes(String(b.status))
  );

  if (alreadyHasBooking) {
    alert("❌ You already have a booking for this resource on that date.");
    return;
  }

  // ---------------------- CREATE BOOKING OBJECT ----------------------
  const booking = {
    id: Date.now(),
    username: currentUser.email,
    resource: room,           // specific room (e.g., "FA 3-546")
    item: resourceTypeName,   // resource type (e.g., "Art Studios")
    date: rawDate,            // ISO "yyyy-mm-dd"
    hour: time                // "12", "13", etc.
    // status will be set by backend (Request → Pending)
  };

  // ---------------------- SEND TO SERVER ----------------------
  try {
    const res = await fetch("http://localhost:4000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking)
    });

    if (!res.ok) {
      const data = await res.json();
      alert("❌ " + (data.error || "Booking failed."));
      return;
    }
  } catch (err) {
    console.error("Booking POST failed:", err);
    alert("⚠️ Cannot contact server.");
    return;
  }

  // ---------------------- UPDATE UI LOCALLY ----------------------
  cell.classList.remove("available");
  cell.classList.add("pending");
  cell.textContent = "Pending";

  if (messageBox) {
    messageBox.textContent =
      `📩 Request sent for ${room} at ${time}:00 on ${rawDate}. ` +
      `You will receive a confirmation once an administrator reviews it.`;
  }

  // Optionally sync with backend state again
  if (typeof updateBookedSlots === "function") {
    updateBookedSlots();
  }
}

// ---------------------- ATTACH LISTENER ----------------------
const tableBody = document.getElementById("tableBody");
if (tableBody) {
  tableBody.addEventListener("click", handleCellClick);
}

