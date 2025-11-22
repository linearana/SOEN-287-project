const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer =  require("multer");

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "..", "public")));

// Paths
const DATA_DIR = path.join(__dirname, "data");
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

// update profile
function readUsers() {
  const filePath = path.join(__dirname, "data", "users.json");
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error("Error reading users.json:", err);
    return [];
  }
}

function writeUsers(users) {
  const filePath = path.join(__dirname, "data", "users.json");
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
}

// PUT /api/users/:id — Update user profile
app.put("/api/users/:id", (req, res) => {
  const id = Number(req.params.id);
  let users = readUsers();

  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  // Update user fields
  users[userIndex] = {
    ...users[userIndex],
    firstName: req.body.firstName || users[userIndex].firstName,
    lastName: req.body.lastName || users[userIndex].lastName,
    email: req.body.email || users[userIndex].email,
    password: req.body.password || users[userIndex].password
    // Ignore studentId — it's read-only
    // Add picture handling later if needed
  };

  writeUsers(users);

  res.json({
    message: "Profile updated successfully",
    user: users[userIndex]
  });
});


// BOOKINGS 
app.post("/api/bookings", (req, res) => {
  const bookings = readJSON(BOOKINGS_FILE);

  // Prevent user from having more than 1 active booking
  const alreadyHasBooking = bookings.some(
    b => b.username === req.body.username && b.status === "Booked"
  );

  if (alreadyHasBooking) {
    return res.status(403).json({
      error: "You already have a booking. Cancel it before making another."
    });
  }

  // Prevent double-booking same room/time
  const collision = bookings.some(
    b =>
      b.resource === req.body.resource &&
      b.hour === req.body.hour &&
      b.date === req.body.date
  );

  if (collision) {
    return res.status(409).json({ error: "This slot is already booked." });
  }

  bookings.push(req.body);
  writeJSON(BOOKINGS_FILE, bookings);

  res.json({ message: "Booking saved" });
});


// get bookings
app.get("/api/bookings", (req, res) => {
  res.json(readJSON(BOOKINGS_FILE));
});


app.post("/api/bookings", (req, res) => {
  const bookings = readJSON(BOOKINGS_FILE);

  // prevent double booking
  const conflict = bookings.some(
    b =>
      b.resource === req.body.resource &&
      b.hour === req.body.hour &&
      b.date === req.body.date
  );

  if (conflict) {
    return res.status(409).json({ error: "Slot already booked" });
  }

  bookings.push(req.body);
  writeJSON(BOOKINGS_FILE, bookings);

  res.json({ message: "Booking saved" });
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

  if (req.body.status) {
    resource.status = req.body.status;
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
    cb(null, path.join(__dirname, "../public", "images"));
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

const upload = multer({ storage });

app.post("/api/resources", upload.single("image"), (req, res) => {
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
