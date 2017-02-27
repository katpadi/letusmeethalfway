var geocoder = new google.maps.Geocoder;
var directionDisplay;
var directionsService = new google.maps.DirectionsService();
var map;
var polyline = null;
var infowindow = new google.maps.InfoWindow();
var initMarker;
var pointMarkers = {};
$(document).ready(function(){

  if($("#googlemaps").length > 0) {
    initialize();
  }

  $(".location-select").select2({
      placeholder: "Select a place...",
      allowClear: true,
      minimumInputLength: 1,
      triggerChange: true,
      ajax: {
          url: window.location.origin + "/autocomplete.json",
          dataType: 'json',
          delay: 500,
          data: function (params) {
              return {
                  term: params.term
              };
          },
          processResults: function (data) {
            return {
                results: $.map(data, function (item) {
                    return {
                        text: item.description,
                        id: item.place_id,
                    }
                })
            };
          }
      },
  }).on('change', function(e) {
    var placeId = this.value;
    var selectorId = this.id;
    var infoWindow = new google.maps.InfoWindow();
    var service = new google.maps.places.PlacesService(map);
    var dirDisplay = new google.maps.DirectionsRenderer();
    var bounds = new google.maps.LatLngBounds();

    removeMarkerWithAnimation(map, initMarker);

    service.getDetails({
      placeId: placeId
    }, function(result, status) {
      if (status != google.maps.places.PlacesServiceStatus.OK) {
        alert(status);
        return;
      }

      if (pointMarkers.hasOwnProperty(selectorId)) {
        removeMarkerWithAnimation(map, pointMarkers[selectorId])
      }

      var marker = new google.maps.Marker({
        map: map,
        icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
        animation: google.maps.Animation.DROP,
        position: result.geometry.location
      });

      infoWindow.setContent(result.name);
      infoWindow.open(map, marker);
      pointMarkers[selectorId] = marker;

      for (var key in pointMarkers) {
        bounds.extend(pointMarkers[key].position);
      }

      if (Object.keys(pointMarkers).length == 2) {
        //now fit the map to the newly inclusive bounds
        map.fitBounds(bounds);

        // get route from A to B
        getDirections(pointMarkers['place1'], pointMarkers['place2'])

      }
    });
  });

  $("#spot-button").click(function(event) {
      event.preventDefault();

      // Get form values submitted
      var placeId1 = $("#place1").val();
      var placeId2 = $("#place2").val();
      var coords1 = $.Deferred();
      var coords2 = $.Deferred();

      geocodePlaceIdX(geocoder, placeId1, function(results, status){
        coords1.resolve(results[0].geometry.location);
      });
      geocodePlaceIdX(geocoder, placeId2, function(results, status){
        coords2.resolve(results[0].geometry.location);
      });

      $.when(coords1, coords2).done(function(start, end){
        $(".spot-form").fadeOut('slow', 0);
        $(".spot-form").promise().done(function(){
            // will be called when all the animations on the queue finish
            calcRoute(start, end, function(halfway) {
            $("#midPointLat").val(halfway.lat());
            $("#midPointLng").val(halfway.lng());
            $("form#places-form").submit();
          });
        });

      });
  });
});

function getDirections(origin, destination) {
    directionsDisplay.setMap(map);
    var request = {
        origin: origin.position,
        destination: destination.position,
        travelMode: google.maps.TravelMode.DRIVING
    };
    directionsService.route(request, function (result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(result);
        }
    });
}

function plotEmSpots(s) {
  var marker, i;

  for (i = 0; i < s.length; i++) {
    marker = new google.maps.Marker({
      position: new google.maps.LatLng(s[i].lat, s[i].lng),
      icon: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
      title: s[i].name,
      animation: google.maps.Animation.DROP,
      map: map
    });
    marker.myname = s[i].name;
    var infoWindow = new google.maps.InfoWindow();
    var content = '<b>'+s[i].name+'</b><br></b><br>'+"Let's meet here?";
    google.maps.event.addListener(marker,'click', (function(marker,content,infowindow){
        return function() {
            infoWindow.setContent(content);
            infoWindow.open(map,marker);
        };
    })(marker,content,infoWindow));
  }
}


function mapItLikeItsHot(lat, lng, s) {
  directionsDisplay = new google.maps.DirectionsRenderer();
  var halfway = new google.maps.LatLng(lat, lng);
  var myOptions = {
    zoom: 22,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    center: halfway
  }
  map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
  polyline = new google.maps.Polyline({
    path: [],
    strokeColor: '#8b0000',
    strokeWeight: 3
  });
  directionsDisplay.setMap(map);

  plotEmSpots(s)
}

function geocodePlaceIdX(geocoder, placeId, callback) {
  geocoder.geocode({'placeId': placeId}, function(results, status) {
    if (status === 'OK') {
      callback(results, status);
    } else {
      window.alert('Geocoder failed due to: ' + status);
    }
  });
}
function createMarker(latlng, label, html) {
    var contentString = '<b>'+label+'</b><br>'+html;
    var marker = new google.maps.Marker({
          position: latlng,
          map: map,
          icon: 'http://maps.google.com/mapfiles/ms/icons/red-pushpin.png',
          title: label,
          animation: google.maps.Animation.BOUNCE,
          zIndex: Math.round(latlng.lat()*-100000)<<5
        });
        marker.myname = label;

    google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent(contentString+"<br>"+marker.getPosition().toUrlValue(6));
        infowindow.open(map,marker);
    });
    return marker;
}

function removeMarkerWithAnimation(map, marker){
    var markerExists = map.getBounds().contains(marker.getPosition());
      if (markerExists) {
        (function animationStep(){
            //Converting GPS to World Coordinates
            var newPosition = map.getProjection().fromLatLngToPoint(marker.getPosition());

            //Moving 10px to up
            newPosition.y -= 20 / (1 << map.getZoom());

            //Converting World Coordinates to GPS
            newPosition = map.getProjection().fromPointToLatLng(newPosition);
            //updating maker's position
            marker.setPosition( newPosition );
            //Checking whether marker is out of bounds
            if( map.getBounds().getNorthEast().lat() < newPosition.lat() ){
                marker.setMap(null);
            }else{
                //Repeating animation step
                setTimeout(animationStep,20);
            }
        })();
      }
}

function initialize() {
  directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers:true});
  var latLng = new google.maps.LatLng(14.5751172,121.0496216);
  var center = new google.maps.LatLng(14.5741938,121.0414212);
  var myOptions = {
    zoom: 14, // initialize zoom level - the max value is 21
    streetViewControl: false, // hide the yellow Street View pegman
    scaleControl: false, // allow users to zoom the Google Map
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    center: center
  }
  map = new google.maps.Map(document.getElementById("googlemaps"), myOptions);

  // Show the default red marker at the location
  initMarker = new google.maps.Marker({
      position: latLng,
      zoom: 16,
      map: map,
      draggable: false,
      animation: google.maps.Animation.BOUNCE
  });

  polyline = new google.maps.Polyline({
    path: [],
    strokeColor: '#FF0000',
    strokeWeight: 3
  });
  directionsDisplay.setMap(map);

}

function calcRoute(start, end, callback) {
  // var start = new google.maps.LatLng(14.575423, 121.051771);
  // var end = new google.maps.LatLng(14.570286, 121.047089);
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
          marker = createMarker(legs[i].start_location,"So, this is the actual midpoint.<br>I searched places within 500-meter radius from here.","","green");
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

      computeTotalDistance(response, function(x) {callback(x)});
    } else {
      alert("directions response "+status);
    }
  });
}

var totalDist = 0;
var totalTime = 0;
function computeTotalDistance(result, callback) {
  totalDist = 0;
  totalTime = 0;
  var myroute = result.routes[0];
  for (i = 0; i < myroute.legs.length; i++) {
    totalDist += myroute.legs[i].distance.value;
    totalTime += myroute.legs[i].duration.value;
  }
  halfway = polyline.GetPointAtDistance((50/100) * totalDist);
  callback(halfway);

  putMarkerOnRoute(50);
  // Add circle overlay and bind to marker
  var circle = new google.maps.Circle({
    map: map,
    radius: 500,
    fillColor: '#AA0000'
  });
  circle.bindTo('center', marker, 'position');

  // alert("total distance is: "+ totalDist + " km<br>total time is: " + (totalTime / 60).toFixed(2) + " minutes");
// document.getElementById("total").innerHTML = "total distance is: "+ totalDist + " km<br>total time is: " + (totalTime / 60).toFixed(2) + " minutes";
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
