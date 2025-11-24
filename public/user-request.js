//get resource ID
urlParams = new URLSearchParams(window.location.search);
resourceID = urlParams.get("id");

const messageBox = document.getElementById("message");
const resourceTypeName = document.getElementById("resourceTitle").textContent.trim();

// ---------------------- LOAD BOOKED / PENDING SLOTS ----------------------
async function updateBookedSlots() {
  const rawDate = document.getElementById("date").value;
  const selectedDate = new Date(rawDate).toLocaleDateString();

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
      b => b.resource === room &&
           b.hour === time &&
           b.date === selectedDate
    );

    if (match) {
      cell.classList.remove("available");
      cell.classList.add("booked");
      cell.textContent = match.status === "pending" ? "pending" : "booked";
    } else {
      if (cell.textContent !== "X") {
        cell.classList.remove("booked");
        cell.classList.add("available");
        cell.textContent = "available";
      }
    }
  });
}

// ---------------------- SEND REQUEST ----------------------
document.querySelectorAll("td[data-room]").forEach(cell => {
  cell.addEventListener("click", async () => {

    //login check
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
    if (!currentUser) {
      alert("⚠️ You must be logged in to make a booking.");
      window.location.href = "login.html";
    }
    
    if (cell.textContent === "booked" || cell.textContent === "unavailable" || cell.textContent === "pending") return;

    const dateInput = document.getElementById("date").value.trim();
    if (!dateInput) {
      alert("⚠️ Select a date first.");
      return;
    }

    const [y, m, d] = dateInput.split("-");
    const date = new Date(y, m - 1, d).toLocaleDateString();
    const room = cell.dataset.room;
    const time = cell.dataset.time;

    const booking = {
      id: Date.now(),
      username: currentUser.email,
      resource: room,
      item: resourceTypeName,
      date,
      hour: time,
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
        alert("❌ " + data.error);
        return;
      }
    } catch {
      alert("⚠️ Cannot contact server.");
      return;
    }

    cell.classList.remove("available");
    cell.classList.add("pending");
    cell.textContent = "pending";

    // update resource availability
    await fetch(`http://localhost:4000/api/resources/${resourceID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        newRoomStatus: "pending",
        roomIndex: room,
        timeIndex: time
       })
      });

    messageBox.textContent = `📩 Request sent for ${room} at ${time}:00 on ${date}`;
  });
});

// Auto-load slots
window.onload = () => {
  let ele = document.getElementById("date");
  ele.value = new Date().toISOString().split("T")[0];
  updateBookedSlots();
};
document.getElementById("date").addEventListener("change", updateBookedSlots);