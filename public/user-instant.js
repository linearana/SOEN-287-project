//get resource ID
urlParams = new URLSearchParams(window.location.search);
resourceID = urlParams.get("id");

messageBox = document.getElementById("message");
const resourceTypeName = document.getElementById("resourceTitle").textContent.trim();

// ---------------------- LOAD BOOKED SLOTS ----------------------
async function updateBookedSlots() {
  const dateInput = document.getElementById("date").value;

  if (!dateInput) return; // no date selected yet

  let bookings = [];
  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    bookings = await res.json();
  } catch (err) {
    console.warn("SERVER OFFLINE → cannot load bookings.");
    return;
  }

  document.querySelectorAll("td[data-room]").forEach(cell => {
    const room = cell.dataset.room;
    const time = cell.dataset.time;

    const match = bookings.find(
      b => b.resource === room && String(b.hour) === String(time) && b.date === dateInput
    );

    if (match) {
      cell.classList.remove("available");
      cell.classList.add("booked");
      cell.textContent = "booked";
    } else if (cell.textContent !== "unavailable") {
      cell.classList.remove("booked");
      cell.classList.add("available");
      cell.textContent = "available";
    }
  });
}

// ---------------------- BOOK SLOT ----------------------
document.querySelectorAll("td[data-room]").forEach(cell => {
  cell.addEventListener("click", async () => {
    // login check
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
    if (!currentUser) {
      alert("You must be logged in.");
      window.location.href = "login.html";
      return;
    }

    const dateInput = document.getElementById("date").value.trim();
    if (!dateInput) {
      alert("⚠️ Select a date first.");
      return;
    }

    const [y, m, d] = dateInput.split("-");
    const datePretty = new Date(y, m - 1, d).toLocaleDateString();
    const room = cell.dataset.room;
    const time = cell.dataset.time;

    console.log("Clicked:", room, time);

    // cannot book unavailable cells or booked ones
    if (cell.textContent === "unavailable" || cell.textContent === "booked") return;

    let bookings = [];
    try {
      const res = await fetch("http://localhost:4000/api/bookings");
      bookings = await res.json();
    } catch (err) {
      console.warn("SERVER OFFLINE → cannot validate existing bookings.");
    }

    // this is just a friendly pre-check; backend still enforces the rule
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

    const booking = {
      id: Date.now(),
      username: currentUser.email,
      resource: room,
      item: resourceTypeName,
      date: dateInput, // yyyy-mm-dd (matches server)
      hour: time,
      status: "booked" // backend will override to "Booked" if Instant
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
    } catch (err) {
      alert("Server unreachable.");
      return;
    }

    // UI update
    cell.classList.add("booked");
    cell.classList.remove("available");
    cell.textContent = "booked";

    // update resource availability (your existing PATCH)
    await fetch(`http://localhost:4000/api/resources/${resourceID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        newRoomStatus: "booked",
        roomIndex: room,
        timeIndex: time
      })
    });

    messageBox.textContent =
      `✔ Booking confirmed: ${room} at ${time}:00 on ${datePretty}`;

    updateBookedSlots();
  });
});

// ---------------------- DATE HANDLING ----------------------
window.onload = () => {
  let ele = document.getElementById("date");
  const today = new Date();
  const d = String(today.getDate()).padStart(2, "0");
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const y = today.getFullYear();
  const todayStr = `${y}-${m}-${d}`;

  // user can't book in the past for instant bookings
  ele.min = todayStr;

  // if no date chosen yet, default to today
  if (!ele.value) {
    ele.value = todayStr;
  }

  updateBookedSlots();
};

document.getElementById("date").addEventListener("change", updateBookedSlots);
