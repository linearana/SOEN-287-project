const urlParams = new URLSearchParams(window.location.search);
const resourceID = urlParams.get("id");

async function loadAvailabilities(resourceID){
    const res = await fetch("/api/resources");
    const resources = await res.json();

    const resource = resources.find((element) => element.id == resourceID);

    document.getElementsByTagName("title")[0].textContent = resource.title + " - Admin";
    document.getElementsByTagName("h1")[0].textContent = "Admin " + resource.title + " | Campus Booking";
    document.getElementById("resourceTitle").textContent = resource.title;

    const rooms = resource.rooms;
    const roomsArray = rooms.split(",");


    tableBody = document.getElementById("tableBody");

    roomsArray.forEach((room, indexRoom) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${room}</td>
            <td class="${resource.roomsStatus[indexRoom][0]}" data-room="${room}" data-time="12">${resource.roomsStatus[indexRoom][0]}</td>
            <td class="${resource.roomsStatus[indexRoom][1]}" data-room="${room}" data-time="13">${resource.roomsStatus[indexRoom][1]}</td>
            <td class="${resource.roomsStatus[indexRoom][2]}" data-room="${room}" data-time="14">${resource.roomsStatus[indexRoom][2]}</td>
            <td class="${resource.roomsStatus[indexRoom][3]}" data-room="${room}" data-time="15">${resource.roomsStatus[indexRoom][3]}</td>
            <td class="${resource.roomsStatus[indexRoom][4]}" data-room="${room}" data-time="16">${resource.roomsStatus[indexRoom][4]}</td>
            <td class="${resource.roomsStatus[indexRoom][5]}" data-room="${room}" data-time="17">${resource.roomsStatus[indexRoom][5]}</td>
        `;


        tableBody.appendChild(row);
    });
}

loadAvailabilities(resourceID);