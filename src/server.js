const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { users } = require("./data");

const app = express();
app.use(cors());
app.use(express.json());

// login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.json({ user });
});

// get all bookings
app.get("/api/bookings", (req, res) => {
  try {
    const bookings = JSON.parse(fs.readFileSync("bookings.json"));
    res.json(bookings);
  } catch (err) {
    console.error("Error reading bookings.json:", err);
    res.status(500).json({ error: "Could not load bookings" });
  }
});

// create new booking
app.post("/api/bookings", (req, res) => {
  try {
    const newBooking = req.body;

    const bookings = JSON.parse(fs.readFileSync("bookings.json"));

    // Prevent double-booking (same room + date + hour)
    const conflict = bookings.find(
      b =>
        b.resource === newBooking.resource &&
        b.date === newBooking.date &&
        b.hour === newBooking.hour
    );

    if (conflict) {
      return res.status(409).json({
        error: "This time slot is already booked."
      });
    }

    bookings.push(newBooking);

    fs.writeFileSync("bookings.json", JSON.stringify(bookings, null, 2));

    res.json({
      message: "Booking saved successfully.",
      booking: newBooking
    });

  } catch (err) {
    console.error("Error writing to bookings.json:", err);
    res.status(500).json({ error: "Could not save booking" });
  }
});

// start server
app.listen(4000, () => {
  console.log("Backend running at http://localhost:4000");
});
