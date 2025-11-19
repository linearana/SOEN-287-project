// old data was deleted and all new bookings will be tracked now

// load bookings
let allBookings = JSON.parse(localStorage.getItem("bookings")) || [];

// count number of bookings by item type
const typeCounts = {};
allBookings.forEach(b => {
  typeCounts[b.item] = (typeCounts[b.item] || 0) + 1;
});

// convert to arrays for Chart.js
const labels = Object.keys(typeCounts);
const data = Object.values(typeCounts);

function renderBookingChart() {
  const ctx = document.getElementById("bookingChart");

  if (labels.length === 0) {
    ctx.style.display = "none";
    return;
  }

  // booking by category pie chart
  new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: ["#4CAF50", "#2196F3", "#FFC107", "#FF5722", "#9C27B0"]
      }]
    },
    options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
        legend: { position: "bottom" },
        title: {
          display: true,
          text: "Bookings by Category"
        }
      }
    }
  });
}

function renderPeakTimesChart() {
  const ctx = document.getElementById("peakTimeChart");

  const allBookings = JSON.parse(localStorage.getItem("bookings")) || [];

  const hours = ["12", "13", "14", "15", "16", "17"];
  const counts = {};
  hours.forEach(h => counts[h] = 0);

  allBookings.forEach(b => {
    if (hours.includes(b.hour)) counts[b.hour]++;
  });

  const labels = hours.map(h => h + ":00");
  const data = Object.values(counts);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "",
        data: data,
        backgroundColor: "#2196F3",
        borderRadius: 6,            // rounded bars
        barPercentage: 1.0,         // FULL width of time slot
        categoryPercentage: 1.0     
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Peak Booking Times",
          font: { size: 18 }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          title: {
            display: true,
            text: "Time of Day",   
            color: "black",   
            font: { size: 14 },
            
          }
        },
        y: {
          beginAtZero: true,
          grid: { display: false },
          ticks: {
            stepSize: 1
          },
          title: {
            display: true,
            text: "Number of Bookings",
            color: "black", 
            font: { size: 12 }
          }
        }
      }
    }
  });
}

function renderWeeklyTrend() {
  const ctx = document.getElementById("weeklyTrend");

  const allBookings = JSON.parse(localStorage.getItem("bookings")) || [];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const counts = {
    "Sun": 0, "Mon": 0, "Tue": 0,
    "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0
  };

  allBookings.forEach(b => {
    if (b.date) {
      const weekday = new Date(b.date).getDay();
      counts[daysOfWeek[weekday]]++;
    }
  });

  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const data = labels.map(d => counts[d]);

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "",
        data: data,
        borderColor: "#FF5722",
        backgroundColor: "#FF5722",
        borderWidth: 3,
        tension: 0.3,
        pointRadius: 5,
        pointBackgroundColor: "#FF5722"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Weekly Booking Trend",
          font: { size: 18 }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Number of Bookings",
            font: { size: 14 }
          },
          grid: { display: true, color: "#eee" }
        },

        // Main X axis (bottom)
        x: {
          grid: { display: false },
          ticks: { color: "#000" }
        },

        // SECOND X Axis (right side label only)
        xRight: {
          position: "right",
          ticks: { display: false },  // hide ticks on right
          grid: { display: false },
          title: {
            display: true,
            text: "Day of Week",
            font: { size: 14 }
          }
        }
      }
    }
  });
}


renderBookingChart();
renderPeakTimesChart();
renderWeeklyTrend();