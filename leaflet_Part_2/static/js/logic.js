// Store our API endpoint for earthquake data.
let earthquakeUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

// Store the GeoJSON URL for tectonic plates.
let tectonicPlatesUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_steps.json";

// Perform a GET request to the earthquake data URL.
d3.json(earthquakeUrl).then(function (earthquakeData) {
  // Once we get a response, send the data.features object to the createMap function.
  createMap(earthquakeData.features);
});

function createMap(earthquakeData) {
  // Define a function that we want to run once for each feature in the features array.
  // Give each feature a popup that describes the place and time of the earthquake.
  function onEachFeature(feature, layer) {
    layer.bindPopup(`<h3>${feature.properties.title}</h3><hr><p>Magnitude: ${feature.properties.mag}<br>Depth: ${feature.geometry.coordinates[2]}</p>`);
  }

  // Create a GeoJSON layer that contains the features array on the earthquakeData object.
  // Run the onEachFeature function once for each piece of data in the array.
  let earthquakes = L.geoJSON(earthquakeData, {
    onEachFeature: onEachFeature,
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, {
        radius: feature.properties.mag * 5, // Adjust the factor as needed
        fillColor: getColor(feature.geometry.coordinates[2]), // Depth color based on the third coordinate
        color: "black",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      });
    }
  });

  // Create a GeoJSON layer for tectonic plates.
  let tectonicPlates = new L.LayerGroup();

  // Fetch tectonic plates data and add it to the map.
  fetch(tectonicPlatesUrl)
    .then(response => response.json())
    .then(data => {
      L.geoJSON(data, {
        style: {
          color: "orange",
          weight: 2
        }
      }).addTo(tectonicPlates);
    });

  // Create the Mapbox satellite layer.
  let satellite = L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`, {
    attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> contributors, OpenStreetMap'
  });

  // Create the Mapbox grayscale layer.
  let grayscale = L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`, {
    attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> contributors, OpenStreetMap'
  });

  // Create the Mapbox outdoors layer.
  let outdoors = L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/outdoors-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`, {
    attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> contributors, OpenStreetMap'
  });

  // Create the map, giving it the satellite layer to display on load.
  let myMap = L.map("map", {
    center: [37.0902, -95.7129],
    zoom: 5,
    layers: [satellite, earthquakes, tectonicPlates] // Add tectonicPlates as a default layer
  });

  // Add layer control for switching between overlays.
  let overlayMaps = {
    "Tectonic Plates": tectonicPlates,
    "Earthquakes": earthquakes
  };

  let baseMaps = {
    "Satellite": satellite, // Add satellite layer to the base maps
    "Grayscale": grayscale,
    "Outdoors": outdoors
  };

  L.control.layers(baseMaps, overlayMaps).addTo(myMap);

  // Create a heat map-like legend
  let heatMapLegend = L.control({ position: 'bottomright' });

  heatMapLegend.onAdd = function (map) {
    let div = L.DomUtil.create('div', 'info legend');
    let depthCategories = [-10, 10, 30, 50, 70, 90];

    div.style.backgroundColor = 'white';
    div.style.padding = '10px';
    div.style.borderRadius = '5px';

    for (let i = 0; i < depthCategories.length; i++) {
      let start = depthCategories[i];
      let end = depthCategories[i + 1];
      let label = end ? `${start}&ndash;${end}` : `${start}+`;

      div.innerHTML += `<div style="display:flex; align-items:center;">
                        <div style="background:${getColor(start)};width:20px;height:20px;margin-right:5px;"></div>
                        <span>${label}</span>
                      </div>`;
    }

    return div;
  };

  // Add heatMapLegend to the map
  heatMapLegend.addTo(myMap);
}

// Function to get color based on depth
function getColor(depth) {
  return depth > 90 ? '#FF0000' :
    depth > 70 ? '#FF4500' :
      depth > 50 ? '#FF8C00' :
        depth > 30 ? '#FFD700' :
          depth > 10 ? '#ADFF2F' :
            '#00FF00';
}
