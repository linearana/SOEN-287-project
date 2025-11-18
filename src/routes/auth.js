const { Router } = require('express');
const { users } = require('../data');
const router = Router();

// SIGNUP
router.post('/signup', (req, res) => {
  const { firstName, lastName, studentId, email, password } = req.body;

  if (!firstName || !lastName || !studentId || !email || !password) {
    return res.status(400).json({ error: "All fields required" });
  }

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: "Email already registered" });
  }

  const newUser = {
    id: users.length + 1,
    firstName,
    lastName,
    studentId,
    email,
    password, 
    role: "student"
  };
  users.push(newUser);

  res.status(201).json({ message: "Signup successful", user: { id: newUser.id, email: newUser.email } });
});

// LOGIN
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  res.json({ message: "Login successful", user: { id: user.id, email: user.email, role: user.role } });
});

// GET PROFILE
router.get('/me/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

module.exports = router;
