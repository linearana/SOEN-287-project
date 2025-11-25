document.addEventListener("DOMContentLoaded", () => {
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

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
  if (currentUser.picture) {
  preview.src = currentUser.picture;
} else {
  preview.src = "/images/user.png";
}

  if (currentUser.picture) {
    preview.src = currentUser.picture;
  }

  saveBtn.addEventListener("click", async () => {
    message.textContent = "";

    if (editPassword.value && editPassword.value !== confirmPassword.value) {
      message.textContent = "❌ Passwords do not match.";
      return;
    }

    const formData = new FormData();
    formData.append("firstName", editFirstName.value.trim());
    formData.append("lastName", editLastName.value.trim());
    formData.append("email", editEmail.value.trim());
    if (editPassword.value) formData.append("password", editPassword.value);
    if (editPicture.files[0]) formData.append("picture", editPicture.files[0]);

    try {
      const res = await fetch(`http://localhost:4000/api/users/${currentUser.id}`, {
        method: "PATCH",
        body: formData
      });
      const data = await res.json();

      if (!res.ok) {
        message.textContent = `❌ ${data.error || "Update failed"}`;
        return;
      }

      sessionStorage.setItem("currentUser", JSON.stringify(data.user));
      preview.src = data.user.picture; // show uploaded image
      message.textContent = "✅ Profile updated successfully!";
    } catch (err) {
      console.error("Save error:", err);
      message.textContent = `⚠️ Error: ${err.message}`;
    }
  });
});
