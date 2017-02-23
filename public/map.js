var directionDisplay;
var directionsService = new google.maps.DirectionsService();
var map;
var polyline = null;
var infowindow = new google.maps.InfoWindow();

function createMarker(latlng, label, html) {
  var contentString = '<b>'+label+'</b><br>'+html;
  var marker = new google.maps.Marker({
      position: latlng,
      map: map,
      animation: google.maps.Animation.BOUNCE,
      title: label,
      zIndex: Math.round(latlng.lat()*-100000)<<5
      });
      marker.myname = label;

  google.maps.event.addListener(marker, 'click', function() {
      infowindow.setContent(contentString+"<br>"+marker.getPosition().toUrlValue(6));
      infowindow.open(map,marker);
      });
  return marker;
}

function mapItLikeItsHot(lat, lng) {
  directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers:true});
  var halfway = new google.maps.LatLng(lat, lng);
  var myOptions = {
    zoom: 8,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    center: halfway
  }
  map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
  polyline = new google.maps.Polyline({
    path: [],
    strokeColor: '#FF0000',
    strokeWeight: 3
  });
  directionsDisplay.setMap(map);
}

function calcRoute(start_lat, start_lng, end_lat, end_lng) {
  var start = new google.maps.LatLng(start_lat, start_lng);
  var end = new google.maps.LatLng(end_lat, end_lng);
  var travelMode = google.maps.DirectionsTravelMode.DRIVING

  var request = {
      origin: start,
      destination: end,
      travelMode: travelMode
  };
  directionsService.route(request, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      polyline.setPath([]);
      var bounds = new google.maps.LatLngBounds();
      startLocation = new Object();
      endLocation = new Object();
      directionsDisplay.setDirections(response);
      var route = response.routes[0];
      // For each route, display summary information.
      var path = response.routes[0].overview_path;
      var legs = response.routes[0].legs;
      for (i=0;i<legs.length;i++) {
        if (i == 0) {
          startLocation.latlng = legs[i].start_location;
          startLocation.address = legs[i].start_address;
          marker = createMarker(legs[i].start_location," Searched places 500 meters around this fair...midpoint... :-) ","","green");
        }
        endLocation.latlng = legs[i].end_location;
        endLocation.address = legs[i].end_address;
        var steps = legs[i].steps;
        for (j=0;j<steps.length;j++) {
          var nextSegment = steps[j].path;
          for (k=0;k<nextSegment.length;k++) {
            polyline.getPath().push(nextSegment[k]);
            bounds.extend(nextSegment[k]);
          }
        }
      }

      polyline.setMap(map);

      computeTotalDistance(response);
    } else {
      alert("directions response "+status);
    }
  });
}

var totalDist = 0;
var totalTime = 0;

function computeTotalDistance(result) {
  totalDist = 0;
  totalTime = 0;
  var myroute = result.routes[0];
  for (i = 0; i < myroute.legs.length; i++) {
    totalDist += myroute.legs[i].distance.value;
    totalTime += myroute.legs[i].duration.value;
  }
  putMarkerOnRoute(50);

  totalDist = totalDist / 1000.
  return totalDist;
}

function putMarkerOnRoute(percentage) {
  var distance = (percentage/100) * totalDist;
  var time = ((percentage/100) * totalTime/60).toFixed(2);
  if (!marker) {
    marker = createMarker(polyline.GetPointAtDistance(distance),"time: "+time,"marker");
  } else {
    marker.setPosition(polyline.GetPointAtDistance(distance));
    marker.setTitle("time:"+time);
  }
}
