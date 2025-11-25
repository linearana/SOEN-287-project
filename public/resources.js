async function loadResources() {
    const res = await fetch("/api/resources");
    resources = await res.json();

    resourceContainer = document.getElementsByClassName("cards")[0];
    resourceContainer.innerHTML = "";

    resources.filter(element => element.status === "enabled").forEach(element => {
        const div = document.createElement("div");
        div.dataset.id = element.id;
        div.classList.add("card");

        div.innerHTML = `
            <img src="${element.image}" alt="${element.title}" />
            <h3>${element.title}</h3>
            <p>${element.description}</p>
            <a href="availabilities.html?id=${element.id}"><button>View Availability</button></a>
        `;

        resourceContainer.appendChild(div);
    });
}

loadResources();