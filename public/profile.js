document.addEventListener("DOMContentLoaded", () => {
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  // DOM elements
  const editFirstName = document.getElementById("editFirstName");
  const editLastName = document.getElementById("editLastName");
  const studentId = document.getElementById("studentId");
  const editEmail = document.getElementById("editEmail");
  const editPassword = document.getElementById("editPassword");
  const confirmPassword = document.getElementById("confirmPassword");
  const editPicture = document.getElementById("editPicture");
  const preview = document.getElementById("preview");
  const saveBtn = document.getElementById("saveBtn");
  const message = document.getElementById("message");

  // Populate initial values
  editFirstName.value = currentUser.firstName;
  editLastName.value = currentUser.lastName;
  studentId.textContent = currentUser.studentId;
  editEmail.value = currentUser.email;

  // Preview image on selection
  editPicture.addEventListener("change", () => {
    const file = editPicture.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => preview.src = e.target.result;
      reader.readAsDataURL(file);
    }
  });

  // Save button click handler
  saveBtn.addEventListener("click", async () => {
    message.textContent = ""; // Clear previous messages

    // Validate password match
    if (editPassword.value && editPassword.value !== confirmPassword.value) {
      message.textContent = "❌ Passwords do not match.";
      return;
    }

    // Prepare updated user data
    const updatedUser = {
      ...currentUser,
      firstName: editFirstName.value.trim(),
      lastName: editLastName.value.trim(),
      email: editEmail.value.trim(),
      password: editPassword.value
        ? CryptoJS.SHA256(editPassword.value).toString()
        : currentUser.password,
      // For production: handle picture upload separately
      // picture: preview.src (Base64 — not recommended for storage)
    };

    try {
      const res = await fetch(`http://localhost:4000/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser)
      });

      if (!res.ok) {
        const error = await res.json();
        message.textContent = `❌ ${error.error}`;
        return;
      }

      // Update sessionStorage with new data
      sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));

      // Refresh displayed full name
      document.getElementById("fullName").textContent = 
        `${updatedUser.firstName} ${updatedUser.lastName}`.trim();


      message.textContent = "✅ Profile updated successfully!";

    } catch (err) {
      console.error("Save error:", err);
      message.textContent = "⚠️ Cannot reach server. Check your connection.";
    }
  });
});
