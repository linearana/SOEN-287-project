// --------------- LOGIN CHECK ---------------
const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
if (!currentUser) {
    alert("You must log in first.");
    window.location.href = "login.html";
}

// --------------- GLOBALS ---------------
const message = document.getElementById("message");
const resourceTypeName = document.getElementById("resourceTitle").textContent.trim();

// Format date to server format
function formatDate(input) {
    const d = new Date(input);
    return d.toLocaleDateString("en-US");
}

// --------------- LOAD BOOKED SLOTS ---------------
async function updateBookedSlots() {
    const dateInput = document.getElementById("date").value;
    if (!dateInput) return;

    const selectedDate = formatDate(dateInput);

    let bookings = [];
    try {
        const response = await fetch("http://localhost:4000/api/bookings");
        bookings = await response.json();
    } catch {
        console.warn("Server offline — using local only.");
        return;
    }

    document.querySelectorAll("td[data-room]").forEach(cell => {
        const room = cell.dataset.room;
        const time = cell.dataset.time;

        const match = bookings.find(b =>
            b.resource === room &&
            b.hour === time &&
            b.date === selectedDate
        );

        if (match) {
            // Booked
            cell.classList.add("booked");
            cell.classList.remove("available");
            cell.style.background = match.status === "Pending" ? "orange" : "red";
            cell.style.color = "white";
            cell.textContent = match.status;
        } else {
            // Available
            if (cell.textContent !== "X") {
                cell.classList.add("available");
                cell.classList.remove("booked");
                cell.style.background = "";
                cell.style.color = "black";
                cell.textContent = "Available";
            }
        }
    });
}

// --------------- INSERT BOOKING ---------------
async function createBooking(room, time, date, pending = false) {
    const booking = {
        id: Date.now(),
        username: currentUser.email,
        resource: room,
        item: resourceTypeName,
        date: formatDate(date),
        hour: time,
        status: pending ? "Pending" : "Booked"
    };

    console.log("SENDING BOOKING:", booking);

    try {
        const response = await fetch("http://localhost:4000/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(booking)
        });

        const data = await response.json();
        console.log("SERVER RESPONSE:", data);

        if (!response.ok) {
            alert("❌ " + data.error);
            return false;
        }

        return true;
    } catch (err) {
        alert("⚠️ Cannot contact server.");
        return false;
    }
}


// --------------- CLICK HANDLER ---------------
document.querySelectorAll("td[data-room]").forEach(cell => {
    cell.addEventListener("click", async () => {
        if (cell.textContent === "X" || cell.classList.contains("booked")) return;

        const dateInput = document.getElementById("date").value;
        if (!dateInput) {
            alert("Select a date first");
            return;
        }

        const room = cell.dataset.room;
        const time = cell.dataset.time;

        const success = await createBooking(room, time, dateInput, false);

        if (success) {
            cell.classList.remove("available");
            cell.classList.add("booked");
            cell.style.background = "red";
            cell.style.color = "white";
            cell.textContent = "Booked";

            message.textContent =
                `✔ Booked ${room} at ${time} on ${formatDate(dateInput)}`;
        }
    });
});

// --------------- INITIALIZE ---------------
window.onload = () => {
    const date = document.getElementById("date");
    date.value = new Date().toISOString().split("T")[0];
    updateBookedSlots();
};
document.getElementById("date").addEventListener("change", updateBookedSlots);
