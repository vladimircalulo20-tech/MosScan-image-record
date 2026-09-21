/* =========================
   MOSQUISCAN
   MAIN JAVASCRIPT
========================= */


// =========================
// GET HTML ELEMENTS
// =========================

const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");

const analyzeButton = document.getElementById("analyzeButton");
const aiResult = document.getElementById("aiResult");

const latitudeInput = document.getElementById("latitude");
const longitudeInput = document.getElementById("longitude");

const locationButton = document.getElementById("locationButton");

const inspectionDate = document.getElementById("inspectionDate");
const notesInput = document.getElementById("notes");

const saveButton = document.getElementById("saveButton");
const saveMessage = document.getElementById("saveMessage");

const recordsList = document.getElementById("recordsList");


// Dashboard
const totalRecordsElement =
    document.getElementById("totalRecords");

const possibleSitesElement =
    document.getElementById("possibleSites");

const notPossibleSitesElement =
    document.getElementById("notPossibleSites");


// =========================
// VARIABLES
// =========================

let selectedImageData = null;

let currentAIResult = null;

let temporaryMarker = null;


// =========================
// DEFAULT DATE
// =========================

const today = new Date();

const formattedDate =
    today.toISOString().split("T")[0];

inspectionDate.value = formattedDate;


// =========================
// CREATE MAP
// =========================

const map = L.map("map").setView(
    [12.8797, 121.7740],
    6
);


// =========================
// OPENSTREETMAP
// =========================

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution:
            '&copy; OpenStreetMap contributors'
    }
).addTo(map);


// =========================
// IMAGE UPLOAD
// =========================

imageInput.addEventListener(
    "change",
    function () {

        const file = this.files[0];

        if (!file) {
            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {

            selectedImageData =
                event.target.result;

            imagePreview.src =
                selectedImageData;

            imagePreview.style.display =
                "block";

            currentAIResult = null;

            aiResult.textContent =
                "AI Result: Ready for analysis.";

            aiResult.style.borderLeftColor =
                "#087f5b";
        };

        reader.readAsDataURL(file);
    }
);


// =========================
// AI ANALYSIS
// =========================

analyzeButton.addEventListener(
    "click",
    function () {

        if (!selectedImageData) {

            alert(
                "Please upload a drone image first."
            );

            return;
        }


        /*
        ========================================
        TEMPORARY DEMO AI
        ========================================

        Replace this section later with
        your actual Teachable Machine model.
        */

        const demoResults = [
            "Possible Breeding Site",
            "Not a Possible Breeding Site"
        ];


        const randomResult =
            demoResults[
                Math.floor(
                    Math.random() *
                    demoResults.length
                )
            ];


        currentAIResult =
            randomResult;


        // Display result
        if (
            currentAIResult ===
            "Possible Breeding Site"
        ) {

            aiResult.innerHTML =
                "🔴 AI Result: <strong>Possible Breeding Site</strong>";

            aiResult.style.borderLeftColor =
                "#e53935";

        } else {

            aiResult.innerHTML =
                "🟢 AI Result: <strong>Not a Possible Breeding Site</strong>";

            aiResult.style.borderLeftColor =
                "#16a34a";
        }

    }
);


// =========================
// CLICK MAP
// =========================

map.on(
    "click",
    function (event) {

        const latitude =
            event.latlng.lat.toFixed(6);

        const longitude =
            event.latlng.lng.toFixed(6);


        latitudeInput.value =
            latitude;

        longitudeInput.value =
            longitude;


        // Remove old temporary marker
        if (temporaryMarker) {

            map.removeLayer(
                temporaryMarker
            );
        }


        temporaryMarker =
            L.marker([
                event.latlng.lat,
                event.latlng.lng
            ]).addTo(map);


        temporaryMarker.bindPopup(
            "Selected Inspection Location"
        ).openPopup();

    }
);


// =========================
// USE CURRENT LOCATION
// =========================

locationButton.addEventListener(
    "click",
    function () {

        if (!navigator.geolocation) {

            alert(
                "Geolocation is not supported by this browser."
            );

            return;
        }


        navigator.geolocation.getCurrentPosition(

            function (position) {

                const latitude =
                    position.coords.latitude;

                const longitude =
                    position.coords.longitude;


                latitudeInput.value =
                    latitude.toFixed(6);

                longitudeInput.value =
                    longitude.toFixed(6);


                map.setView(
                    [
                        latitude,
                        longitude
                    ],
                    17
                );


                // Remove previous temporary marker
                if (temporaryMarker) {

                    map.removeLayer(
                        temporaryMarker
                    );
                }


                temporaryMarker =
                    L.marker([
                        latitude,
                        longitude
                    ]).addTo(map);


                temporaryMarker.bindPopup(
                    "📍 Current Smartphone Location"
                ).openPopup();

            },


            function (error) {

                alert(
                    "Unable to get your location. Please allow location access."
                );

                console.error(error);
            }

        );

    }
);


// =========================
// SAVE INSPECTION
// =========================

saveButton.addEventListener(
    "click",
    function () {


        // Validate image
        if (!selectedImageData) {

            alert(
                "Please upload a drone image."
            );

            return;
        }


        // Validate AI
        if (!currentAIResult) {

            alert(
                "Please analyze the image first."
            );

            return;
        }


        // Validate location
        if (
            latitudeInput.value === "" ||
            longitudeInput.value === ""
        ) {

            alert(
                "Please select an inspection location on the map."
            );

            return;
        }


        // Get existing records
        let records =
            JSON.parse(
                localStorage.getItem(
                    "mosquiscanRecords"
                )
            ) || [];


        // Create inspection ID
        const inspectionID =
            "MS-" +
            String(
                records.length + 1
            ).padStart(4, "0");


        // Timestamp
        const timestamp =
            new Date().toLocaleString();


        // Create record
        const record = {

            id: inspectionID,

            image: selectedImageData,

            result: currentAIResult,

            latitude:
                latitudeInput.value,

            longitude:
                longitudeInput.value,

            date:
                inspectionDate.value,

            timestamp:
                timestamp,

            notes:
                notesInput.value

        };


        // Add record
        records.push(record);


        // Save
        localStorage.setItem(
            "mosquiscanRecords",
            JSON.stringify(records)
        );


        // Update dashboard
        updateDashboard(records);


        // Display records
        displayRecords(records);


        // Add marker
        addPermanentMarker(record);


        // Success message
        saveMessage.textContent =
            "✅ Inspection saved successfully!";


        // Reset form
        selectedImageData = null;

        currentAIResult = null;

        imageInput.value = "";

        imagePreview.src = "";

        imagePreview.style.display =
            "none";

        aiResult.textContent =
            "AI Result: Waiting for image.";

        latitudeInput.value = "";

        longitudeInput.value = "";

        notesInput.value = "";


        // Remove temporary marker
        if (temporaryMarker) {

            map.removeLayer(
                temporaryMarker
            );

            temporaryMarker = null;
        }


        // Scroll to records
        recordsList.scrollIntoView({
            behavior: "smooth"
        });

    }
);


// =========================
// UPDATE DASHBOARD
// =========================

function updateDashboard(records) {

    const totalRecords =
        records.length;


    const possibleSites =
        records.filter(
            function (record) {

                return (
                    record.result ===
                    "Possible Breeding Site"
                );

            }
        ).length;


    const notPossibleSites =
        records.filter(
            function (record) {

                return (
                    record.result ===
                    "Not a Possible Breeding Site"
                );

            }
        ).length;


    // Update numbers
    totalRecordsElement.textContent =
        totalRecords;

    possibleSitesElement.textContent =
        possibleSites;

    notPossibleSitesElement.textContent =
        notPossibleSites;
}


// =========================
// DISPLAY RECORDS
// =========================

function displayRecords(records) {

    recordsList.innerHTML = "";


    if (records.length === 0) {

        recordsList.innerHTML =
            '<p class="empty-message">No inspection records yet.</p>';

        return;
    }


    // Newest first
    const reversedRecords =
        [...records].reverse();


    reversedRecords.forEach(
        function (record) {


            const recordDiv =
                document.createElement("div");

            recordDiv.className =
                "record";


            const isPossible =
                record.result ===
                "Possible Breeding Site";


            const resultClass =
                isPossible
                    ? "possible-text"
                    : "not-possible-text";


            const resultIcon =
                isPossible
                    ? "🔴"
                    : "🟢";


            recordDiv.innerHTML = `

                <img
                    src="${record.image}"
                    alt="Drone Inspection Image"
                >

                <h3>
                    ${record.id}
                </h3>

                <p>
                    <strong>AI Result:</strong>
                    <span class="${resultClass}">
                        ${resultIcon}
                        ${record.result}
                    </span>
                </p>

                <p>
                    <strong>Latitude:</strong>
                    ${record.latitude}
                </p>

                <p>
                    <strong>Longitude:</strong>
                    ${record.longitude}
                </p>

                <p>
                    <strong>Date:</strong>
                    ${record.date}
                </p>

                <p>
                    <strong>Recorded:</strong>
                    ${record.timestamp}
                </p>

                <p>
                    <strong>Notes:</strong>
                    ${record.notes || "No notes"}
                </p>

            `;


            recordsList.appendChild(
                recordDiv
            );

        }
    );
}


// =========================
// ADD PERMANENT MAP MARKER
// =========================

function addPermanentMarker(record) {

    const latitude =
        parseFloat(
            record.latitude
        );

    const longitude =
        parseFloat(
            record.longitude
        );


    const isPossible =
        record.result ===
        "Possible Breeding Site";


    const markerColor =
        isPossible
            ? "#e53935"
            : "#16a34a";


    const icon =
        isPossible
            ? "🔴"
            : "🟢";


    const popupContent = `

        <div class="map-popup">

            <h3>
                ${icon}
                ${record.result}
            </h3>

            <img
                src="${record.image}"
                alt="Drone Inspection Image"
            >

            <p>
                <strong>Inspection ID:</strong>
                ${record.id}
            </p>

            <p>
                <strong>Latitude:</strong>
                ${record.latitude}
            </p>

            <p>
                <strong>Longitude:</strong>
                ${record.longitude}
            </p>

            <p>
                <strong>Date:</strong>
                ${record.date}
            </p>

            <p>
                <strong>Notes:</strong>
                ${record.notes || "No notes"}
            </p>

        </div>

    `;


    const marker =
        L.circleMarker(
            [
                latitude,
                longitude
            ],
            {
                radius: 9,

                color: markerColor,

                fillColor: markerColor,

                fillOpacity: 0.8,

                weight: 3
            }
        ).addTo(map);


    marker.bindPopup(
        popupContent
    );
}


// =========================
// LOAD SAVED RECORDS
// =========================

function loadSavedRecords() {

    const records =
        JSON.parse(
            localStorage.getItem(
                "mosquiscanRecords"
            )
        ) || [];


    // Update dashboard
    updateDashboard(records);


    // Display records
    displayRecords(records);


    // Add markers
    records.forEach(
        function (record) {

            addPermanentMarker(
                record
            );

        }
    );
}


// =========================
// START MOSQUISCAN
// =========================

loadSavedRecords();
