const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

// ========================
//  MIDDLEWARE
// ========================
app.use(cors({ origin: "*" }));
app.use(express.json());

const readUsers = () => {
  try {
    return JSON.parse(fs.readFileSync("users.json"));
  } catch (err) {
    console.error("Error reading users.json:", err);
    return [];
  }
};

// Ensure files exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]");
if (!fs.existsSync(BOOKINGS_FILE)) fs.writeFileSync(BOOKINGS_FILE, "[]");

// ========================
//  HELPERS
// ========================
const readJSON = (file) =>
  JSON.parse(fs.readFileSync(file, "utf8"));

const writeJSON = (file, data) =>
  fs.writeFileSync(file, JSON.stringify(data, null, 2));

// ========================
//  AUTH - SIGNUP
// ========================
app.post("/api/auth/signup", (req, res) => {
  const { firstName, lastName, studentId, email, password } = req.body;

  if (!firstName || !lastName || !studentId || !email || !password)
    return res.status(400).json({ error: "All fields required" });

  const users = readJSON(USERS_FILE);

  if (users.find(u => u.email === email))
    return res.status(409).json({ error: "Email already registered" });

  const newUser = {
    id: Date.now(),
    firstName,
    lastName,
    studentId,
    email,
    password,    // plain (assignment-safe)
    role: "student"
  };

  users.push(newUser);
  writeJSON(USERS_FILE, users);

  return res.json({ message: "User created", user: newUser });
});

// ========================
//  AUTH - LOGIN
// ========================
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.email === email && u.password === password);

  if (!user)
    return res.status(401).json({ error: "Invalid email or password" });

  res.json({
    user: {
      id: user.id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      studentId: user.studentId || "",
      email: user.email,
      role: user.role || "student" // Default to student
    }
  });
});

// ========================
//  BOOKINGS (placeholders)
// ========================
app.get("/api/bookings", (req, res) => {
  const bookings = readJSON(BOOKINGS_FILE);
  res.json(bookings);
});

app.post("/api/bookings", (req, res) => {
  const bookings = readJSON(BOOKINGS_FILE);
  bookings.push(req.body);
  writeJSON(BOOKINGS_FILE, bookings);
  res.json({ message: "Booking saved" });
});

// ========================
//  START SERVER
// ========================
app.listen(4000, () => {
  console.log("Server running at http://localhost:4000");
});
