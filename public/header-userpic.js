document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(sessionStorage.getItem("currentUser"));
  if (!user) return;

  const headerPic = document.querySelector(".user-pic");
  if (!headerPic) return;

  headerPic.src = user.picture || "images/user.png";
});
