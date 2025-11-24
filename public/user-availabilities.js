urlParams = new URLSearchParams(window.location.search);
resourceID = urlParams.get("id");

async function loadAvailabilities(resourceID){
    const res = await fetch("/api/resources");
    const resources = await res.json();

    const resource = resources.find((element) => element.id == resourceID);

    document.getElementsByTagName("title")[0].textContent = resource.title;
    document.getElementById("resourceTitle").textContent = resource.title;
    document.getElementById("rulesUser").textContent = resource.rules;

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

    const bookingType = resource.bookingType;

    if (bookingType === "Instant") {
        const script = document.createElement("script");
        script.src = "user-instant.js";
        document.body.appendChild(script);
    } 
    else if (bookingType === "Request") {
        const script = document.createElement("script");
        script.src = "user-request.js";
        document.body.appendChild(script);
    }
}

//automatically choose date
let ele = document.getElementById("date");
var today = new Date();
var d = String(today.getDate()).padStart(2, '0');
var m = String(today.getMonth() + 1).padStart(2, '0');
var y = today.getFullYear();
ele.value = y + "-" + m + "-" + d;

loadAvailabilities(resourceID);