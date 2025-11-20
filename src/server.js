const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "..", "public")));

// Paths
const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");

// Auto-create empty files if missing
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");
if (!fs.existsSync(BOOKINGS_FILE)) fs.writeFileSync(BOOKINGS_FILE, "[]");

// Helpers
const readJSON = file => JSON.parse(fs.readFileSync(file, "utf8"));
const writeJSON = (file, data) =>
  fs.writeFileSync(file, JSON.stringify(data, null, 2));

const hash = pw => crypto.createHash("sha256").update(pw).digest("hex");

/* -------- REGISTER USER -------- */
app.post("/api/auth/signup", (req, res) => {
  const { firstName, lastName, studentId, email, password } = req.body;
  const users = readJSON(USERS_FILE);

  if (users.some(u => u.email === email))
    return res.status(409).json({ error: "Email already registered" });

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

/* -------- LOGIN -------- */
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.email === email);

  if (!user || user.password !== hash(password))
    return res.status(401).json({ error: "Invalid email or password" });

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

/* -------- BOOKINGS -------- */
app.get("/api/bookings", (req, res) => {
  res.json(readJSON(BOOKINGS_FILE));
});

app.post("/api/bookings", (req, res) => {
  const bookings = readJSON(BOOKINGS_FILE);

  // avoid double booking
  if (
    bookings.some(
      b =>
        b.resource === req.body.resource &&
        b.hour === req.body.hour &&
        b.date === req.body.date
    )
  ) {
    return res.status(409).json({ error: "Slot already booked" });
  }

  bookings.push(req.body);
  writeJSON(BOOKINGS_FILE, bookings);

  res.json({ message: "Booking saved" });
});

/* -------- DELETE BOOKING -------- */
app.delete("/api/bookings/:id", (req, res) => {
  const id = Number(req.params.id);
  let bookings = readJSON(BOOKINGS_FILE);

  const next = bookings.filter(b => b.id !== id);
  if (next.length === bookings.length)
    return res.status(404).json({ error: "Booking not found" });

  writeJSON(BOOKINGS_FILE, next);
  res.json({ message: "Deleted" });
});

/* -------- ADMIN UPDATE BOOKING -------- */
app.put("/api/bookings/update", (req, res) => {
  let bookings = readJSON(BOOKINGS_FILE);

  const index = bookings.findIndex(b => b.id === req.body.id);
  if (index === -1)
    return res.status(404).json({ error: "Booking not found" });

  bookings[index].status = req.body.status;
  writeJSON(BOOKINGS_FILE, bookings);

  res.json({ message: "Updated" });
});

app.listen(4000, () =>
  console.log("Backend running at http://localhost:4000")
);
