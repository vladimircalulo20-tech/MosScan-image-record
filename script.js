/* =========================================================
   🦟 MOSQUISCAN
   MAIN JAVASCRIPT
========================================================= */


/* =========================================================
   TEACHABLE MACHINE MODEL
========================================================= */

const MODEL_URL =
    "https://teachablemachine.withgoogle.com/models/cKLAix4wn/";


let model = null;

let currentImage = null;

let currentAIResult = "";

let map = null;

let selectedLocationMarker = null;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const imageInput =
    document.getElementById("imageInput");

const imagePreview =
    document.getElementById("imagePreview");

const previewPlaceholder =
    document.getElementById("previewPlaceholder");

const analyzeButton =
    document.getElementById("analyzeButton");

const aiResult =
    document.getElementById("aiResult");

const latitudeInput =
    document.getElementById("latitude");

const longitudeInput =
    document.getElementById("longitude");

const locationButton =
    document.getElementById("locationButton");

const inspectionDate =
    document.getElementById("inspectionDate");

const notesInput =
    document.getElementById("notes");

const saveButton =
    document.getElementById("saveButton");

const saveMessage =
    document.getElementById("saveMessage");

const recordsList =
    document.getElementById("recordsList");

const clearRecordsButton =
    document.getElementById("clearRecordsButton");

const totalRecords =
    document.getElementById("totalRecords");

const possibleSites =
    document.getElementById("possibleSites");

const notPossibleSites =
    document.getElementById("notPossibleSites");


/* =========================================================
   DEFAULT DATE
========================================================= */

function setDefaultDate() {

    if (!inspectionDate) {
        return;
    }

    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");

    inspectionDate.value =
        `${year}-${month}-${day}`;
}


/* =========================================================
   MAP
========================================================= */

function initializeMap() {

    const mapElement =
        document.getElementById("map");

    if (!mapElement) {
        return;
    }

    map =
        L.map("map").setView(
            [9.8167, 124.4833],
            12
        );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,

            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);


    map.on(
        "click",
        function (event) {

            const lat =
                event.latlng.lat;

            const lng =
                event.latlng.lng;


            if (latitudeInput) {

                latitudeInput.value =
                    lat.toFixed(6);

            }


            if (longitudeInput) {

                longitudeInput.value =
                    lng.toFixed(6);

            }


            if (selectedLocationMarker) {

                map.removeLayer(
                    selectedLocationMarker
                );

            }


            selectedLocationMarker =
                L.marker(
                    [lat, lng]
                ).addTo(map);


            selectedLocationMarker
                .bindPopup(
                    `
                    <strong>
                        Selected Location
                    </strong>

                    <br><br>

                    Latitude:
                    ${lat.toFixed(6)}

                    <br>

                    Longitude:
                    ${lng.toFixed(6)}
                    `
                )
                .openPopup();

        }
    );

}


/* =========================================================
   LOAD AI MODEL
========================================================= */

async function loadAIModel() {

    try {

        if (!window.tmImage) {

            throw new Error(
                "Teachable Machine library was not loaded."
            );

        }


        console.log(
            "Loading MosquiScan AI model..."
        );


        const modelURL =
            MODEL_URL + "model.json";

        const metadataURL =
            MODEL_URL + "metadata.json";


        model =
            await tmImage.load(
                modelURL,
                metadataURL
            );


        console.log(
            "MosquiScan AI model loaded."
        );


        console.log(
            "Classes:",
            model.getClassLabels()
        );


        if (analyzeButton) {

            analyzeButton.disabled =
                !currentImage;

        }


        if (aiResult) {

            aiResult.textContent =
                "AI model ready. Upload an image.";

            aiResult.className =
                "result-box";

        }

    }

    catch (error) {

        console.error(
            "AI MODEL ERROR:",
            error
        );


        if (aiResult) {

            aiResult.textContent =
                "AI model failed to load. Check the model URL.";

            aiResult.className =
                "result-box";

        }


        if (analyzeButton) {

            analyzeButton.disabled =
                true;

        }

    }

}


/* =========================================================
   IMAGE UPLOAD
========================================================= */

function initializeImageUpload() {

    if (!imageInput) {
        return;
    }


    imageInput.addEventListener(
        "change",
        function (event) {

            const file =
                event.target.files[0];


            if (!file) {
                return;
            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                alert(
                    "Please select an image file."
                );

                return;
            }


            currentImage =
                file;

            currentAIResult =
                "";


            const reader =
                new FileReader();


            reader.onload =
                function (e) {

                    if (imagePreview) {

                        imagePreview.src =
                            e.target.result;

                        imagePreview.style.display =
                            "block";

                    }


                    if (previewPlaceholder) {

                        previewPlaceholder.style.display =
                            "none";

                    }


                    if (aiResult) {

                        aiResult.textContent =
                            "Image ready for AI analysis.";

                        aiResult.className =
                            "result-box";

                    }


                    if (
                        analyzeButton &&
                        model
                    ) {

                        analyzeButton.disabled =
                            false;

                    }

                };


            reader.readAsDataURL(file);

        }
    );

}


/* =========================================================
   AI ANALYSIS
========================================================= */

function initializeAnalysis() {

    if (!analyzeButton) {
        return;
    }


    analyzeButton.addEventListener(
        "click",
        async function () {

            if (!model) {

                alert(
                    "The AI model is still loading. Please wait."
                );

                return;
            }


            if (!currentImage) {

                alert(
                    "Please upload an image first."
                );

                return;
            }


            try {

                analyzeButton.disabled =
                    true;

                analyzeButton.textContent =
                    "🤖 Analyzing...";


                aiResult.textContent =
                    "AI is analyzing the image...";

                aiResult.className =
                    "result-box";


                /*
                 * Run Teachable Machine
                 */

                const predictions =
                    await model.predict(
                        imagePreview
                    );


                console.log(
                    "========== MOSQUISCAN AI =========="
                );


                predictions.forEach(
                    function (prediction) {

                        console.log(
                            prediction.className,
                            (
                                prediction.probability *
                                100
                            ).toFixed(2) +
                            "%"
                        );

                    }
                );


                /*
                 * Find highest probability
                 */

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
                    highestPrediction.className
                        .trim();


                const confidence =
                    (
                        highestPrediction.probability *
                        100
                    ).toFixed(2);


                console.log(
                    "Final result:",
                    className
                );


                console.log(
                    "Confidence:",
                    confidence + "%"
                );


                /*
                 * IMPORTANT:
                 * EXACT CLASS MATCHING
                 *
                 * This prevents:
                 *
                 * "Not a Possible Breeding Site"
                 *
                 * from accidentally being treated
                 * as "Possible Breeding Site".
                 */

                if (
                    className ===
                    "Possible Breeding Site"
                ) {

                    currentAIResult =
                        "Possible Breeding Site";


                    aiResult.innerHTML =
                        `
                        🔴
                        <strong>
                            Possible Breeding Site
                        </strong>

                        <br>

                        Confidence:
                        ${confidence}%
                        `;


                    aiResult.className =
                        "result-box result-possible";

                }


                else if (
                    className ===
                    "Not a Possible Breeding Site"
                ) {

                    currentAIResult =
                        "Not a Possible Breeding Site";


                    aiResult.innerHTML =
                        `
                        🟢
                        <strong>
                            Not a Possible Breeding Site
                        </strong>

                        <br>

                        Confidence:
                        ${confidence}%
                        `;


                    aiResult.className =
                        "result-box result-not-possible";

                }


                else {

                    currentAIResult =
                        className;


                    aiResult.textContent =
                        `${className} (${confidence}%)`;

                    aiResult.className =
                        "result-box";

                }

            }


            catch (error) {

                console.error(
                    "AI ANALYSIS ERROR:",
                    error
                );


                currentAIResult =
                    "";


                aiResult.textContent =
                    "AI analysis failed.";

                aiResult.className =
                    "result-box";

            }


            analyzeButton.disabled =
                false;

            analyzeButton.textContent =
                "🤖 Analyze Image";

        }
    );

}


/* =========================================================
   CURRENT LOCATION
========================================================= */

function initializeLocationButton() {

    if (!locationButton) {
        return;
    }


    locationButton.addEventListener(
        "click",
        function () {

            if (
                !navigator.geolocation
            ) {

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
                            L.marker(
                                [lat, lng]
                            ).addTo(map);


                        selectedLocationMarker
                            .bindPopup(
                                `
                                <strong>
                                    Current Location
                                </strong>

                                <br><br>

                                Latitude:
                                ${lat.toFixed(6)}

                                <br>

                                Longitude:
                                ${lng.toFixed(6)}
                                `
                            )
                            .openPopup();

                    }


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
                        "Unable to get your location. You can enter the coordinates manually or click the map."
                    );


                    locationButton.disabled =
                        false;

                    locationButton.textContent =
                        "📍 Use Current Location";

                },

                {
                    enableHighAccuracy: true,

                    timeout: 10000,

                    maximumAge: 0
                }

            );

        }
    );

}


/* =========================================================
   COMPRESS IMAGE
========================================================= */

function compressImage(
    file,
    maxWidth = 800,
    quality = 0.60
) {

    return new Promise(
        function (resolve, reject) {

            const reader =
                new FileReader();


            reader.onload =
                function (event) {

                    const image =
                        new Image();


                    image.onload =
                        function () {

                            let width =
                                image.width;

                            let height =
                                image.height;


                            /*
                             * Resize image
                             */

                            if (
                                width >
                                maxWidth
                            ) {

                                const ratio =
                                    maxWidth /
                                    width;


                                width =
                                    maxWidth;


                                height =
                                    Math.round(
                                        height *
                                        ratio
                                    );

                            }


                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            canvas.width =
                                width;

                            canvas.height =
                                height;


                            const context =
                                canvas.getContext(
                                    "2d"
                                );


                            context.imageSmoothingEnabled =
                                true;


                            context.imageSmoothingQuality =
                                "medium";


                            context.drawImage(
                                image,
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


                    image.onerror =
                        reject;


                    image.src =
                        event.target.result;

                };


            reader.onerror =
                reject;


            reader.readAsDataURL(file);

        }
    );

}


/* =========================================================
   GET SAVED RECORDS
========================================================= */

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


        if (
            !Array.isArray(records)
        ) {

            return [];

        }


        return records;

    }

    catch (error) {

        console.error(
            "Could not read records:",
            error
        );

        return [];

    }

}


/* =========================================================
   SAVE INSPECTION
========================================================= */

function initializeSaveButton() {

    if (!saveButton) {
        return;
    }


    saveButton.addEventListener(
        "click",
        async function () {

            /*
             * CHECK IMAGE
             */

            if (!currentImage) {

                alert(
                    "Please upload a drone image first."
                );

                return;
            }


            /*
             * CHECK AI RESULT
             */

            if (!currentAIResult) {

                alert(
                    "Please analyze the image first."
                );

                return;
            }


            /*
             * CHECK LATITUDE
             */

            if (
                !latitudeInput ||
                !latitudeInput.value.trim()
            ) {

                alert(
                    "Please enter or select a latitude."
                );

                return;
            }


            /*
             * CHECK LONGITUDE
             */

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
                    "💾 Compressing & Saving...";


                /*
                 * Compress image
                 */

                const compressedImage =
                    await compressImage(
                        currentImage,
                        800,
                        0.60
                    );


                /*
                 * Create record
                 */

                const record = {

                    id:
                        Date.now(),

                    image:
                        compressedImage,

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

                    notes:
                        notesInput
                            ? notesInput.value.trim()
                            : "",

                    timestamp:
                        new Date().toISOString()

                };


                /*
                 * Get existing records
                 */

                const records =
                    getSavedRecords();


                records.push(
                    record
                );


                /*
                 * Save to browser
                 */

                localStorage.setItem(
                    "mosquiscanRecords",
                    JSON.stringify(
                        records
                    )
                );


                /*
                 * Success message
                 */

                if (saveMessage) {

                    saveMessage.textContent =
                        "✓ Inspection saved successfully!";

                    saveMessage.style.color =
                        "#16a34a";

                }


                /*
                 * Update interface
                 */

                updateDashboard();

                displayRecords();

                displayMapMarkers();


                /*
                 * Reset current inspection
                 */

                currentImage =
                    null;

                currentAIResult =
                    "";


                if (imageInput) {

                    imageInput.value =
                        "";

                }


                if (imagePreview) {

                    imagePreview.src =
                        "";

                    imagePreview.style.display =
                        "none";

                }


                if (previewPlaceholder) {

                    previewPlaceholder.style.display =
                        "block";

                }


                if (aiResult) {

                    aiResult.textContent =
                        "AI model ready. Upload an image.";

                    aiResult.className =
                        "result-box";

                }


                if (notesInput) {

                    notesInput.value =
                        "";

                }


                alert(
                    "Inspection saved successfully!"
                );

            }


            catch (error) {

                console.error(
                    "SAVE ERROR:",
                    error
                );


                if (
                    error.name ===
                    "QuotaExceededError"
                ) {

                    alert(
                        "Browser storage is full. Please clear some old records."
                    );

                }

                else {

                    alert(
                        "The inspection could not be saved."
                    );

                }

            }


            saveButton.disabled =
                false;

            saveButton.textContent =
                "💾 Save Inspection";

        }
    );

}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    const records =
        getSavedRecords();


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
            records.length;

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


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   DISPLAY RECORDS
========================================================= */

function displayRecords() {

    if (!recordsList) {
        return;
    }


    const records =
        getSavedRecords();


    recordsList.innerHTML =
        "";


    if (
        records.length === 0
    ) {

        recordsList.innerHTML =
            `
            <div class="no-records">

                <div class="empty-icon">
                    📂
                </div>

                <h3>
                    No inspection records yet
                </h3>

                <p>
                    Saved inspections will appear here.
                </p>

            </div>
            `;

        return;
    }


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


            const isPossible =
                record.result ===
                "Possible Breeding Site";


            const resultClass =
                isPossible
                    ? "result-possible"
                    : "result-not-possible";


            const safeResult =
                escapeHTML(
                    record.result
                );


            const safeLatitude =
                escapeHTML(
                    record.latitude
                );


            const safeLongitude =
                escapeHTML(
                    record.longitude
                );


            const safeDate =
                escapeHTML(
                    record.date || "N/A"
                );


            const safeNotes =
                escapeHTML(
                    record.notes || "None"
                );


            item.innerHTML =
                `
                <div class="record-image">

                    <img
                        src="${record.image}"
                        alt="MosquiScan inspection image"
                    >

                </div>


                <div class="record-info">

                    <h3
                        class="${resultClass}"
                    >
                        ${safeResult}
                    </h3>


                    <p>
                        <strong>
                            Latitude:
                        </strong>

                        ${safeLatitude}
                    </p>


                    <p>
                        <strong>
                            Longitude:
                        </strong>

                        ${safeLongitude}
                    </p>


                    <p>
                        <strong>
                            Date:
                        </strong>

                        ${safeDate}
                    </p>


                    <p>
                        <strong>
                            Notes:
                        </strong>

                        ${safeNotes}
                    </p>

                </div>
                `;


            recordsList.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   MAP MARKERS
========================================================= */

function displayMapMarkers() {

    if (!map) {
        return;
    }


    const records =
        getSavedRecords();


    /*
     * Remove old inspection markers
     */

    map.eachLayer(
        function (layer) {

            if (
                layer instanceof
                L.CircleMarker
            ) {

                map.removeLayer(
                    layer
                );

            }

        }
    );


    /*
     * Add saved records
     */

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


            const markerColor =
                isPossible
                    ? "#dc2626"
                    : "#16a34a";


            const marker =
                L.circleMarker(
                    [lat, lng],
                    {

                        radius: 9,

                        color:
                            markerColor,

                        fillColor:
                            markerColor,

                        fillOpacity:
                            0.8,

                        weight: 2

                    }
                ).addTo(map);


            const popupImage =
                record.image
                    ?
                    `
                    <img
                        src="${record.image}"
                        alt="Inspection image"
                        style="
                            width:160px;
                            height:100px;
                            object-fit:cover;
                            border-radius:8px;
                            display:block;
                            margin:0 auto 10px;
                        "
                    >
                    `
                    :
                    "";


            marker.bindPopup(
                `
                <div
                    style="
                        text-align:center;
                        min-width:180px;
                    "
                >

                    ${popupImage}


                    <strong>
                        ${escapeHTML(
                            record.result
                        )}
                    </strong>


                    <br><br>


                    Latitude:
                    ${escapeHTML(
                        record.latitude
                    )}


                    <br>


                    Longitude:
                    ${escapeHTML(
                        record.longitude
                    )}


                    <br>


                    Date:
                    ${escapeHTML(
                        record.date || "N/A"
                    )}

                </div>
                `
            );

        }
    );

}


/* =========================================================
   CLEAR RECORDS
========================================================= */

function initializeClearButton() {

    if (!clearRecordsButton) {
        return;
    }


    clearRecordsButton.addEventListener(
        "click",
        function () {

            const records =
                getSavedRecords();


            if (
                records.length === 0
            ) {

                alert(
                    "There are no records to delete."
                );

                return;
            }


            const confirmed =
                confirm(
                    "Are you sure you want to delete ALL MosquiScan records?"
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
                "All MosquiScan records have been deleted."
            );

        }
    );

}


/* =========================================================
   INITIALIZE MOSQUISCAN
========================================================= */

async function initializeMosquiScan() {

    console.log(
        "================================"
    );

    console.log(
        "🦟 MOSQUISCAN STARTING..."
    );

    console.log(
        "================================"
    );


    setDefaultDate();


    initializeMap();


    initializeImageUpload();


    initializeAnalysis();


    initializeLocationButton();


    initializeSaveButton();


    initializeClearButton();


    updateDashboard();


    displayRecords();


    displayMapMarkers();


    await loadAIModel();


    console.log(
        "🦟 MosquiScan is ready!"
    );

}


/* =========================================================
   START
========================================================= */

initializeMosquiScan();
