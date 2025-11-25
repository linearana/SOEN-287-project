const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const nodemailer = require("nodemailer");

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

// ---------------------- EMAIL SETUP ----------------------
const transporter = nodemailer.createTransport({
  host: "smtp.yourprovider.com",   // e.g. smtp.gmail.com, smtp.office365.com, smtp.sendgrid.net
  port: 587,
  secure: false,
  auth: {
    user: "your-email@yourdomain.com",
    pass: "your-app-password"      // app password or API key
  }
});

function sendBookingEmail(to, subject, text) {
  const mailOptions = {
    from: "your-email@yourdomain.com",
    to,
    subject,
    text
  };
  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("Email error:", err);
    } else {
      console.log("Email sent:", info.response);
    }
  });
}

// ---------------------- AUTH ----------------------
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

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const users = readJSON(USERS_FILE);

  const user = users.find(
    u => u.email === email && u.password === hash(password)
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
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
// ---------------------- BOOKINGS ----------------------
app.post("/api/bookings", (req, res) => {
  const bookings = readJSON(BOOKINGS_FILE);
  const isAdminBlock = req.body.status === "Unavailable";

  const ACTIVE_BOOKING_STATUSES = ["Booked", "Pending"];
  const SLOT_BLOCKING_STATUSES = ["Booked", "Pending", "Unavailable"];

  if (!isAdminBlock) {
    const alreadyHasBooking = bookings.some(
      b =>
        b.username === req.body.username &&
        b.item === req.body.item &&
        b.date === req.body.date &&
        ACTIVE_BOOKING_STATUSES.includes(b.status)
    );
    if (alreadyHasBooking) {
      return res.status(403).json({
        error: "You already have a booking for this resource type on that day."
      });
    }
  }

  const collision = bookings.some(
    b =>
      b.resource === req.body.resource &&
      String(b.hour) === String(req.body.hour) &&
      b.date === req.body.date &&
      SLOT_BLOCKING_STATUSES.includes(b.status)
  );
  if (collision && !isAdminBlock) {
    return res
      .status(409)
      .json({ error: "This slot is already booked or unavailable." });
  }

  let status;
  if (isAdminBlock) {
    status = "Unavailable";
  } else {
    const resources = readJSON(RESOURCES_FILE);
    const resource = resources.find(r => r.title === req.body.item);
    status = resource?.bookingType === "Instant" ? "Booked" : "Pending";
  }

  const newBooking = {
    id: Date.now(),
    ...req.body,
    status
  };

  bookings.push(newBooking);
  writeJSON(BOOKINGS_FILE, bookings);

  // Send confirmation email
  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.email === newBooking.username);
  if (user) {
    sendBookingEmail(
      user.email,
      "Booking Confirmation",
      `Dear ${user.firstName},

Your booking for ${newBooking.item} on ${newBooking.date} at ${newBooking.hour}:00 has been received with status: ${newBooking.status}.

Campus Booking System`
    );
  }

  res.json({ message: "Booking saved", booking: newBooking });
});

app.put("/api/bookings/update", (req, res) => {
  let bookings = readJSON(BOOKINGS_FILE);
  const index = bookings.findIndex(b => b.id === req.body.id);
  if (index === -1) {
    return res.status(404).json({ error: "Booking not found" });
  }

  bookings[index].status = req.body.status;
  writeJSON(BOOKINGS_FILE, bookings);

  // Send status change email
  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.email === bookings[index].username);
  if (user) {
    sendBookingEmail(
      user.email,
      "Booking Status Update",
      `Dear ${user.firstName},

Your booking for ${bookings[index].item} on ${bookings[index].date} at ${bookings[index].hour}:00 has been ${bookings[index].status}.

Campus Booking System`
    );
  }

  res.json({ message: "Booking updated", booking: bookings[index] });
});

// ---------------------- RESOURCES ----------------------
app.patch("/api/resources/:id", (req, res) => {
  const resources = readJSON(RESOURCES_FILE);
  const bookings = readJSON(BOOKINGS_FILE);

  const id = Number(req.params.id);
  const resource = resources.find(r => r.id === id);
  if (!resource) {
    return res.status(404).json({ error: "Resource not found" });
  }

  if (req.body.status) {
    resource.status = req.body.status;

    if (req.body.status === "disabled") {
      const cancelledBookings = bookings.filter(
        b => b.item === resource.title || b.resource === resource.title
      );

      const users = readJSON(USERS_FILE);
      cancelledBookings.forEach(b => {
        const user = users.find(u => u.email === b.username);
        if (user) {
          sendBookingEmail(
            user.email,
            "Booking Cancelled - Resource Disabled",
            `Dear ${user.firstName},

We regret to inform you that your booking for ${b.item} on ${b.date} at ${b.hour}:00 has been cancelled because the resource has been disabled.

Campus Booking System`
          );
        }
      });

      const remainingBookings = bookings.filter(
        b => b.item !== resource.title && b.resource !== resource.title
      );
      writeJSON(BOOKINGS_FILE, remainingBookings);
    }
  }

  if (Array.isArray(req.body.roomsStatus)) {
    resource.roomsStatus = req.body.roomsStatus;
  }

  writeJSON(RESOURCES_FILE, resources);
  res.json({ message: "Resource updated", resource });
});

// ---------------------- OTHER ROUTES ----------------------
app.get("/api/bookings", (req, res) => {
  res.json(readJSON(BOOKINGS_FILE));
});

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

app.get("/api/resources", (req, res) => {
  res.json(readJSON(RESOURCES_FILE));
});

// ---------------------- START SERVER ----------------------
app.listen(4000, () =>
  console.log("Backend running at http://localhost:4000")
);
