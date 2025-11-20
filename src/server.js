const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const readUsers = () => {
  try {
    return JSON.parse(fs.readFileSync("users.json"));
  } catch (err) {
    console.error("Error reading users.json:", err);
    return [];
  }
};


const writeUsers = (users) => {
  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
};


app.post("/api/auth/signup", (req, res) => {
  const { firstName, lastName, studentId, email, password } = req.body;

  // Basic validation
  if (!firstName || !lastName || !studentId || !email || !password) {
    return res.status(400).json({
      error: "All fields are required"
    });
  }

  if (!email.includes("@")) {
    return res.status(400).json({
      error: "Valid email is required"
    });
  }

  // Read existing users
  const users = readUsers();

  // Check for duplicate email
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({
      error: "Email already registered"
    });
  }

  // Create new user
  const newUser = {
    id: Date.now(),
    firstName,
    lastName,
    studentId,
    email,
    password 
  };

  users.push(newUser);
  writeUsers(users); // Save to file

  res.status(201).json({
    user: {
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      studentId: newUser.studentId,
      email: newUser.email
    },
    message: "User created successfully"
  });
});

// login 
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  const users = readUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

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

// Existing routes (bookings)
app.get("/api/bookings", (req, res) => { /* ... */ });
app.post("/api/bookings", (req, res) => { /* ... */ });

app.listen(4000, () => {
  console.log("Backend running at http://localhost:4000");
});
