/* =========================================================
   MOSQUISCAN
   MAIN JAVASCRIPT
   ========================================================= */


/* =========================================================
   GET HTML ELEMENTS
   ========================================================= */

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


/* =========================================================
   DASHBOARD ELEMENTS
   ========================================================= */

const totalRecordsElement =
    document.getElementById("totalRecords");

const possibleSitesElement =
    document.getElementById("possibleSites");

const notPossibleSitesElement =
    document.getElementById("notPossibleSites");


/* =========================================================
   OPTIONAL ELEMENTS
   These won't cause errors if they don't exist in HTML.
   ========================================================= */

const confidenceText =
    document.getElementById("confidenceText");

const clearRecordsButton =
    document.getElementById("clearRecordsButton");


/* =========================================================
   TEACHABLE MACHINE MODEL
   ========================================================= */

const MODEL_URL =
    "https://teachablemachine.withgoogle.com/models/cKLAix4wn/";

let model = null;
let maxPredictions = 0;


/* =========================================================
   VARIABLES
   ========================================================= */

let selectedImageData = null;

let currentAIResult = null;

let currentConfidence = 0;

let temporaryMarker = null;


/* =========================================================
   EXACT TEACHABLE MACHINE CLASS NAMES
   ========================================================= */

const POSSIBLE_CLASS =
    "Possible Breeding Site";

const NOT_POSSIBLE_CLASS =
    "Not a Possible Breeding Site";


/* =========================================================
   DEFAULT DATE
   ========================================================= */

if (inspectionDate) {

    const today = new Date();

    const formattedDate =
        today.toISOString().split("T")[0];

    inspectionDate.value =
        formattedDate;
}


/* =========================================================
   CREATE MAP
   ========================================================= */

const map = L.map("map").setView(
    [12.8797, 121.7740],
    6
);


/* =========================================================
   OPENSTREETMAP
   ========================================================= */

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,

        attribution:
            "&copy; OpenStreetMap contributors"
    }
).addTo(map);


/* =========================================================
   LOAD TEACHABLE MACHINE MODEL
   ========================================================= */

async function loadAIModel() {

    try {

        if (
            typeof tmImage === "undefined"
        ) {

            throw new Error(
                "Teachable Machine library was not loaded."
            );
        }


        const modelURL =
            MODEL_URL + "model.json";

        const metadataURL =
            MODEL_URL + "metadata.json";


        model =
            await tmImage.load(
                modelURL,
                metadataURL
            );


        maxPredictions =
            model.getTotalClasses();


        console.log(
            "MosquiScan AI model loaded successfully."
        );

        console.log(
            "Number of classes:",
            maxPredictions
        );


        if (analyzeButton) {

            analyzeButton.disabled =
                false;

            analyzeButton.textContent =
                "🔍 Analyze Image";
        }


    } catch (error) {

        console.error(
            "AI MODEL ERROR:",
            error
        );


        if (aiResult) {

            aiResult.innerHTML =
                "⚠️ <strong>AI model could not be loaded.</strong>";

            aiResult.style.borderLeftColor =
                "#e53935";
        }


        if (analyzeButton) {

            analyzeButton.disabled =
                true;

            analyzeButton.textContent =
                "AI Model Error";
        }
    }
}


/* =========================================================
   IMAGE UPLOAD
   ========================================================= */

if (imageInput) {

    imageInput.addEventListener(
        "change",
        function () {

            const file =
                this.files[0];


            if (!file) {
                return;
            }


            // Make sure it is an image
            if (!file.type.startsWith("image/")) {

                alert(
                    "Please upload an image file."
                );

                this.value = "";

                return;
            }


            const reader =
                new FileReader();


            reader.onload =
                function (event) {

                    selectedImageData =
                        event.target.result;


                    imagePreview.src =
                        selectedImageData;


                    imagePreview.style.display =
                        "block";


                    // Reset previous result
                    currentAIResult =
                        null;

                    currentConfidence =
                        0;


                    if (aiResult) {

                        aiResult.innerHTML =
                            "AI Result: Ready for analysis.";

                        aiResult.style.borderLeftColor =
                            "#087f5b";
                    }


                    if (confidenceText) {

                        confidenceText.textContent =
                            "";
                    }


                    if (saveMessage) {

                        saveMessage.textContent =
                            "";
                    }
                };


            reader.onerror =
                function () {

                    alert(
                        "Unable to read the selected image."
                    );
                };


            reader.readAsDataURL(file);
        }
    );
}


/* =========================================================
   AI ANALYSIS
   ========================================================= */

if (analyzeButton) {

    analyzeButton.addEventListener(
        "click",
        async function () {

            /* -----------------------------------------
               CHECK IMAGE
               ----------------------------------------- */

            if (!selectedImageData) {

                alert(
                    "Please upload a drone image first."
                );

                return;
            }


            /* -----------------------------------------
               CHECK MODEL
               ----------------------------------------- */

            if (!model) {

                alert(
                    "The AI model is still loading. Please wait a moment and try again."
                );

                return;
            }


            try {

                analyzeButton.disabled =
                    true;

                analyzeButton.textContent =
                    "🔄 Analyzing...";


                if (aiResult) {

                    aiResult.innerHTML =
                        "🤖 AI is analyzing the image...";

                    aiResult.style.borderLeftColor =
                        "#087f5b";
                }


                /* -----------------------------------------
                   RUN TEACHABLE MACHINE PREDICTION
                   ----------------------------------------- */

                const predictions =
                    await model.predict(
                        imagePreview
                    );


                console.log(
                    "AI predictions:",
                    predictions
                );


                /* -----------------------------------------
                   FIND HIGHEST PROBABILITY
                   ----------------------------------------- */

                let bestPrediction =
                    predictions[0];


                for (
                    let i = 1;
                    i < predictions.length;
                    i++
                ) {

                    if (
                        predictions[i].probability >
                        bestPrediction.probability
                    ) {

                        bestPrediction =
                            predictions[i];
                    }
                }


                const className =
                    bestPrediction.className.trim();


                const probability =
                    bestPrediction.probability;


                currentConfidence =
                    probability;


                console.log(
                    "Best class:",
                    className
                );

                console.log(
                    "Confidence:",
                    probability
                );


                /* -----------------------------------------
                   EXACT CLASS MATCHING
                   
                   IMPORTANT:
                   DO NOT USE:
                   className.includes("possible")
                   
                   because:
                   "Not a Possible Breeding Site"
                   also contains "Possible".
                   ----------------------------------------- */


                if (
                    className ===
                    POSSIBLE_CLASS
                ) {

                    currentAIResult =
                        POSSIBLE_CLASS;


                    if (aiResult) {

                        aiResult.innerHTML =
                            "🔴 AI Result: " +
                            "<strong>Possible Breeding Site</strong>" +
                            "<br>" +
                            "<small>Confidence: " +
                            (probability * 100).toFixed(2) +
                            "%</small>";


                        aiResult.style.borderLeftColor =
                            "#e53935";
                    }


                } else if (
                    className ===
                    NOT_POSSIBLE_CLASS
                ) {

                    currentAIResult =
                        NOT_POSSIBLE_CLASS;


                    if (aiResult) {

                        aiResult.innerHTML =
                            "🟢 AI Result: " +
                            "<strong>Not a Possible Breeding Site</strong>" +
                            "<br>" +
                            "<small>Confidence: " +
                            (probability * 100).toFixed(2) +
                            "%</small>";


                        aiResult.style.borderLeftColor =
                            "#16a34a";
                    }


                } else {

                    /* -----------------------------------------
                       UNKNOWN CLASS
                       ----------------------------------------- */

                    currentAIResult =
                        null;


                    if (aiResult) {

                        aiResult.innerHTML =
                            "⚠️ <strong>Unknown AI class:</strong> " +
                            className;

                        aiResult.style.borderLeftColor =
                            "#f2c94c";
                    }


                    console.warn(
                        "Unknown class returned by model:",
                        className
                    );
                }


                /* -----------------------------------------
                   DISPLAY CONFIDENCE IF ELEMENT EXISTS
                   ----------------------------------------- */

                if (confidenceText) {

                    confidenceText.textContent =
                        "Confidence: " +
                        (probability * 100).toFixed(2) +
                        "%";
                }


            } catch (error) {

                console.error(
                    "AI ANALYSIS ERROR:",
                    error
                );


                currentAIResult =
                    null;


                if (aiResult) {

                    aiResult.innerHTML =
                        "❌ <strong>AI analysis failed.</strong>";

                    aiResult.style.borderLeftColor =
                        "#e53935";
                }


                alert(
                    "The AI could not analyze this image. Please try again."
                );


            } finally {

                analyzeButton.disabled =
                    false;

                analyzeButton.textContent =
                    "🔍 Analyze Image";
            }

        }
    );
}


/* =========================================================
   MAP CLICK
   ========================================================= */

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


        /* -----------------------------------------
           REMOVE OLD TEMPORARY MARKER
           ----------------------------------------- */

        if (temporaryMarker) {

            map.removeLayer(
                temporaryMarker
            );
        }


        /* -----------------------------------------
           CREATE TEMPORARY MARKER
           ----------------------------------------- */

        temporaryMarker =
            L.marker(
                [
                    event.latlng.lat,
                    event.latlng.lng
                ]
            ).addTo(map);


        temporaryMarker.bindPopup(
            "📍 Selected Inspection Location"
        ).openPopup();

    }
);


/* =========================================================
   USE CURRENT LOCATION
   ========================================================= */

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
                "📍 Getting location...";


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


                    /* -----------------------------------------
                       MOVE MAP
                       ----------------------------------------- */

                    map.setView(
                        [
                            latitude,
                            longitude
                        ],
                        17
                    );


                    /* -----------------------------------------
                       REMOVE OLD TEMPORARY MARKER
                       ----------------------------------------- */

                    if (temporaryMarker) {

                        map.removeLayer(
                            temporaryMarker
                        );
                    }


                    /* -----------------------------------------
                       ADD CURRENT LOCATION MARKER
                       ----------------------------------------- */

                    temporaryMarker =
                        L.marker(
                            [
                                latitude,
                                longitude
                            ]
                        ).addTo(map);


                    temporaryMarker
                        .bindPopup(
                            "📍 Current Smartphone Location"
                        )
                        .openPopup();


                    locationButton.disabled =
                        false;

                    locationButton.textContent =
                        "📍 Use Current Location";

                },


                function (error) {

                    console.error(
                        "LOCATION ERROR:",
                        error
                    );


                    alert(
                        "Unable to get your location. Please allow location access."
                    );


                    locationButton.disabled =
                        false;

                    locationButton.textContent =
                        "📍 Use Current Location";
                }

            );

        }
    );
}


/* =========================================================
   COMPRESS IMAGE BEFORE LOCAL STORAGE
   ========================================================= */

function compressImageForStorage(
    imageData,
    maxWidth = 900,
    quality = 0.65
) {

    return new Promise(
        function (resolve, reject) {

            const img =
                new Image();


            img.onload =
                function () {

                    let width =
                        img.width;

                    let height =
                        img.height;


                    /* -----------------------------------------
                       RESIZE LARGE IMAGES
                       ----------------------------------------- */

                    if (width > maxWidth) {

                        height =
                            height *
                            (maxWidth / width);

                        width =
                            maxWidth;
                    }


                    const canvas =
                        document.createElement(
                            "canvas"
                        );


                    canvas.width =
                        Math.round(width);

                    canvas.height =
                        Math.round(height);


                    const ctx =
                        canvas.getContext(
                            "2d"
                        );


                    ctx.drawImage(
                        img,
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );


                    /* -----------------------------------------
                       CONVERT TO COMPRESSED JPEG
                       ----------------------------------------- */

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
                function () {

                    reject(
                        new Error(
                            "Unable to compress image."
                        )
                    );
                };


            img.src =
                imageData;
        }
    );
}


/* =========================================================
   GET SAVED RECORDS SAFELY
   ========================================================= */

function getSavedRecords() {

    try {

        const saved =
            localStorage.getItem(
                "mosquiscanRecords"
            );


        if (!saved) {
            return [];
        }


        const records =
            JSON.parse(saved);


        if (!Array.isArray(records)) {
            return [];
        }


        return records;

    } catch (error) {

        console.error(
            "Unable to read saved records:",
            error
        );

        return [];
    }
}


/* =========================================================
   SAVE INSPECTION
   ========================================================= */

if (saveButton) {

    saveButton.addEventListener(
        "click",
        async function () {

            /* -----------------------------------------
               VALIDATE IMAGE
               ----------------------------------------- */

            if (!selectedImageData) {

                alert(
                    "Please upload a drone image."
                );

                return;
            }


            /* -----------------------------------------
               VALIDATE AI RESULT
               ----------------------------------------- */

            if (!currentAIResult) {

                alert(
                    "Please analyze the image first."
                );

                return;
            }


            /* -----------------------------------------
               VALIDATE LOCATION
               ----------------------------------------- */

            if (
                latitudeInput.value === "" ||
                longitudeInput.value === ""
            ) {

                alert(
                    "Please select an inspection location on the map."
                );

                return;
            }


            try {

                saveButton.disabled =
                    true;

                saveButton.textContent =
                    "💾 Saving...";


                if (saveMessage) {

                    saveMessage.textContent =
                        "Saving inspection...";
                }


                /* -----------------------------------------
                   GET EXISTING RECORDS
                   ----------------------------------------- */

                let records =
                    getSavedRecords();


                /* -----------------------------------------
                   COMPRESS IMAGE
                   ----------------------------------------- */

                let compressedImage;


                try {

                    compressedImage =
                        await compressImageForStorage(
                            selectedImageData,
                            900,
                            0.65
                        );

                } catch (compressionError) {

                    console.error(
                        compressionError
                    );

                    compressedImage =
                        selectedImageData;
                }


                /* -----------------------------------------
                   CREATE INSPECTION ID
                   ----------------------------------------- */

                const inspectionID =
                    "MS-" +
                    String(
                        records.length + 1
                    ).padStart(4, "0");


                /* -----------------------------------------
                   TIMESTAMP
                   ----------------------------------------- */

                const timestamp =
                    new Date().toLocaleString();


                /* -----------------------------------------
                   CREATE RECORD
                   ----------------------------------------- */

                const record = {

                    id:
                        inspectionID,

                    image:
                        compressedImage,

                    result:
                        currentAIResult,

                    confidence:
                        currentConfidence,

                    latitude:
                        latitudeInput.value,

                    longitude:
                        longitudeInput.value,

                    date:
                        inspectionDate.value,

                    timestamp:
                        timestamp,

                    notes:
                        notesInput.value.trim()

                };


                /* -----------------------------------------
                   ADD RECORD
                   ----------------------------------------- */

                records.push(
                    record
                );


                /* -----------------------------------------
                   SAVE TO LOCAL STORAGE
                   ----------------------------------------- */

                try {

                    localStorage.setItem(
                        "mosquiscanRecords",
                        JSON.stringify(records)
                    );

                } catch (storageError) {

                    console.error(
                        "LOCAL STORAGE ERROR:",
                        storageError
                    );


                    /* -----------------------------------------
                       RETRY WITH SMALLER IMAGE
                       ----------------------------------------- */

                    try {

                        const smallerImage =
                            await compressImageForStorage(
                                selectedImageData,
                                650,
                                0.45
                            );


                        record.image =
                            smallerImage;


                        records[records.length - 1] =
                            record;


                        localStorage.setItem(
                            "mosquiscanRecords",
                            JSON.stringify(records)
                        );


                    } catch (secondStorageError) {

                        console.error(
                            "SECOND STORAGE ERROR:",
                            secondStorageError
                        );


                        records.pop();


                        throw new Error(
                            "Browser storage is full. Existing MosquiScan records may need to be cleared before saving another image."
                        );
                    }
                }


                /* -----------------------------------------
                   UPDATE DASHBOARD
                   ----------------------------------------- */

                updateDashboard(
                    records
                );


                /* -----------------------------------------
                   DISPLAY RECORDS
                   ----------------------------------------- */

                displayRecords(
                    records
                );


                /* -----------------------------------------
                   ADD MAP MARKER
                   ----------------------------------------- */

                addPermanentMarker(
                    record
                );


                /* -----------------------------------------
                   SUCCESS MESSAGE
                   ----------------------------------------- */

                if (saveMessage) {

                    saveMessage.textContent =
                        "✅ Inspection saved successfully!";
                }


                /* -----------------------------------------
                   RESET FORM
                   ----------------------------------------- */

                selectedImageData =
                    null;

                currentAIResult =
                    null;

                currentConfidence =
                    0;


                imageInput.value =
                    "";

                imagePreview.src =
                    "";

                imagePreview.style.display =
                    "none";


                aiResult.textContent =
                    "AI Result: Waiting for image.";


                aiResult.style.borderLeftColor =
                    "#087f5b";


                if (confidenceText) {

                    confidenceText.textContent =
                        "";
                }


                latitudeInput.value =
                    "";

                longitudeInput.value =
                    "";

                notesInput.value =
                    "";


                /* -----------------------------------------
                   REMOVE TEMPORARY MARKER
                   ----------------------------------------- */

                if (temporaryMarker) {

                    map.removeLayer(
                        temporaryMarker
                    );

                    temporaryMarker =
                        null;
                }


                /* -----------------------------------------
                   SCROLL TO RECORDS
                   ----------------------------------------- */

                if (recordsList) {

                    recordsList.scrollIntoView({
                        behavior: "smooth"
                    });
                }


            } catch (error) {

                console.error(
                    "SAVE ERROR:",
                    error
                );


                if (saveMessage) {

                    saveMessage.textContent =
                        "❌ " + error.message;
                }


                alert(
                    error.message ||
                    "The inspection could not be saved."
                );


            } finally {

                saveButton.disabled =
                    false;

                saveButton.textContent =
                    "💾 Save Inspection";
            }

        }
    );
}


/* =========================================================
   UPDATE DASHBOARD
   ========================================================= */

function updateDashboard(records) {

    const totalRecords =
        records.length;


    const possibleSites =
        records.filter(
            function (record) {

                return (
                    record.result ===
                    POSSIBLE_CLASS
                );

            }
        ).length;


    const notPossibleSites =
        records.filter(
            function (record) {

                return (
                    record.result ===
                    NOT_POSSIBLE_CLASS
                );

            }
        ).length;


    /* -----------------------------------------
       UPDATE NUMBERS
       ----------------------------------------- */

    if (totalRecordsElement) {

        totalRecordsElement.textContent =
            totalRecords;
    }


    if (possibleSitesElement) {

        possibleSitesElement.textContent =
            possibleSites;
    }


    if (notPossibleSitesElement) {

        notPossibleSitesElement.textContent =
            notPossibleSites;
    }
}


/* =========================================================
   ESCAPE HTML
   Prevents notes from accidentally being interpreted
   as HTML inside the record cards.
   ========================================================= */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   DISPLAY RECORDS
   ========================================================= */

function displayRecords(records) {

    if (!recordsList) {
        return;
    }


    recordsList.innerHTML =
        "";


    if (records.length === 0) {

        recordsList.innerHTML =
            '<p class="empty-message">No inspection records yet.</p>';

        return;
    }


    /* -----------------------------------------
       NEWEST FIRST
       ----------------------------------------- */

    const reversedRecords =
        [...records].reverse();


    reversedRecords.forEach(
        function (record) {

            const recordDiv =
                document.createElement(
                    "div"
                );


            recordDiv.className =
                "record";


            /* -----------------------------------------
               EXACT RESULT CHECK
               ----------------------------------------- */

            const isPossible =
                record.result ===
                POSSIBLE_CLASS;


            const resultClass =
                isPossible
                    ? "possible-text"
                    : "not-possible-text";


            const resultIcon =
                isPossible
                    ? "🔴"
                    : "🟢";


            const confidence =
                record.confidence !== undefined
                    ? (
                        Number(record.confidence) *
                        100
                    ).toFixed(2) + "%"
                    : "N/A";


            recordDiv.innerHTML = `

                <img
                    src="${record.image}"
                    alt="Drone Inspection Image"
                >

                <h3>
                    ${escapeHTML(record.id)}
                </h3>

                <p>
                    <strong>AI Result:</strong>
                    <span class="${resultClass}">
                        ${resultIcon}
                        ${escapeHTML(record.result)}
                    </span>
                </p>

                <p>
                    <strong>Confidence:</strong>
                    ${confidence}
                </p>

                <p>
                    <strong>Latitude:</strong>
                    ${escapeHTML(record.latitude)}
                </p>

                <p>
                    <strong>Longitude:</strong>
                    ${escapeHTML(record.longitude)}
                </p>

                <p>
                    <strong>Date:</strong>
                    ${escapeHTML(record.date)}
                </p>

                <p>
                    <strong>Recorded:</strong>
                    ${escapeHTML(record.timestamp)}
                </p>

                <p>
                    <strong>Notes:</strong>
                    ${
                        escapeHTML(
                            record.notes || "No notes"
                        )
                    }
                </p>

            `;


            recordsList.appendChild(
                recordDiv
            );

        }
    );
}


/* =========================================================
   ADD PERMANENT MAP MARKER
   ========================================================= */

function addPermanentMarker(record) {

    const latitude =
        parseFloat(
            record.latitude
        );


    const longitude =
        parseFloat(
            record.longitude
        );


    /* -----------------------------------------
       CHECK COORDINATES
       ----------------------------------------- */

    if (
        Number.isNaN(latitude) ||
        Number.isNaN(longitude)
    ) {

        console.warn(
            "Invalid coordinates for record:",
            record
        );

        return;
    }


    /* -----------------------------------------
       EXACT RESULT CHECK
       ----------------------------------------- */

    const isPossible =
        record.result ===
        POSSIBLE_CLASS;


    const markerColor =
        isPossible
            ? "#e53935"
            : "#16a34a";


    const icon =
        isPossible
            ? "🔴"
            : "🟢";


    const confidence =
        record.confidence !== undefined
            ? (
                Number(record.confidence) *
                100
            ).toFixed(2) + "%"
            : "N/A";


    /* -----------------------------------------
       POPUP
       ----------------------------------------- */

    const popupContent = `

        <div class="map-popup">

            <h3>
                ${icon}
                ${escapeHTML(record.result)}
            </h3>

            <img
                src="${record.image}"
                alt="Drone Inspection Image"
            >

            <p>
                <strong>Inspection ID:</strong>
                ${escapeHTML(record.id)}
            </p>

            <p>
                <strong>Confidence:</strong>
                ${confidence}
            </p>

            <p>
                <strong>Latitude:</strong>
                ${escapeHTML(record.latitude)}
            </p>

            <p>
                <strong>Longitude:</strong>
                ${escapeHTML(record.longitude)}
            </p>

            <p>
                <strong>Date:</strong>
                ${escapeHTML(record.date)}
            </p>

            <p>
                <strong>Notes:</strong>
                ${
                    escapeHTML(
                        record.notes || "No notes"
                    )
                }
            </p>

        </div>

    `;


    /* -----------------------------------------
       CREATE CIRCLE MARKER
       ----------------------------------------- */

    const marker =
        L.circleMarker(
            [
                latitude,
                longitude
            ],
            {

                radius: 9,

                color:
                    markerColor,

                fillColor:
                    markerColor,

                fillOpacity:
                    0.8,

                weight: 3
            }
        ).addTo(map);


    marker.bindPopup(
        popupContent
    );
}


/* =========================================================
   LOAD SAVED RECORDS
   ========================================================= */

function loadSavedRecords() {

    const records =
        getSavedRecords();


    /* -----------------------------------------
       UPDATE DASHBOARD
       ----------------------------------------- */

    updateDashboard(
        records
    );


    /* -----------------------------------------
       DISPLAY RECORDS
       ----------------------------------------- */

    displayRecords(
        records
    );


    /* -----------------------------------------
       ADD MARKERS
       ----------------------------------------- */

    records.forEach(
        function (record) {

            addPermanentMarker(
                record
            );

        }
    );
}


/* =========================================================
   OPTIONAL CLEAR RECORDS BUTTON
   If your HTML has an element with:
   id="clearRecordsButton"
   it will work automatically.
   ========================================================= */

if (clearRecordsButton) {

    clearRecordsButton.addEventListener(
        "click",
        function () {

            const records =
                getSavedRecords();


            if (records.length === 0) {

                alert(
                    "There are no saved records to clear."
                );

                return;
            }


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


            /* -----------------------------------------
               CLEAR DISPLAY
               ----------------------------------------- */

            updateDashboard([]);

            displayRecords([]);


            /* -----------------------------------------
               RELOAD PAGE
               This removes all permanent markers.
               ----------------------------------------- */

            location.reload();
        }
    );
}


/* =========================================================
   START MOSQUISCAN
   ========================================================= */

// Disable analyze button until model loads
if (analyzeButton) {

    analyzeButton.disabled =
        true;

    analyzeButton.textContent =
        "⏳ Loading AI...";
}


// Load saved inspection records
loadSavedRecords();


// Load Teachable Machine model
loadAIModel();
