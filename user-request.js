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
    // fallback to localStorage
    let all = JSON.parse(localStorage.getItem("bookings")) || [];
    all.push(booking);
    localStorage.setItem("bookings", JSON.stringify(all));
    return true;
  }
}


// login check
const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
if (!currentUser) {
  alert("⚠️ You must be logged in to book a resource.");
  window.location.href = "login.html";
}


const resourceType = "request";
const resourceTypeName = document.getElementById("resourceTitle").textContent.trim();
const messageBox = document.getElementById("message");
let hasBooked = false;


async function updateBookedSlots() {
  const selectedDate = document.getElementById("date").value; // YYYY-MM-DD

  //  RESET ALL SLOTS
  document.querySelectorAll("td[data-room]").forEach(cell => {
    if (cell.textContent !== "X") {
      cell.classList.remove("booked", "pending");
      cell.classList.add("available");
      cell.style.backgroundColor = "";
      cell.style.color = "";
      cell.textContent = "Available";
    }
  });

  //  LOAD BOOKINGS (backend → fallback)
  let allBookings;
  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    if (!res.ok) throw new Error();
    allBookings = await res.json();
  } catch (err) {
    allBookings = JSON.parse(localStorage.getItem("bookings")) || [];
  }

  // APPLY BOOKINGS FOR SELECTED DATE
  document.querySelectorAll("td[data-room]").forEach(cell => {
    const room = cell.dataset.room;
    const time = cell.dataset.time;

    const match = allBookings.find(
      b =>
        b.resource === room &&
        b.hour === time &&
        b.date === selectedDate
    );

    if (match) {
      cell.classList.remove("available");
      cell.classList.add(match.status.toLowerCase());

      if (match.status === "Pending") {
        cell.textContent = "Pending";
        cell.style.backgroundColor = "gold";
        cell.style.color = "black";
      }

      if (match.status === "Booked") {
        cell.textContent = "Booked";
        cell.style.backgroundColor = "red";
        cell.style.color = "black";
      }
    }
  });
}



document.querySelectorAll("td[data-room]").forEach(cell => {
  cell.addEventListener("click", async () => {

    // prevent clicking unavailable or already booked/pending slots
    if (
      cell.classList.contains("booked") ||
      cell.classList.contains("pending") ||
      cell.textContent === "X"
    ) return;

    const dateInput = document.getElementById("date").value.trim();
    if (!dateInput) {
      alert("⚠️ Please select a date before booking.");
      document.getElementById("date").focus();
      return;
    }

    const room = cell.dataset.room;
    const time = cell.dataset.time;

    // keep date in YYYY-MM-DD format
    const date = dateInput;

    const booking = {
      username: currentUser.username,
      resource: room,
      item: resourceTypeName,
      date: date,
      hour: time,
      status: "Pending"
    };

    await saveBookingToServer(booking);

    // Instant UI update
    cell.classList.remove("available");
    cell.classList.add("pending");
    cell.style.backgroundColor = "gold";
    cell.style.color = "black";
    cell.textContent = "Pending";

    messageBox.textContent =
      `📩 Request submitted for ${room} at ${time}:00 on ${date}`;

    updateBookedSlots();
  });
});


window.onload = () => {
  const ele = document.getElementById("date");

  const today = new Date();
  const d = String(today.getDate()).padStart(2, '0');
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const y = today.getFullYear();

  ele.value = `${y}-${m}-${d}`; // YYYY-MM-DD

  updateBookedSlots();
};
