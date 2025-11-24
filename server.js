const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend (public folder)
app.use(express.static(path.join(__dirname, "public")));

// Serve uploaded files (uploads folder)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Paths
const DATA_DIR = path.join(__dirname, "src", "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const RESOURCES_FILE = path.join(DATA_DIR, "resources.json");

// Auto-create empty DB files
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");
if (!fs.existsSync(BOOKINGS_FILE)) fs.writeFileSync(BOOKINGS_FILE, "[]");

// Helpers
const readJSON = file => JSON.parse(fs.readFileSync(file, "utf8"));
const writeJSON = (file, data) =>
  fs.writeFileSync(file, JSON.stringify(data, null, 2));

const hash = pw => crypto.createHash("sha256").update(pw).digest("hex");


// register
app.post("/api/auth/signup", (req, res) => {
  const { firstName, lastName, studentId, email, password } = req.body;

  const users = readJSON(USERS_FILE);

  if (users.some(u => u.email === email)) {
    return res.status(409).json({ error: "Email already exists" });
  }

  const newUser = {
    id: Date.now(),
    firstName,
    lastName,
    studentId,
    email,
    password: hash(password),
    role: "student"
  };

  users.push(newUser);
  writeJSON(USERS_FILE, users);

  res.json({ message: "User registered", user: newUser });
});

// login
app.post("/api/auth/login", (req, res) => {
  const {email, password} = req.body;

  const users = readJSON(USERS_FILE);

  const user = users.find(
    u => u.email === email && u.password === hash(password)
  );

  if(!user){
    return res.status(401).json({error: "Invalid email or password"});
  }
  res.json({
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      studentId: user.studentId,
      email: user.email,
      role: user.role
    }
  });
});

const upload = multer({ dest: "uploads/" });

// profile update
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

app.put("/api/users/:id", upload.single("picture"), (req, res) => {
  try {
    const id = Number(req.params.id);
    let users = readJSON(USERS_FILE);

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    const existing = users[userIndex];

    users[userIndex] = {
      ...existing,
      firstName: req.body.firstName ?? existing.firstName,
      lastName: req.body.lastName ?? existing.lastName,
      email: req.body.email ?? existing.email,
      password: req.body.password ? hash(req.body.password) : existing.password,
      picture: req.file ? `/uploads/${req.file.filename}` : existing.picture
    };

    writeJSON(USERS_FILE, users);
    res.json({ message: "Profile updated", user: users[userIndex] });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

// BOOKINGS 
app.post("/api/bookings/check", (req, res) => {
  const { username, item, date } = req.body;
  const bookings = readJSON(BOOKINGS_FILE);
  
  const conflict = bookings.some(b =>
    b.username === username && 
    b.item === item &&
    b.date === date
  );
  
  res.json({ conflict });
});

app.post("/api/bookings", (req, res) => {
  const bookings = readJSON(BOOKINGS_FILE);

  // 🔹 1) Prevent user from booking the same resource type (item) more than once per day
  const alreadyHasBooking = bookings.some(
    b =>
      b.username === req.body.username &&
      b.item === req.body.item &&         // same resource type (Study Rooms, Art Studios, etc.)
      b.date === req.body.date &&
      (b.status === "Booked" || b.status === "Pending")
  );

  if (alreadyHasBooking) {
    return res.status(403).json({
      error: "You already have a booking for this resource type on that day."
    });
  }

  // 🔹 2) Prevent double-booking same room/time (regardless of user)
  const collision = bookings.some(
    b =>
      b.resource === req.body.resource &&
      b.hour === req.body.hour &&
      b.date === req.body.date &&
      (b.status === "Booked" || b.status === "Pending")
  );

  if (collision) {
    return res.status(409).json({ error: "This slot is already booked." });
  }

  // 🔹 3) Decide status based on bookingType from RESOURCES_FILE
  const resources = readJSON(RESOURCES_FILE);

  // Match by resource type name: item (e.g. "Art Studios") ↔ title
  const resource = resources.find(r => r.title === req.body.item);

  let status = "Pending"; // default

  if (resource) {
    if (resource.bookingType === "Instant") {
      status = "Booked";
    } else if (resource.bookingType === "Request") {
      status = "Pending";
    }
  }

  const newBooking = {
    id: Date.now(),
    ...req.body,
    status  // override whatever frontend sent
  };

  bookings.push(newBooking);
  writeJSON(BOOKINGS_FILE, bookings);

  res.json({ message: "Booking saved", booking: newBooking });
});


// get bookings
app.get("/api/bookings", (req, res) => {
  res.json(readJSON(BOOKINGS_FILE));
});


// delete booking
app.delete("/api/bookings/:id", (req, res) => {
  const id = Number(req.params.id);
  let bookings = readJSON(BOOKINGS_FILE);

  const filtered = bookings.filter(b => b.id !== id);

  if (filtered.length === bookings.length) {
    return res.status(404).json({ error: "Booking not found" });
  }

  writeJSON(BOOKINGS_FILE, filtered);
  res.json({ message: "Booking deleted" });
});

// admin controls
app.put("/api/bookings/update", (req, res) => {
  let bookings = readJSON(BOOKINGS_FILE);

  const index = bookings.findIndex(b => b.id === req.body.id);
  if (index === -1) {
    return res.status(404).json({ error: "Booking not found" });
  }

  bookings[index].status = req.body.status;
  writeJSON(BOOKINGS_FILE, bookings);

  res.json({ message: "Booking updated" });
});

//resources
app.patch("/api/resources/:id", (req, res) => {
  const resources = readJSON(RESOURCES_FILE);
  const id = Number(req.params.id);
  const resource = resources.find(r => r.id === id);

  if (!resource) {
    return res.status(404).json({ error: "Resource not found" });
  }
  
  // update status
  if (req.body.status) {
    resource.status = req.body.status;
  }
  // update room status
  else if(req.body.newRoomStatus) {
    const index1 = req.body.timeIndex - 12;
    roomsArray = resource.rooms.split(",").map(r => r.trim());
    const index2 = roomsArray.indexOf(req.body.roomIndex);
    resource.roomsStatus[index1][index2] = req.body.newRoomStatus;
  }

  writeJSON(RESOURCES_FILE, resources);
  res.json({ message: "Resource updated", resource });
});

//get resources
app.get("/api/resources", (req, res) => {
  res.json(readJSON(RESOURCES_FILE));
});

//create resource
//images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "public", "images"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    const resourceName = req.body.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, ""); // remove weird chars

    const filename = `${resourceName}${ext}`;
    cb(null, filename);
  }
});

const uploadImageResource = multer({ storage });

app.post("/api/resources", uploadImageResource.single("image"), (req, res) => {
  console.log("req.file:", req.file);
  const resources = readJSON(RESOURCES_FILE);

  const { title, description, rulesResource, rooms, bookingType } = req.body;
  
  const resourceNameSafe = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
    
  const roomsArray = rooms.split(",");
  const timeSlotsPerRoom = 6;
  
  const newResource = {
    id: Date.now(),
    title,
    description,
    rulesResource,
    bookingType,
    rooms,
    roomsStatus: roomsArray.map(() => Array(timeSlotsPerRoom).fill("available")),
    status: "enabled",
    image: req.file
        ? `/images/${resourceNameSafe}${path.extname(req.file.originalname)}`
        : null  
  };

  resources.push(newResource);
  writeJSON(RESOURCES_FILE, resources);

  res.json({ message: "Resource created", resource: newResource });
});


app.listen(4000, () =>
  console.log("Backend running at http://localhost:4000")
);
