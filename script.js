$(document).ready(function () {
    let selectedCable = null;
    let startDevice = null;
    let isDragging = false;
    let offsetX, offsetY;
    let activeDevice = null;
    let deviceCount = 0;
    let connections = [];

    const deviceImages = {
        "PC": "./images/pc.png",
        "Switch": "./images/switch.png",
        "Router": "./images/router.png",
        "Server": "./images/server.png"
    };

    function makeDraggable(element) {
        element.on("mousedown", function (event) {
            isDragging = true;
            activeDevice = $(this);
            offsetX = event.clientX - activeDevice.position().left;
            offsetY = event.clientY - activeDevice.position().top;
            activeDevice.css("cursor", "grabbing");
            event.preventDefault();
        });

        $(document).on("mousemove", function (event) {
            if (isDragging && activeDevice) {
                let x = event.clientX - offsetX;
                let y = event.clientY - offsetY;

                let container = $(".canvas-container");
                let maxX = container.width() - activeDevice.width();
                let maxY = container.height() - activeDevice.height();

                x = Math.max(0, Math.min(x, maxX));
                y = Math.max(0, Math.min(y, maxY));

                activeDevice.css({ left: x + "px", top: y + "px" });

                updateConnections(activeDevice.attr("id"));
            }
        });

        $(document).on("mouseup", function () {
            if (isDragging) {
                isDragging = false;
                if (activeDevice) {
                    activeDevice.css("cursor", "grab");
                    activeDevice = null;
                }
            }
        });

        // Klik kanan untuk menghapus perangkat
        element.on("contextmenu", function (event) {
            event.preventDefault();
            if (confirm("Hapus perangkat ini?")) {
                deleteDevice($(this).attr("id"));
            }
        });
    }

    function updateConnections(deviceId) {
        connections.forEach(connection => {
            if (connection.startDeviceId === deviceId || connection.endDeviceId === deviceId) {
                let startDevice = $("#" + connection.startDeviceId);
                let endDevice = $("#" + connection.endDeviceId);

                let startX = startDevice.position().left + startDevice.width() / 2;
                let startY = startDevice.position().top + startDevice.height() / 2;
                let endX = endDevice.position().left + endDevice.width() / 2;
                let endY = endDevice.position().top + endDevice.height() / 2;

                let length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                let angle = Math.atan2(endY - startY, endX - startX);

                connection.line.css({
                    left: startX + "px",
                    top: startY + "px",
                    width: length + "px",
                    transform: `rotate(${angle}rad)`
                });
            }
        });
    }

    $(".device").on("dragstart", function (event) {
        event.originalEvent.dataTransfer.setData("deviceType", $(this).data("type"));
    });

    $(".canvas-container").on("dragover", function (event) {
        event.preventDefault();
    });

    $(".canvas-container").on("drop", function (event) {
        event.preventDefault();

        let deviceType = event.originalEvent.dataTransfer.getData("deviceType");
        let x = event.originalEvent.clientX - $(".canvas-container").offset().left;
        let y = event.originalEvent.clientY - $(".canvas-container").offset().top;

        let newDevice = $("<div class='network-device'></div>")
            .attr("data-type", deviceType)
            .attr("id", "device-" + deviceCount++)
            .css({
                left: x + "px",
                top: y + "px",
                position: "absolute"
            })
            .appendTo(".canvas-container");

        let img = $("<img>")
            .attr("src", deviceImages[deviceType])
            .attr("alt", deviceType)
            .appendTo(newDevice);

        makeDraggable(newDevice);
    });

    $(".cable-btn").click(function () {
        selectedCable = $(this).data("type");
    });

    $(".canvas-container").on("click", ".network-device", function () {
        if (selectedCable) {
            if (!startDevice) {
                startDevice = $(this);
            } else {
                let endDevice = $(this);
                let startX = startDevice.position().left + startDevice.width() / 2;
                let startY = startDevice.position().top + startDevice.height() / 2;
                let endX = endDevice.position().left + endDevice.width() / 2;
                let endY = endDevice.position().top + endDevice.height() / 2;

                let length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                let angle = Math.atan2(endY - startY, endX - startX);

                let line = $("<div class='cable-line'></div>").appendTo(".canvas-container");

                line.css({
                    left: startX + "px",
                    top: startY + "px",
                    width: length + "px",
                    backgroundColor: getCableColor(selectedCable),
                    transform: `rotate(${angle}rad)`
                });

                connections.push({
                    startDeviceId: startDevice.attr("id"),
                    endDeviceId: endDevice.attr("id"),
                    line: line
                });

                startDevice = null;
                selectedCable = null;
            }
        }
    });

    function getCableColor(type) {
        switch (type) {
            case "utp": return "green";
            case "fiber": return "blue";
            case "coaxial": return "orange";
            case "stp": return "red";
        }
    }

    function deleteDevice(deviceId) {
        connections = connections.filter(connection => {
            if (connection.startDeviceId === deviceId || connection.endDeviceId === deviceId) {
                connection.line.remove();
                return false;
            }
            return true;
        });

        $("#" + deviceId).remove();
    }

    $("#export-btn").click(function () {
        html2canvas(document.querySelector(".canvas-container")).then(canvas => {
            let link = document.createElement("a");
            link.download = "topology.png";
            link.href = canvas.toDataURL();
            link.click();
        });
    });
});
