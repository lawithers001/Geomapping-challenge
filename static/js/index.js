
let earthquakeURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";

let faultLinesURL = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";



renderMap(earthquakeURL, faultLinesURL);
function renderMap(earthquakeURL, faultLinesURL) {

  d3.json(earthquakeURL, function(data) {
    console.log(earthquakeURL)
   
    
    let earthquakeData = data;
    d3.json(faultLinesURL, function(data) {

      let faultLineData = data;
      createFeatures(earthquakeData, faultLineData);
    });
  });

  function createFeatures(earthquakeData, faultLineData) {

    function onEachQuakeLayer(feature, layer) {
      return new L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], {
        fillOpacity: 1,
        color: chooseColor(feature.properties.mag),
        fillColor: chooseColor(feature.properties.mag),
        radius:  markerSize(feature.properties.mag)
      });
    }
    function onEachEarthquake(feature, layer) {
      layer.bindPopup("<h3>" + feature.properties.place + "</h3><hr><p>" + new Date(feature.properties.time) + "</p><hr><p>Magnitude: " + feature.properties.mag + "</p>");
    }


    function onEachFaultLine(feature, layer) {
      L.polyline(feature.geometry.coordinates);
    }

    let earthquakes = L.geoJSON(earthquakeData, {
      onEachFeature: onEachEarthquake,
      pointToLayer: onEachQuakeLayer
    });

    let faultLines = L.geoJSON(faultLineData, {
      onEachFeature: onEachFaultLine,
      style: {
        weight: 2,
        color: 'blue'
      }
    });

    let timelineLayer = L.timeline(earthquakeData, {
      getInterval: function(feature) {
        return {
          start: feature.properties.time,
          end: feature.properties.time + feature.properties.mag * 10000000
        };
      },
      pointToLayer: onEachQuakeLayer,
      onEachFeature: onEachEarthquake
    });

    createMap(earthquakes, faultLines, timelineLayer);
  }


  function createMap(earthquakes, faultLines, timelineLayer) {

    let outdoors = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/outdoors-v10/tiles/256/{z}/{x}/{y}?" +
        "access_token=pk.eyJ1IjoiZGF2aXNjYXJkd2VsbCIsImEiOiJjamViam4yMHEwZHJ4MnJvN3kweGhkeXViIn0." +
        "A3IKm_S6COZzvBMTqLvukQ");

    let satellite = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?" +
        "access_token=pk.eyJ1IjoiZGF2aXNjYXJkd2VsbCIsImEiOiJjamViam4yMHEwZHJ4MnJvN3kweGhkeXViIn0." +
        "A3IKm_S6COZzvBMTqLvukQ");

    let darkmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?" +
        "access_token=pk.eyJ1IjoiZGF2aXNjYXJkd2VsbCIsImEiOiJjamViam4yMHEwZHJ4MnJvN3kweGhkeXViIn0." +
        "A3IKm_S6COZzvBMTqLvukQ");


    let baseMaps = {
      "Outdoors": outdoors,
      "Satellite": satellite,
      "Dark Map": darkmap,
    };

  
    let overlayMaps = {
      "Earthquakes": earthquakes,
      "Fault Lines": faultLines
    };

    
    let map = L.map("map", {
      center: [39.8283, -98.5785],
      zoom: 3,
      layers: [outdoors, faultLines],
      scrollWheelZoom: false
    });


    L.control.layers(baseMaps, overlayMaps, {
      collapsed: true
    }).addTo(map);


    let legend = L.control({position: 'bottomright'});
    legend.onAdd = function(map) {
      let div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 1, 2, 3, 4, 5],
        labels = ["0-1", "1-2", "2-3", "3-4", "4-5", "5+"];

      for (let i = 0; i < grades.length; i++) {
        div.innerHTML += '<i style="background:' + chooseColor(grades[i] + 1) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
      }

      return div;
    };
    legend.addTo(map);

    let timelineControl = L.timelineSliderControl({
      formatOutput: function(date) {
        return new Date(date).toString();
      }
    });
    timelineControl.addTo(map);
    timelineControl.addTimelines(timelineLayer);
    timelineLayer.addTo(map);
  }
}


function chooseColor(magnitude) {
  return magnitude > 5 ? "red":
    magnitude > 4 ? "orange":
      magnitude > 3 ? "gold":
        magnitude > 2 ? "yellow":
          magnitude > 1 ? "yellowgreen":
            "greenyellow"; // <= 1 default
}

function markerSize(magnitude) {
  return magnitude * 5;
}