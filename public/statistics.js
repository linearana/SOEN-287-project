// Load bookings from the backend (not localStorage)
async function fetchBookings() {
  try {
    const res = await fetch("/api/bookings");
    return await res.json();
  } catch (err) {
    console.error("Failed to load bookings:", err);
    return [];
  }
}

// ---------------- BOOKING CATEGORY PIE CHART ----------------
async function renderBookingChart() {
  const allBookings = await fetchBookings();

  const typeCounts = {};
  allBookings.forEach(b => {
    typeCounts[b.item] = (typeCounts[b.item] || 0) + 1;
  });

  const labels = Object.keys(typeCounts);
  const data = Object.values(typeCounts);

  const ctx = document.getElementById("bookingChart");

  if (!labels.length) return;

  new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ["#4CAF50", "#2196F3", "#FFC107"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: { display: true, text: "Bookings by Category" }
      }
    }
  });
}

// ---------------- PEAK TIMES BAR CHART ----------------
async function renderPeakTimesChart() {
  const allBookings = await fetchBookings();

  const hours = ["12", "13", "14", "15", "16", "17"];
  const counts = {};
  hours.forEach(h => (counts[h] = 0));

  allBookings.forEach(b => {
    if (hours.includes(b.hour)) counts[b.hour]++;
  });

  const ctx = document.getElementById("peakTimeChart");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: hours.map(h => h + ":00"),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: "#2196F3"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: "Peak Booking Times" }
      },
      scales: {
        x: { title: { display: true, text: "Time of Day" } },
        y: {
          beginAtZero: true,
          title: { display: true, text: "Number of Bookings" }
        }
      }
    }
  });
}

// ---------------- WEEKLY TREND LINE CHART ----------------
async function renderWeeklyTrend() {
  const allBookings = await fetchBookings();

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const counts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

  allBookings.forEach(b => {
    if (b.date) {
      const d = new Date(b.date).getDay(); // 0=Sun
      const mapped = days[(d + 6) % 7];    // Mon becomes first
      counts[mapped]++;
    }
  });

  const ctx = document.getElementById("weeklyTrend");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: days,
      datasets: [{
        data: days.map(d => counts[d]),
        borderColor: "#FF5722",
        backgroundColor: "#FF5722",
        borderWidth: 3,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: "Weekly Booking Trend" }
      },
      scales: {
        x: { title: { display: true, text: "Day of Week" } },
        y: {
          beginAtZero: true,
          title: { display: true, text: "Number of Bookings" }
        }
      }
    }
  });
}

// Run all charts
renderBookingChart();
renderPeakTimesChart();
renderWeeklyTrend();
