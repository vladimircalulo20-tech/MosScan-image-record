// =====================================================
// MOSQUISCAN
// Drone-Assisted AI Inspection and Geospatial Mapping
// =====================================================


// =====================================================
// ELEMENTS
// =====================================================

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


// =====================================================
// VARIABLES
// =====================================================

let selectedImage = null;

let selectedImageData = null;

let currentAIResult = "";

let selectedMarker = null;


// =====================================================
// DEFAULT DATE
// =====================================================

const today =
  new Date().toISOString().split("T")[0];

inspectionDate.value = today;


// =====================================================
// INITIALIZE MAP
// =====================================================

// Default location: Philippines

const map =
  L.map("map").setView(
    [12.8797, 121.7740],
    6
  );


// OpenStreetMap

L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {

    attribution:
      "&copy; OpenStreetMap contributors"

  }
).addTo(map);


// =====================================================
// IMAGE UPLOAD
// =====================================================

imageInput.addEventListener(
  "change",
  function () {

    const file =
      imageInput.files[0];

    if (!file) {
      return;
    }


    selectedImage = file;


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


        aiResult.textContent =
          "AI Result: Ready for analysis";


        aiResult.className =
          "result-box";

      };


    reader.readAsDataURL(file);

  }
);


// =====================================================
// TEMPORARY AI CLASSIFICATION
// =====================================================

// NOTE:
// This is only a temporary demonstration.
// We will replace this with your actual
// Teachable Machine model.

analyzeButton.addEventListener(
  "click",
  function () {


    if (!selectedImage) {

      alert(
        "Please upload an image first."
      );

      return;
    }


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


    if (
      currentAIResult ===
      "Possible Breeding Site"
    ) {

      aiResult.textContent =
        "AI Result: 🔴 Possible Breeding Site";

      aiResult.className =
        "result-box result-possible";

    }

    else {

      aiResult.textContent =
        "AI Result: 🟢 Not a Possible Breeding Site";

      aiResult.className =
        "result-box result-not-possible";

    }

  }
);


// =====================================================
// CLICK MAP TO SELECT LOCATION
// =====================================================

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


    // Remove previous temporary marker

    if (selectedMarker) {

      map.removeLayer(
        selectedMarker
      );

    }


    // Create selected location marker

    selectedMarker =
      L.marker(
        [
          latitude,
          longitude
        ]
      )
      .addTo(map)
      .bindPopup(
        `
        <b>Selected Inspection Location</b>
        <br><br>

        Latitude:
        ${latitude}

        <br>

        Longitude:
        ${longitude}
        `
      )
      .openPopup();

  }
);


// =====================================================
// SMARTPHONE GPS
// =====================================================

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
          position.coords.latitude
          .toFixed(6);


        const longitude =
          position.coords.longitude
          .toFixed(6);


        latitudeInput.value =
          latitude;


        longitudeInput.value =
          longitude;


        // Move map

        map.setView(
          [
            latitude,
            longitude
          ],
          17
        );


        // Remove previous temporary marker

        if (selectedMarker) {

          map.removeLayer(
            selectedMarker
          );

        }


        // Add GPS marker

        selectedMarker =
          L.marker(
            [
              latitude,
              longitude
            ]
          )
          .addTo(map)
          .bindPopup(
            `
            <b>Current Smartphone Location</b>

            <br><br>

            Latitude:
            ${latitude}

            <br>

            Longitude:
            ${longitude}
            `
          )
          .openPopup();

      },


      function () {

        alert(
          "Unable to get your location. Please enable location permission."
        );

      }

    );

  }
);


// =====================================================
// SAVE INSPECTION
// =====================================================

saveButton.addEventListener(
  "click",
  function () {


    // Check image

    if (!selectedImageData) {

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


    // Check location

    if (
      !latitudeInput.value ||
      !longitudeInput.value
    ) {

      alert(
        "Please select a location on the map."
      );

      return;
    }


    // Create inspection ID

    const records =
      JSON.parse(
        localStorage.getItem(
          "mosquiscanRecords"
        ) || "[]"
      );


    const inspectionNumber =
      records.length + 1;


    const inspectionID =
      "MS-" +
      String(
        inspectionNumber
      ).padStart(4, "0");


    // Create timestamp

    const timestamp =
      new Date().toLocaleString();


    // Create record

    const record = {

      id: inspectionID,

      image:
        selectedImageData,

      result:
        currentAIResult,

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


    // Save to browser

    localStorage.setItem(
      "mosquiscanRecords",
      JSON.stringify(records)
    );


    // Show message

    saveMessage.textContent =
      "Inspection " +
      inspectionID +
      " saved successfully!";

    saveMessage.style.color =
      "green";


    // Update records

    displayRecords(records);


    // Add map marker

    addPermanentMarker(
      record
    );


    // Reset form

    imageInput.value = "";

    imagePreview.style.display =
      "none";

    selectedImage =
      null;

    selectedImageData =
      null;

    currentAIResult =
      "";


    aiResult.textContent =
      "AI Result: Waiting for image...";


    aiResult.className =
      "result-box";


    notesInput.value =
      "";

  }
);


// =====================================================
// DISPLAY INSPECTION RECORDS
// =====================================================

function displayRecords(
  records
) {


  recordsList.innerHTML =
    "";


  if (
    records.length === 0
  ) {

    recordsList.innerHTML =
      "<p>No inspection records yet.</p>";

    return;
  }


  records
    .slice()
    .reverse()
    .forEach(
      function (
        record
      ) {


        const recordDiv =
          document.createElement(
            "div"
          );


        const isPossible =
          record.result ===
          "Possible Breeding Site";


        recordDiv.className =
          "record " +
          (
            isPossible
              ? "possible"
              : "not-possible"
          );


        recordDiv.innerHTML = `

          <strong>
            ${record.id}
          </strong>

          <br>

          <strong>
            Result:
          </strong>

          ${
            isPossible
              ? "🔴"
              : "🟢"
          }

          ${record.result}

          <br>

          <strong>
            Latitude:
          </strong>

          ${record.latitude}

          <br>

          <strong>
            Longitude:
          </strong>

          ${record.longitude}

          <br>

          <strong>
            Date:
          </strong>

          ${record.date}

          <br>

          <strong>
            Recorded:
          </strong>

          ${record.timestamp}

          <br>

          <strong>
            Notes:
          </strong>

          ${
            record.notes ||
            "No notes"
          }

          <br>

          <img
            src="${record.image}"
            alt="Drone Inspection Image"
          >

        `;


        recordsList.appendChild(
          recordDiv
        );

      }
    );

}


// =====================================================
// ADD PERMANENT MAP MARKER
// =====================================================

function addPermanentMarker(
  record
) {


  const isPossible =
    record.result ===
    "Possible Breeding Site";


  const markerColor =
    isPossible
      ? "red"
      : "green";


  // Popup content INCLUDING PHOTO

  const popupContent = `

    <div class="map-popup">

      <h3>

        ${
          isPossible
            ? "🔴"
            : "🟢"
        }

        ${record.result}

      </h3>


      <img
        src="${record.image}"
        alt="Drone Inspection Image"
      >


      <b>
        Inspection ID:
      </b>

      ${record.id}

      <br>


      <b>
        Latitude:
      </b>

      ${record.latitude}

      <br>


      <b>
        Longitude:
      </b>

      ${record.longitude}

      <br>


      <b>
        Date:
      </b>

      ${record.date}

      <br>


      <b>
        Notes:
      </b>

      ${
        record.notes ||
        "No notes"
      }

    </div>

  `;


  // Create colored map marker

  L.circleMarker(

    [
      parseFloat(
        record.latitude
      ),

      parseFloat(
        record.longitude
      )
    ],

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

  )

  .addTo(map)

  .bindPopup(
    popupContent
  );

}


// =====================================================
// LOAD SAVED RECORDS
// =====================================================

function loadSavedRecords() {


  const records =
    JSON.parse(
      localStorage.getItem(
        "mosquiscanRecords"
      ) || "[]"
    );


  // Display records

  displayRecords(
    records
  );


  // Display map markers

  records.forEach(
    function (
      record
    ) {

      addPermanentMarker(
        record
      );

    }
  );

}


// =====================================================
// START MOSQUISCAN
// =====================================================

loadSavedRecords();
