const viewButtons = document.querySelectorAll(".view-btn");

viewButtons.forEach(button => {
  button.addEventListener("click", () => {
    const resource = button.dataset.resource;
    const type = button.dataset.type;
    // Pass both resource and type in query string
    window.location.href = `availability.html?resource=${resource}&type=${type}`;
  });
});