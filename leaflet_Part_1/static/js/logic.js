// Store our API endpoint as queryUrl.
let queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

// Perform a GET request to the query URL
d3.json(queryUrl).then(function (data) {
  // Once we get a response, send the data.features object to the createFeatures function.
  createFeatures(data.features);
});

function createFeatures(earthquakeData) {
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

  // Send our heatMapLegend and earthquakes layer to the createMap function
  createMap(heatMapLegend, earthquakes);
}

function createMap(heatMapLegend, earthquakes) {
  // Create the base layer.
  let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  // Create the map, giving it the streetmap layer to display on load.
  let myMap = L.map("map", {
    center: [37.0902, -95.7129],
    zoom: 5,
    layers: [street, earthquakes]
  });

  // Add heatMapLegend to the map
  heatMapLegend.addTo(myMap);

  // Add earthquakes layer to the map
  earthquakes.addTo(myMap);
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
