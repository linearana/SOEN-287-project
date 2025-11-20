const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
if (!currentUser) {
  alert("⚠️ You must be logged in.");
  window.location.href = "login.html";
}

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
      cell.style.backgroundColor = "red";
      cell.style.color = "white";
      cell.textContent = match.status === "Pending" ? "Pending" : "Booked";
    } else {
      if (cell.textContent !== "X") {
        cell.classList.remove("booked");
        cell.classList.add("available");
        cell.style.backgroundColor = "";
        cell.textContent = "Available";
      }
    }
  });
}

// ---------------------- SEND REQUEST ----------------------
document.querySelectorAll("td[data-room]").forEach(cell => {
  cell.addEventListener("click", async () => {
    if (cell.classList.contains("booked") || cell.textContent === "X") return;

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
    cell.classList.add("booked");
    cell.style.backgroundColor = "orange";
    cell.style.color = "black";
    cell.textContent = "Pending";

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
