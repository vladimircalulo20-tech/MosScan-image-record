// ============================================================
// 🦟 MOSQUISCAN - MAIN JAVASCRIPT
// Drone-Assisted AI Inspection and Geospatial Mapping System
// ============================================================


// ============================================================
// 1. TEACHABLE MACHINE MODEL
// ============================================================

const MODEL_URL =
    "https://teachablemachine.withgoogle.com/models/cKLAix4wn/";

let model = null;
let maxPredictions = 0;


// ============================================================
// 2. DOM ELEMENTS
// ============================================================

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
const totalRecords = document.getElementById("totalRecords");
const possibleSites = document.getElementById("possibleSites");
const notPossibleSites = document.getElementById("notPossibleSites");


// ============================================================
// 3. VARIABLES
// ============================================================

let currentImage = null;
let currentAIResult = "";
let map = null;
let selectedLocationMarker = null;


// ============================================================
// 4. DEFAULT DATE
// ============================================================

if (inspectionDate) {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    inspectionDate.value = `${year}-${month}-${day}`;
}


// ============================================================
// 5. INITIALIZE MAP
// ============================================================

if (document.getElementById("map")) {

    map = L.map("map").setView(
        [9.8167, 124.4833],
        12
    );

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(map);


    // Click map to select coordinates
    map.on("click", function (event) {

        const lat = event.latlng.lat;
        const lng = event.latlng.lng;

        if (latitudeInput) {
            latitudeInput.value = lat.toFixed(6);
        }

        if (longitudeInput) {
            longitudeInput.value = lng.toFixed(6);
        }


        if (selectedLocationMarker) {
            map.removeLayer(selectedLocationMarker);
        }


        selectedLocationMarker = L.marker([
            lat,
            lng
        ]).addTo(map);

        selectedLocationMarker.bindPopup(
            `<b>Selected Location</b><br>
            Latitude: ${lat.toFixed(6)}<br>
            Longitude: ${lng.toFixed(6)}`
        ).openPopup();

    });

}


// ============================================================
// 6. LOAD TEACHABLE MACHINE MODEL
// ============================================================

async function loadAIModel() {

    try {

        if (!window.tmImage) {

            console.error(
                "Teachable Machine library was not loaded."
            );

            if (aiResult) {
                aiResult.textContent =
                    "AI library not loaded.";
            }

            return;
        }


        const modelURL =
            MODEL_URL + "model.json";

        const metadataURL =
            MODEL_URL + "metadata.json";


        console.log("Loading AI model...");
        console.log("Model URL:", modelURL);
        console.log("Metadata URL:", metadataURL);


        model = await tmImage.load(
            modelURL,
            metadataURL
        );


        maxPredictions =
            model.getTotalClasses();


        console.log(
            "MosquiScan AI Model Loaded!"
        );

        console.log(
            "Number of classes:",
            maxPredictions
        );


        // Show the exact class names
        if (model.getClassLabels) {

            const labels =
                model.getClassLabels();

            console.log(
                "Model Classes:",
                labels
            );

        }


        if (analyzeButton) {
            analyzeButton.disabled = false;
        }


        if (aiResult) {
            aiResult.textContent =
                "AI model ready. Upload an image.";
        }


    } catch (error) {

        console.error(
            "Error loading AI model:",
            error
        );


        if (aiResult) {
            aiResult.textContent =
                "AI model failed to load.";
        }


        if (analyzeButton) {
            analyzeButton.disabled = true;
        }

    }

}


// ============================================================
// 7. IMAGE UPLOAD
// ============================================================

if (imageInput) {

    imageInput.addEventListener(
        "change",
        function (event) {

            const file =
                event.target.files[0];

            if (!file) {
                return;
            }


            currentImage = file;


            const reader =
                new FileReader();


            reader.onload = function (e) {

                if (imagePreview) {

                    imagePreview.src =
                        e.target.result;

                    imagePreview.style.display =
                        "block";

                }


                if (analyzeButton) {
                    analyzeButton.disabled =
                        false;
                }


                if (aiResult) {

                    aiResult.textContent =
                        "Image ready for AI analysis.";

                    aiResult.className =
                        "result-box";

                }

            };


            reader.readAsDataURL(file);

        }
    );

}


// ============================================================
// 8. AI ANALYSIS
// ============================================================

if (analyzeButton) {

    analyzeButton.addEventListener(
        "click",
        async function () {

            // Check model
            if (!model) {

                alert(
                    "The AI model is still loading. Please wait a moment and try again."
                );

                return;
            }


            // Check image
            if (
                !imagePreview ||
                !imagePreview.src ||
                imagePreview.src === window.location.href
            ) {

                alert(
                    "Please upload an image first."
                );

                return;
            }


            try {

                analyzeButton.disabled = true;

                analyzeButton.textContent =
                    "Analyzing...";


                if (aiResult) {

                    aiResult.textContent =
                        "AI is analyzing the image...";

                    aiResult.className =
                        "result-box";

                }


                // ------------------------------------------------
                // RUN TEACHABLE MACHINE
                // ------------------------------------------------

                const predictions =
                    await model.predict(
                        imagePreview
                    );


                console.log(
                    "=============================="
                );

                console.log(
                    "MOSQUISCAN AI PREDICTIONS"
                );

                console.log(
                    "=============================="
                );


                // Print EVERY prediction
                predictions.forEach(
                    function (prediction) {

                        console.log(
                            prediction.className +
                            " = " +
                            (
                                prediction.probability * 100
                            ).toFixed(2) +
                            "%"
                        );

                    }
                );


                // ------------------------------------------------
                // FIND HIGHEST PROBABILITY
                // ------------------------------------------------

                let highestPrediction =
                    predictions[0];


                for (
                    let i = 1;
                    i < predictions.length;
                    i++
                ) {

                    if (
                        predictions[i].probability >
                        highestPrediction.probability
                    ) {

                        highestPrediction =
                            predictions[i];

                    }

                }


                const className =
                    highestPrediction.className.trim();


                const confidence =
                    (
                        highestPrediction.probability *
                        100
                    ).toFixed(2);


                console.log(
                    "Highest Prediction:",
                    className
                );

                console.log(
                    "Confidence:",
                    confidence + "%"
                );


                // ------------------------------------------------
                // IMPORTANT:
                // EXACT CLASS MATCHING
                // ------------------------------------------------

                if (
                    className ===
                    "Possible Breeding Site"
                ) {

                    currentAIResult =
                        "Possible Breeding Site";


                    if (aiResult) {

                        aiResult.textContent =
                            `Possible Breeding Site (${confidence}%)`;

                        aiResult.className =
                            "result-box result-possible";

                    }

                }

                else if (
                    className ===
                    "Not a Possible Breeding Site"
                ) {

                    currentAIResult =
                        "Not a Possible Breeding Site";


                    if (aiResult) {

                        aiResult.textContent =
                            `Not a Possible Breeding Site (${confidence}%)`;

                        aiResult.className =
                            "result-box result-not-possible";

                    }

                }

                else {

                    // Unknown class
                    currentAIResult =
                        className;


                    if (aiResult) {

                        aiResult.textContent =
                            `${className} (${confidence}%)`;

                        aiResult.className =
                            "result-box";

                    }

                }


            } catch (error) {

                console.error(
                    "AI analysis error:",
                    error
                );


                if (aiResult) {

                    aiResult.textContent =
                        "AI analysis failed.";

                    aiResult.className =
                        "result-box";

                }

            }


            analyzeButton.disabled =
                false;

            analyzeButton.textContent =
                "Analyze Image";

        }
    );

}


// ============================================================
// 9. CURRENT LOCATION
// ============================================================

if (locationButton) {

    locationButton.addEventListener(
        "click",
        function () {

            if (!navigator.geolocation) {

                alert(
                    "Geolocation is not supported by this browser."
                );

                return;
            }


            locationButton.disabled =
                true;

            locationButton.textContent =
                "Getting location...";


            navigator.geolocation.getCurrentPosition(

                function (position) {

                    const lat =
                        position.coords.latitude;

                    const lng =
                        position.coords.longitude;


                    if (latitudeInput) {
                        latitudeInput.value =
                            lat.toFixed(6);
                    }

                    if (longitudeInput) {
                        longitudeInput.value =
                            lng.toFixed(6);
                    }


                    if (map) {

                        map.setView(
                            [lat, lng],
                            17
                        );


                        if (
                            selectedLocationMarker
                        ) {

                            map.removeLayer(
                                selectedLocationMarker
                            );

                        }


                        selectedLocationMarker =
                            L.marker([
                                lat,
                                lng
                            ]).addTo(map);


                        selectedLocationMarker
                            .bindPopup(
                                `<b>Current Location</b><br>
                                Latitude: ${lat.toFixed(6)}<br>
                                Longitude: ${lng.toFixed(6)}`
                            )
                            .openPopup();

                    }


                    locationButton.disabled =
                        false;

                    locationButton.textContent =
                        "Use Current Location";

                },


                function (error) {

                    console.error(
                        "Geolocation error:",
                        error
                    );


                    alert(
                        "Unable to get your current location. You can enter the coordinates manually or click the map."
                    );


                    locationButton.disabled =
                        false;

                    locationButton.textContent =
                        "Use Current Location";

                }

            );

        }
    );

}


// ============================================================
// 10. COMPRESS IMAGE BEFORE LOCAL STORAGE
// ============================================================

function compressImage(
    file,
    maxWidth = 900,
    quality = 0.7
) {

    return new Promise(
        function (resolve, reject) {

            const reader =
                new FileReader();


            reader.onload =
                function (event) {

                    const img =
                        new Image();


                    img.onload =
                        function () {

                            let width =
                                img.width;

                            let height =
                                img.height;


                            if (
                                width >
                                maxWidth
                            ) {

                                height =
                                    height *
                                    (
                                        maxWidth /
                                        width
                                    );

                                width =
                                    maxWidth;

                            }


                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            canvas.width =
                                width;

                            canvas.height =
                                height;


                            const ctx =
                                canvas.getContext(
                                    "2d"
                                );


                            ctx.drawImage(
                                img,
                                0,
                                0,
                                width,
                                height
                            );


                            const compressed =
                                canvas.toDataURL(
                                    "image/jpeg",
                                    quality
                                );


                            resolve(
                                compressed
                            );

                        };


                    img.onerror =
                        reject;


                    img.src =
                        event.target.result;

                };


            reader.onerror =
                reject;


            reader.readAsDataURL(file);

        }
    );

}


// ============================================================
// 11. SAVE INSPECTION
// ============================================================

if (saveButton) {

    saveButton.addEventListener(
        "click",
        async function () {

            // Check image
            if (!currentImage) {

                alert(
                    "Please upload an image first."
                );

                return;
            }


            // Check AI result
            if (!currentAIResult) {

                alert(
                    "Please analyze the image first."
                );

                return;
            }


            // Check latitude
            if (
                !latitudeInput ||
                !latitudeInput.value.trim()
            ) {

                alert(
                    "Please enter or select a latitude."
                );

                return;
            }


            // Check longitude
            if (
                !longitudeInput ||
                !longitudeInput.value.trim()
            ) {

                alert(
                    "Please enter or select a longitude."
                );

                return;
            }


            try {

                saveButton.disabled =
                    true;

                saveButton.textContent =
                    "Saving...";


                // Compress image
                const imageData =
                    await compressImage(
                        currentImage
                    );


                const record = {

                    id:
                        Date.now(),

                    image:
                        imageData,

                    result:
                        currentAIResult,

                    latitude:
                        latitudeInput.value.trim(),

                    longitude:
                        longitudeInput.value.trim(),

                    date:
                        inspectionDate
                            ? inspectionDate.value
                            : "",

                    timestamp:
                        new Date().toISOString(),

                    notes:
                        notesInput
                            ? notesInput.value.trim()
                            : ""

                };


                // Get old records
                let records = [];


                try {

                    const stored =
                        localStorage.getItem(
                            "mosquiscanRecords"
                        );


                    if (stored) {

                        records =
                            JSON.parse(
                                stored
                            );

                    }


                    if (!Array.isArray(records)) {
                        records = [];
                    }

                } catch (error) {

                    console.error(
                        "Error reading records:",
                        error
                    );

                    records = [];

                }


                // Add new record
                records.push(record);


                // Save
                localStorage.setItem(
                    "mosquiscanRecords",
                    JSON.stringify(records)
                );


                // Success message
                if (saveMessage) {

                    saveMessage.textContent =
                        "Inspection saved successfully!";

                    saveMessage.style.color =
                        "#16a34a";

                }


                alert(
                    "Inspection saved successfully!"
                );


                // Reset form
                currentImage = null;
                currentAIResult = "";


                if (imageInput) {
                    imageInput.value = "";
                }


                if (imagePreview) {

                    imagePreview.src = "";

                    imagePreview.style.display =
                        "none";

                }


                if (aiResult) {

                    aiResult.textContent =
                        "No analysis yet.";

                    aiResult.className =
                        "result-box";

                }


                if (notesInput) {
                    notesInput.value = "";
                }


                // Refresh
                updateDashboard();
                displayRecords();
                displayMapMarkers();


            } catch (error) {

                console.error(
                    "SAVE ERROR:",
                    error
                );


                if (
                    error.name ===
                    "QuotaExceededError"
                ) {

                    alert(
                        "The browser storage is full. Try deleting some old records."
                    );

                } else {

                    alert(
                        "The inspection could not be saved. Check the browser console for details."
                    );

                }

            }


            saveButton.disabled =
                false;

            saveButton.textContent =
                "Save Inspection";

        }
    );

}


// ============================================================
// 12. GET SAVED RECORDS
// ============================================================

function getSavedRecords() {

    try {

        const stored =
            localStorage.getItem(
                "mosquiscanRecords"
            );


        if (!stored) {
            return [];
        }


        const records =
            JSON.parse(stored);


        if (!Array.isArray(records)) {
            return [];
        }


        return records;

    } catch (error) {

        console.error(
            "Could not load records:",
            error
        );

        return [];

    }

}


// ============================================================
// 13. UPDATE DASHBOARD
// ============================================================

function updateDashboard() {

    const records =
        getSavedRecords();


    const total =
        records.length;


    const possible =
        records.filter(
            function (record) {

                return (
                    record.result ===
                    "Possible Breeding Site"
                );

            }
        ).length;


    const notPossible =
        records.filter(
            function (record) {

                return (
                    record.result ===
                    "Not a Possible Breeding Site"
                );

            }
        ).length;


    if (totalRecords) {
        totalRecords.textContent =
            total;
    }


    if (possibleSites) {
        possibleSites.textContent =
            possible;
    }


    if (notPossibleSites) {
        notPossibleSites.textContent =
            notPossible;
    }

}


// ============================================================
// 14. DISPLAY RECORDS
// ============================================================

function displayRecords() {

    if (!recordsList) {
        return;
    }


    const records =
        getSavedRecords();


    recordsList.innerHTML = "";


    if (records.length === 0) {

        recordsList.innerHTML =
            `<p class="no-records">
                No inspection records yet.
            </p>`;

        return;
    }


    // Newest first
    const reversedRecords =
        [...records].reverse();


    reversedRecords.forEach(
        function (record) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "record-item";


            const resultClass =
                record.result ===
                "Possible Breeding Site"
                    ? "result-possible"
                    : "result-not-possible";


            item.innerHTML = `

                <div class="record-image">
                    <img
                        src="${record.image}"
                        alt="Inspection Image"
                    >
                </div>

                <div class="record-info">

                    <h3 class="${resultClass}">
                        ${record.result}
                    </h3>

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
                        ${record.date || "N/A"}
                    </p>

                    <p>
                        <strong>Notes:</strong>
                        ${record.notes || "None"}
                    </p>

                </div>

            `;


            recordsList.appendChild(
                item
            );

        }
    );

}


// ============================================================
// 15. DISPLAY MAP MARKERS
// ============================================================

function displayMapMarkers() {

    if (!map) {
        return;
    }


    const records =
        getSavedRecords();


    // Remove previous MosquiScan markers
    map.eachLayer(
        function (layer) {

            if (
                layer instanceof L.Marker &&
                layer !== selectedLocationMarker
            ) {

                map.removeLayer(
                    layer
                );

            }

        }
    );


    records.forEach(
        function (record) {

            const lat =
                parseFloat(
                    record.latitude
                );

            const lng =
                parseFloat(
                    record.longitude
                );


            if (
                Number.isNaN(lat) ||
                Number.isNaN(lng)
            ) {

                return;

            }


            const isPossible =
                record.result ===
                "Possible Breeding Site";


            // Red = Possible
            // Green = Not Possible
            const markerColor =
                isPossible
                    ? "red"
                    : "green";


            const marker =
                L.circleMarker(
                    [lat, lng],
                    {
                        radius: 9,

                        color:
                            markerColor,

                        fillColor:
                            markerColor,

                        fillOpacity: 0.8
                    }
                ).addTo(map);


            const popupImage =
                record.image
                    ? `
                        <img
                            src="${record.image}"
                            style="
                                width:180px;
                                max-height:130px;
                                object-fit:cover;
                                border-radius:8px;
                                margin-bottom:8px;
                            "
                        >
                    `
                    : "";


            marker.bindPopup(`

                <div style="text-align:center;">

                    ${popupImage}

                    <strong>
                        ${record.result}
                    </strong>

                    <br><br>

                    Latitude:
                    ${record.latitude}

                    <br>

                    Longitude:
                    ${record.longitude}

                    <br>

                    Date:
                    ${record.date || "N/A"}

                </div>

            `);

        }
    );

}


// ============================================================
// 16. OPTIONAL CLEAR ALL RECORDS
// ============================================================

const clearRecordsButton =
    document.getElementById(
        "clearRecordsButton"
    );


if (clearRecordsButton) {

    clearRecordsButton.addEventListener(
        "click",
        function () {

            const confirmed =
                confirm(
                    "Are you sure you want to delete all MosquiScan records?"
                );


            if (!confirmed) {
                return;
            }


            localStorage.removeItem(
                "mosquiscanRecords"
            );


            updateDashboard();
            displayRecords();
            displayMapMarkers();


            alert(
                "All records have been deleted."
            );

        }
    );

}


// ============================================================
// 17. INITIALIZE
// ============================================================

async function initializeMosquiScan() {

    console.log(
        "Starting MosquiScan..."
    );


    // Load existing records
    updateDashboard();
    displayRecords();
    displayMapMarkers();


    // Load AI model
    await loadAIModel();


    console.log(
        "MosquiScan is ready!"
    );

}


// Start system
initializeMosquiScan();
