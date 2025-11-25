console.log("admin-edit.js loaded");

// ---------------------- LOGIN CHECK ----------------------
const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
if (!currentUser) {
  alert("⚠️ You must be logged in to book a resource.");
  window.location.href = "login.html";
}

const messageBox      = document.getElementById("message");
const tableBody       = document.getElementById("tableBody");
const dateInput       = document.getElementById("date");
const resourceTitleEl = document.getElementById("resourceTitle");
const resourceTitle   = resourceTitleEl ? resourceTitleEl.textContent.trim() : "";

// ---------------------- DATE HELPER ----------------------
function getSelectedDate() {
  const date = dateInput ? dateInput.value.trim() : "";
  if (!date) {
    alert("⚠️ Please select a date first.");
    throw new Error("No date selected");
  }
  return date;
}

// ---------------------- SLOT FUNCTIONS ----------------------
async function makeSlotUnavailable(room, time, date) {
  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    const bookings = await res.json();

    // cancel existing booking if not already Unavailable
    const existing = bookings.find(
      b =>
        b.resource === room &&
        String(b.hour) === String(time) &&
        b.date === date &&
        b.status !== "Unavailable"
    );

    if (existing) {
      await fetch(`http://localhost:4000/api/bookings/${existing.id}`, {
        method: "DELETE"
      });
      if (messageBox) {
        messageBox.innerHTML +=
          `✅ Availability removed for ${room} at ${time}:00 on ${date}, user booking cancelled.<br>`;
      }
    }

    // create admin "Unavailable" booking
    const blockBooking = {
      username: "__ADMIN__",
      resource: room,
      item: resourceTitle,
      date,
      hour: String(time),
      status: "Unavailable"
    };

    const res2 = await fetch("http://localhost:4000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blockBooking)
    });

    if (!res2.ok) {
      const data = await res2.json();
      alert("❌ Failed to mark slot as unavailable: " + (data.error || ""));
    }
  } catch (err) {
    console.error("Error making slot unavailable:", err);
    alert("⚠️ Server error while updating availability.");
  }

  // refresh overlay if available
  if (typeof updateAdminSlots === "function") {
    await updateAdminSlots();
  }
}

async function makeSlotAvailable(room, time, date) {
  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    const bookings = await res.json();

    const blocks = bookings.filter(
      b =>
        b.resource === room &&
        String(b.hour) === String(time) &&
        b.date === date &&
        b.status === "Unavailable"
    );

    for (const b of blocks) {
      await fetch(`http://localhost:4000/api/bookings/${b.id}`, {
        method: "DELETE"
      });
    }

    if (blocks.length > 0 && messageBox) {
      messageBox.innerHTML +=
        `🔁 Availability restored for ${room} at ${time}:00 on ${date}.<br>`;
    }
  } catch (err) {
    console.error("Error making slot available:", err);
    alert("⚠️ Server error while restoring availability.");
  }

  // refresh overlay if available
  if (typeof updateAdminSlots === "function") {
    await updateAdminSlots();
  }
}

// ---------------------- CLICK HANDLER ----------------------
document.addEventListener("DOMContentLoaded", () => {
  if (tableBody) {
    // Attach after table is built
    setTimeout(() => {
      tableBody.addEventListener("click", async e => {
        const cell = e.target.closest("td"); // ensure we get the <td>
        if (!cell || !cell.dataset.room || !cell.dataset.time) return;

        let date;
        try {
          date = getSelectedDate();
        } catch {
          return; // no date selected
        }

        const room = cell.dataset.room;
        const time = cell.dataset.time;

        if (cell.classList.contains("available")) {
          cell.classList.remove("available");
          cell.classList.add("unavailable");
          cell.textContent = "unavailable";
          await makeSlotUnavailable(room, time, date);

        } else if (cell.classList.contains("unavailable")) {
          cell.classList.remove("unavailable");
          cell.classList.add("available");
          cell.textContent = "available";
          await makeSlotAvailable(room, time, date);

        } else if (cell.classList.contains("booked")) {
          cell.classList.remove("booked");
          cell.classList.add("unavailable");
          cell.textContent = "unavailable";
          await makeSlotUnavailable(room, time, date);

        } else if (cell.classList.contains("pending")) {
          cell.classList.remove("pending");
          cell.classList.add("unavailable");
          cell.textContent = "unavailable";
          await makeSlotUnavailable(room, time, date);
        }
      });
    }, 500); // slight delay so table is ready
  }

  // auto date default
  if (dateInput) {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    dateInput.value = `${y}-${m}-${d}`;
  }
});

// ---------------------- CONFIRM CHANGES ----------------------
function confirmChanges() {
  if (!messageBox) return;
  if (messageBox.innerHTML === "") {
    alert("No changes to confirm.");
    return;
  }
  if (confirm("Apply all changes? (Changes are already saved; this just clears messages.)")) {
    messageBox.innerHTML = "";
  }
}
