document.getElementById("newResourceForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = document.getElementById("newResourceForm");

  // allows sending image files
  const formData = new FormData(form);

  const rooms = [];
  for (let i = 1; i <= 5; i++) {
    const value = document.getElementById(`roomName${i}`).value.trim();
    if (value !== "") rooms.push(value);
  }
  formData.append("rooms", rooms);

  const bookingType = document.getElementById("bookingType").value;
  console.log(bookingType);
  formData.append("bookingType", bookingType);

  const res = await fetch("/api/resources", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  if (res.ok) {
  alert("Resource created successfully!");
  form.reset();
  window.location.href = "admin-resources.html";
  } else {
  alert(`Error: ${data.error || "Something went wrong"}`);
  }
});