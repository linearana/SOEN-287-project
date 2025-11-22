const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend (public folder)
app.use(express.static(path.join(__dirname, "..", "public")));

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

const multer = require("multer");
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

    users[userIndex] = {
      ...users[userIndex],
      firstName: req.body.firstName ?? users[userIndex].firstName,
      lastName: req.body.lastName ?? users[userIndex].lastName,
      email: req.body.email ?? users[userIndex].email,
      password: req.body.password ? hash(req.body.password) : users[userIndex].password,
      picture: req.file ? `/uploads/${req.file.filename}` : users[userIndex].picture
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

  // Prevent user from booking the same resource more than once per day
  const alreadyHasBooking = bookings.some(
    b =>
      b.username === req.body.username &&
      b.resource === req.body.resource &&
      b.date === req.body.date &&
      (b.status === "Booked" || b.status === "Pending")
  );

  if (alreadyHasBooking) {
    return res.status(403).json({
      error: "You already booked this resource for that day."
    });
  }

  // Prevent double-booking same room/time by different users
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

  // Handle instant vs approval resources
  const resources = readJSON(RESOURCES_FILE);
  const resource = resources.find(r => r.name === req.body.resource);

  const newBooking = {
    id: Date.now(),
    ...req.body,
    status: resource?.requiresApproval ? "Pending" : "Booked"
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

app.listen(4000, () =>
  console.log("Backend running at http://localhost:4000")
);
