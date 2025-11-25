const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, 
  auth: {
    user: "noreply.campus.project@gmail.com",
    pass: "yxlygfnxxfnpxdpg" 
  }
});


// helper to send email
function sendEmail(to, subject, text) {
  return transporter.sendMail({
    from: '"Campus Booking" <your-email@example.com>',
    to,
    subject,
    text
  });
}

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now().toString() + ext;
    cb(null, uniqueName);
  }
});


const upload = multer({ storage });

app.patch("/api/users/:id", upload.single("picture"), (req, res) => {
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

app.get("/api/users/:id", (req, res) => {
  const users = readJSON(USERS_FILE);
  const id = Number(req.params.id);
  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(user);
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

    status = "Pending"; 
    if (resource) {
      if (resource.bookingType === "Instant") {
        status = "Booked";
      } else if (resource.bookingType === "Request") {
        status = "Pending";
      }
    }
  }

  const newBooking = {
    id: Date.now(),
    ...req.body,
    status   
  };

  bookings.push(newBooking);
  writeJSON(BOOKINGS_FILE, bookings);

  // 🔔 send email notification
const users = readJSON(USERS_FILE);
const user = users.find(u => u.email === req.body.username); 
if (user) {
  let message;
  if (status === "Booked") {
    message = `Hey ${user.firstName}, you have booked ${req.body.item}.`;
  } else if (status === "Pending") {
    message = `Hey ${user.firstName}, your booking for ${req.body.item} was sent to admin for approval. You will get a decision within 3 business days.`;
  }
  sendEmail(user.email, "Booking Notification", message)
  .then(() => console.log("Email sent to", user.email))
  .catch(err => console.error("Email error:", err));
}

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

  const booking = bookings.find(b => b.id === id); // capture deleted booking
  const filtered = bookings.filter(b => b.id !== id);

  if (filtered.length === bookings.length) {
    return res.status(404).json({ error: "Booking not found" });
  }

  writeJSON(BOOKINGS_FILE, filtered);

  // 🔔 send email notification
  if (booking) {
    const users = readJSON(USERS_FILE);
    const user = users.find(u => u.email === booking.username);
    if (user) {
      const message = `Hey ${user.firstName}, your booking for ${booking.item} has been cancelled.`;
      sendEmail(user.email, "Booking Notification", message)
      .then(() => console.log("Email sent to", user.email))
      .catch(err => console.error("Email error:", err));

    }
  }

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

  // 🔔 send email notification
const users = readJSON(USERS_FILE);
const user = users.find(u => u.email === bookings[index].username);
if (user) {
  let message;
  if (req.body.status === "Booked") {
    message = `Hey ${user.firstName}, your booking for ${bookings[index].item} has been approved.`;
  } else if (req.body.status === "Declined") {
    message = `Hey ${user.firstName}, your booking for ${bookings[index].item} has been denied.`;
  }
  sendEmail(user.email, "Booking Notification", message)
  .then(() => console.log("Email sent to", user.email))
  .catch(err => console.error("Email error:", err));

}


  res.json({ message: "Booking updated" });
});

//resources
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

    // If disabling, cancel all bookings for this resource
    if (req.body.status === "disabled") {
      const remainingBookings = bookings.filter(
        b => b.item !== resource.title && b.resource !== resource.title
      );
      writeJSON(BOOKINGS_FILE, remainingBookings);
    }
  }
  // Update roomsStatus if provided
  if (Array.isArray(req.body.roomsStatus)) {
    resource.roomsStatus = req.body.roomsStatus;
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
const storage2 = multer.diskStorage({
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

const uploadImageResource = multer({ storage: storage2 });

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
