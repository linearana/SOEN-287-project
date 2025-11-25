document.addEventListener("DOMContentLoaded", async () => {
  let currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
  if (!currentUser) return;

  let headerPic = document.getElementsByClassName("user-pic")[0];
  if (!headerPic) return;

  try {
    const res = await fetch(`/api/users/${currentUser.id}`); // get latest user data
    const userData = await res.json();
    headerPic.src = userData.picture || "images/user.png";
  } catch (err) {
    console.error("Failed to load user picture:", err);
    headerPic.src = currentUser.picture || "images/user.png"; // fallback
  }
});
