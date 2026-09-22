/* =====================================================
   MOSQUISCAN
   Main JavaScript
   ===================================================== */


/* =====================================================
   TEACHABLE MACHINE MODEL
   ===================================================== */

const MODEL_URL =
    "https://teachablemachine.withgoogle.com/models/cKLAix4wn/";

let model = null;

let maxPredictions = 0;



/* =====================================================
   DOM ELEMENTS
   ===================================================== */

const imageInput =
    document.getElementById("imageInput");

const imagePreview =
    document.getElementById("imagePreview");

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



/* =====================================================
   DASHBOARD ELEMENTS
   ===================================================== */

const totalRecords =
    document.getElementById("totalRecords");

const possibleSites =
    document.getElementById("possibleSites");

const notPossibleSites =
    document.getElementById("notPossibleSites");



/* =====================================================
   VARIABLES
   ===================================================== */

let currentImageData = null;

let currentAIResult = null;

let temporaryMarker = null;

let records = [];



/* =====================================================
   DEFAULT DATE
   ===================================================== */

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



/* =====================================================
   MAP
   ===================================================== */

const map =
    L.map("map").setView(
        [9.75, 124.45],
        10
    );


L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,

        attribution:
            '&copy; OpenStreetMap contributors'
    }
).addTo(map);



/* =====================================================
   LOAD TEACHABLE MACHINE MODEL
   ===================================================== */

async function loadAIModel() {

    try {

        aiResult.textContent =
            "AI Result: Loading trained model...";

        aiResult.className =
            "result-box result-loading";


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
            "MosquiScan AI Model Loaded"
        );


        console.log(
            "Number of classes:",
            maxPredictions
        );


        aiResult.textContent =
            "AI Result: Model ready. Upload a drone image.";

        aiResult.className =
            "result-box";


    } catch (error) {

        console.error(
            "AI Model Loading Error:",
            error
        );


        aiResult.textContent =
            "AI Result: Unable to load AI model.";

        aiResult.className =
            "result-box result-possible";

    }

}



/* =====================================================
   IMAGE UPLOAD
   ===================================================== */

imageInput.addEventListener(
    "change",
    function (event) {

        const file =
            event.target.files[0];


        if (!file) {

            return;

        }


        if (!file.type.startsWith("image/")) {

            alert(
                "Please upload an image file."
            );

            return;

        }


        const reader =
            new FileReader();


        reader.onload =
            function (e) {

                currentImageData =
                    e.target.result;


                imagePreview.src =
                    currentImageData;


                imagePreview.style.display =
                    "block";


                currentAIResult =
                    null;


                aiResult.textContent =
                    "AI Result: Image ready for analysis.";

                aiResult.className =
                    "result-box";


            };


        reader.readAsDataURL(file);

    }
);



/* =====================================================
   AI ANALYSIS
   ===================================================== */

analyzeButton.addEventListener(
    "click",
    async function () {


        /* =========================
           CHECK IMAGE
        ========================= */

        if (!currentImageData) {

            alert(
                "Please upload a drone image first."
            );

            return;

        }


        /* =========================
           CHECK MODEL
        ========================= */

        if (!model) {

            alert(
                "The AI model is still loading. Please wait a moment and try again."
            );

            return;

        }


        /* =========================
           LOADING
        ========================= */

        analyzeButton.disabled =
            true;


        analyzeButton.textContent =
            "⏳ Analyzing...";


        aiResult.textContent =
            "AI Result: Analyzing image...";


        aiResult.className =
            "result-box result-loading";


        try {


            /* =========================
               PREDICT IMAGE
            ========================= */

            const prediction =
                await model.predict(
                    imagePreview
                );


            let highestProbability =
                0;

            let predictedClass =
                "";


            for (
                let i = 0;
                i < prediction.length;
                i++
            ) {


                console.log(
                    prediction[i].className,
                    prediction[i].probability
                );


                if (
                    prediction[i].probability >
                    highestProbability
                ) {

                    highestProbability =
                        prediction[i].probability;

                    predictedClass =
                        prediction[i].className;

                }

            }


            console.log(
                "Predicted class:",
                predictedClass
            );


            console.log(
                "Confidence:",
                highestProbability
            );



            /* =========================
               CLASSIFICATION
            ========================= */

            const normalizedClass =
                predictedClass
                    .toLowerCase()
                    .trim();


            /*
             * The internal MosquiScan result names
             * remain consistent with the dashboard
             * and map.
             */


            if (
                normalizedClass.includes(
                    "possible"
                )
            ) {

                currentAIResult =
                    "Possible Breeding Site";


                aiResult.innerHTML =
                    "🔴 AI Result: <strong>Possible Breeding Site</strong><br>" +
                    "Confidence: " +
                    (
                        highestProbability * 100
                    ).toFixed(2) +
                    "%";


                aiResult.className =
                    "result-box result-possible";


            } else {

                currentAIResult =
                    "Not a Possible Breeding Site";


                aiResult.innerHTML =
                    "🟢 AI Result: <strong>Not a Possible Breeding Site</strong><br>" +
                    "Confidence: " +
                    (
                        highestProbability * 100
                    ).toFixed(2) +
                    "%";


                aiResult.className =
                    "result-box result-not-possible";

            }


        } catch (error) {


            console.error(
                "AI analysis error:",
                error
            );


            currentAIResult =
                null;


            aiResult.textContent =
                "AI Result: Analysis failed.";


            aiResult.className =
                "result-box result-possible";


            alert(
                "Unable to analyze the image. Please try again."
            );

        }


        analyzeButton.disabled =
            false;


        analyzeButton.textContent =
            "🔍 Analyze Image";

    }
);



/* =====================================================
   MAP CLICK
   ===================================================== */

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


        if (temporaryMarker) {

            map.removeLayer(
                temporaryMarker
            );

        }


        temporaryMarker =
            L.marker(
                [
                    event.latlng.lat,
                    event.latlng.lng
                ]
            )
            .addTo(map);


        temporaryMarker
            .bindPopup(
                "Selected Inspection Location"
            )
            .openPopup();

    }
);



/* =====================================================
   CURRENT LOCATION
   ===================================================== */

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
            "📍 Getting Location...";


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


                if (temporaryMarker) {

                    map.removeLayer(
                        temporaryMarker
                    );

                }


                temporaryMarker =
                    L.marker(
                        [
                            latitude,
                            longitude
                        ]
                    )
                    .addTo(map);


                temporaryMarker
                    .bindPopup(
                        "Current Location"
                    )
                    .openPopup();


                locationButton.disabled =
                    false;


                locationButton.textContent =
                    "📍 Use My Current Location";

            },


            function (error) {

                console.error(
                    error
                );


                alert(
                    "Unable to get your current location. Please select the location manually on the map."
                );


                locationButton.disabled =
                    false;


                locationButton.textContent =
                    "📍 Use My Current Location";

            }

        );

    }
);



/* =====================================================
   SAVE INSPECTION
   ===================================================== */

saveButton.addEventListener(
    "click",
    function () {


        /* =========================
           VALIDATION
        ========================= */

        if (!currentImageData) {

            alert(
                "Please upload a drone image."
            );

            return;

        }


        if (!currentAIResult) {

            alert(
                "Please analyze the image first."
            );

            return;

        }


        if (
            latitudeInput.value.trim() ===
            "" ||
            longitudeInput.value.trim() ===
            ""
        ) {

            alert(
                "Please select an inspection location."
            );

            return;

        }


        if (
            inspectionDate.value ===
            ""
        ) {

            alert(
                "Please select the inspection date."
            );

            return;

        }



        /* =========================
           CREATE RECORD
        ========================= */

        const record = {

            id:
                Date.now(),

            image:
                currentImageData,

            result:
                currentAIResult,

            latitude:
                latitudeInput.value.trim(),

            longitude:
                longitudeInput.value.trim(),

            date:
                inspectionDate.value,

            timestamp:
                new Date().toISOString(),

            notes:
                notesInput.value.trim()

        };



        /* =========================
           SAVE TO ARRAY
        ========================= */

        records.push(
            record
        );



        /* =========================
           SAVE TO LOCAL STORAGE
        ========================= */

        localStorage.setItem(
            "mosquiscanRecords",
            JSON.stringify(records)
        );



        /* =========================
           UPDATE INTERFACE
        ========================= */

        updateDashboard();

        displayRecords();

        addPermanentMarker(
            record
        );



        /* =========================
           SUCCESS MESSAGE
        ========================= */

        saveMessage.textContent =
            "✓ Inspection saved successfully.";


        setTimeout(
            function () {

                saveMessage.textContent =
                    "";

            },
            3000
        );



        /* =========================
           RESET
        ========================= */

        currentImageData =
            null;

        currentAIResult =
            null;


        imageInput.value =
            "";


        imagePreview.src =
            "";

        imagePreview.style.display =
            "none";


        aiResult.textContent =
            "AI Result: Waiting for image.";

        aiResult.className =
            "result-box";


        notesInput.value =
            "";

    }
);



/* =====================================================
   UPDATE DASHBOARD
   ===================================================== */

function updateDashboard() {


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



    totalRecords.textContent =
        total;


    possibleSites.textContent =
        possible;


    notPossibleSites.textContent =
        notPossible;

}



/* =====================================================
   DISPLAY RECORDS
   ===================================================== */

function displayRecords() {


    if (
        records.length ===
        0
    ) {

        recordsList.innerHTML =

            `
            <p class="empty-message">
                No inspection records yet.
            </p>
            `;

        return;

    }


    recordsList.innerHTML =
        "";



    const sortedRecords =
        [...records].reverse();



    sortedRecords.forEach(
        function (record) {


            const recordElement =
                document.createElement(
                    "div"
                );


            recordElement.className =
                "record";


            const resultClass =
                record.result ===
                "Possible Breeding Site"

                    ? "possible-text"

                    : "not-possible-text";



            recordElement.innerHTML =

                `
                <img
                    src="${record.image}"
                    alt="Inspection Image"
                >

                <h3>
                    Inspection Record
                </h3>

                <p>
                    <strong>AI Result:</strong>
                    <span class="${resultClass}">
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
                    <strong>Notes:</strong>
                    ${
                        record.notes ||
                        "No notes provided."
                    }
                </p>
                `;


            recordsList.appendChild(
                recordElement
            );

        }
    );

}



/* =====================================================
   PERMANENT MAP MARKER
   ===================================================== */

function addPermanentMarker(
    record
) {


    const latitude =
        parseFloat(
            record.latitude
        );


    const longitude =
        parseFloat(
            record.longitude
        );


    if (
        isNaN(latitude) ||
        isNaN(longitude)
    ) {

        return;

    }



    let markerColor =
        "#16a34a";


    if (
        record.result ===
        "Possible Breeding Site"
    ) {

        markerColor =
            "#e53935";

    }



    const markerIcon =
        L.divIcon({

            className:
                "custom-marker",

            html:
                `
                <div
                    style="
                        background:${markerColor};
                        width:20px;
                        height:20px;
                        border-radius:50%;
                        border:3px solid white;
                        box-shadow:0 2px 6px rgba(0,0,0,0.35);
                    ">
                </div>
                `,

            iconSize:
                [20, 20],

            iconAnchor:
                [10, 10]

        });



    const marker =
        L.marker(
            [
                latitude,
                longitude
            ],
            {
                icon:
                    markerIcon
            }
        )
        .addTo(map);



    const popupImage =
        record.image
            ? `
                <img
                    src="${record.image}"
                    alt="Inspection Image"
                >
              `
            : "";



    marker.bindPopup(

        `
        <div class="map-popup">

            <h3>
                MosquiScan Inspection
            </h3>

            ${popupImage}

            <p>
                <strong>Result:</strong>
                ${record.result}
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
                ${
                    record.notes ||
                    "No notes."
                }
            </p>

        </div>
        `

    );

}



/* =====================================================
   LOAD SAVED RECORDS
   ===================================================== */

function loadSavedRecords() {


    const savedRecords =
        localStorage.getItem(
            "mosquiscanRecords"
        );


    if (!savedRecords) {

        records = [];

        updateDashboard();

        displayRecords();

        return;

    }


    try {

        records =
            JSON.parse(
                savedRecords
            );


        if (
            !Array.isArray(records)
        ) {

            records = [];

        }

    } catch (error) {

        console.error(
            "Unable to load saved records:",
            error
        );


        records = [];

    }



    updateDashboard();

    displayRecords();



    /* =========================
       RESTORE MAP MARKERS
    ========================= */

    records.forEach(
        function (record) {

            addPermanentMarker(
                record
            );

        }
    );

}



/* =====================================================
   START MOSQUISCAN
   ===================================================== */

loadAIModel();

loadSavedRecords();
