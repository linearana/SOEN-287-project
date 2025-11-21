
document.addEventListener("DOMContentLoaded", async () => {
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || {};
  const role = currentUser.role || "student";
  
  const response = await fetch("/api/resources");
  const resources = await response.json();

  resources.forEach(r => {
    if (r.status === "disabled") {
      const card = document.querySelector(`.card[data-id='${r.id}']`);
      console.log(card);
      if(role === "admin"){
        if (card) {
          card.classList.add("disabled");
          card.getElementsByTagName("button")[1].textContent = "Enable";
        }
      }
      else {
        if (card) {
          card.style.display = "none";
        }
      }
    }
  });
});