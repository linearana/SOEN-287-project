console.log("availability.js loaded");

urlParams = new URLSearchParams(window.location.search);
resourceIDParam = urlParams.get("id");
resourceID = resourceIDParam ? Number(resourceIDParam) : null;

const resourceTypeName = document.getElementById("resourceTitle").textContent.trim();
const dateInput = document.getElementById("date");
messageBox = document.getElementById("message") || { textContent: "" };

const TIMES = [12, 13, 14, 15, 16, 17];

async function buildTableFromResourcePublic() {
  console.log("buildTableFromResourcePublic() called");

  let resources = [];
  try {
    const res = await fetch("http://localhost:4000/api/resources");
    resources = await res.json();
  } catch (err) {
    console.error("SERVER OFFLINE → cannot load resources.", err);
    alert("Cannot load resources from server.");
    return;
  }

  console.log("Loaded resources (public):", resources);

  let resource = null;
  if (resourceID && !Number.isNaN(resourceID)) {
    resource = resources.find(r => r.id === resourceID);
  }
  if (!resource) {
    resource = resources.find(
      r =>
        r.title &&
        r.title.trim().toLowerCase() === resourceTypeName.toLowerCase()
    );
  }

  if (!resource) {
    console.error("❌ Public resource not found for page:", {
      resourceID,
      resourceTypeName,
      available: resources.map(r => ({ id: r.id, title: r.title }))
    });
    alert("Could not find matching resource configuration for this page.");
    return;
  }

  console.log("Matched public resource:", resource);

  const tbody = document.querySelector("table.atable tbody");
  if (!tbody) {
    console.error("❌ tbody for .atable not found on public page");
    return;
  }
  tbody.innerHTML = "";

  const roomsArray = resource.rooms.split(",").map(r => r.trim());
  console.log("Rooms for this public resource:", roomsArray);

  roomsArray.forEach((roomName, roomIndex) => {
    const tr = document.createElement("tr");

    // Room name cell
    const tdRoom = document.createElement("td");
    tdRoom.textContent = roomName;
    tr.appendChild(tdRoom);

    // Time cells
    TIMES.forEach((hour, colIndex) => {
      const td = document.createElement("td");
      td.dataset.room = roomName;
      td.dataset.time = String(hour);

      const baseStatus =
        resource.roomsStatus?.[roomIndex]?.[colIndex] || "available";

      if (baseStatus === "unavailable") {
        td.textContent = "unavailable";
        td.classList.add("unavailable");
      } else {
        td.textContent = "available";
        td.classList.add("available");
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  console.log("Public table rows built:", tbody.children.length);

  attachPublicClickHandlers();
  await updateBookedSlotsPublic();
}

async function updateBookedSlotsPublic() {
  const selectedDate = dateInput.value;
  if (!selectedDate) {
    console.log("No date selected yet, skipping updateBookedSlotsPublic.");
    return;
  }

  let bookings = [];
  try {
    const res = await fetch("http://localhost:4000/api/bookings");
    bookings = await res.json();
  } catch (err) {
    console.warn("SERVER OFFLINE → cannot load bookings (public).", err);
    return;
  }

  console.log("Current bookings (public):", bookings);

  document.querySelectorAll("td[data-room]").forEach(cell => {
    const room = cell.dataset.room;
    const time = cell.dataset.time;

    const match = bookings.find(
      b =>
        b.resource === room &&
        b.hour === time &&
        b.date === selectedDate &&
        (b.status === "Booked" ||
         b.status === "Pending" ||
         b.status === "booked" ||
         b.status === "pending")
    );

    if (match) {
  const status = String(match.status).toLowerCase();

  cell.classList.remove("available", "booked", "pending", "unavailable");

  if (match) {
  const status = String(match.status).toLowerCase();
  cell.classList.remove("available", "booked", "pending", "unavailable");

  if (status === "unavailable") {
 if (match) {
  const status = String(match.status).toLowerCase();
  cell.classList.remove("available", "booked", "pending", "unavailable");

  if (status === "unavailable") {
    cell.classList.add("unavailable");
    cell.textContent = "X";           
  } else if (status === "pending") {
    cell.classList.add("pending");
    cell.textContent = "Pending";
  } else { 
    cell.classList.add("booked");
    cell.textContent = "Booked";
  }
  }
  }
  }
  }
  });
}

function handlePublicCellClick() {
  const cell = this;

  if (
    cell.textContent === "unavailable" ||
    cell.textContent === "booked" ||
    cell.textContent === "pending"
  ) {
    return;
  }

  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

  if (!currentUser) {
    alert("⚠️ You must be logged in to book a resource.");
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `login.html?return=${returnUrl}`;
    return;
  }

  messageBox.textContent = "You are already logged in. Go to your resources page to book.";
}

function attachPublicClickHandlers() {
  const cells = document.querySelectorAll("td[data-room]");
  cells.forEach(cell => {
    cell.addEventListener("click", handlePublicCellClick);
  });
  console.log("Public click handlers attached to cells:", cells.length);
}

window.addEventListener("load", async () => {
  console.log("window.load fired on PUBLIC availability page");

  if (!dateInput.value) {
    dateInput.value = new Date().toISOString().split("T")[0];
    console.log("Default public date set to:", dateInput.value);
  }

  await buildTableFromResourcePublic();
});

dateInput.addEventListener("change", updateBookedSlotsPublic);
