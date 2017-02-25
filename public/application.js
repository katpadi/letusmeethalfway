var geocoder = new google.maps.Geocoder;
var directionDisplay;
var directionsService = new google.maps.DirectionsService();
var map;
var polyline = null;
var infowindow = new google.maps.InfoWindow();
var initMarker;
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
        $(".spot-form").fadeTo( "slow", 0 );
        removeMarkerWithAnimation(map, initMarker);
        calcRoute(start, end, function(halfway) {
          $("#midPointLat").val(halfway.lat());
          $("#midPointLng").val(halfway.lng());
          $("form#places-form").submit();
        });

      });
  });
});

function mapItLikeItsHot(lat, lng) {
  directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers:true});
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
          icon: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
          title: label,
          animation: google.maps.Animation.DROP,
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
    (function animationStep(){
        //Converting GPS to World Coordinates
        var newPosition = map.getProjection().fromLatLngToPoint(marker.getPosition());

        //Moving 10px to up
        newPosition.y -= 10 / (1 << map.getZoom());

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

function initialize() {
  directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers:true});
  var latLng = new google.maps.LatLng(14.5751172,121.0496216);
  var center = new google.maps.LatLng(14.5741938,121.0414212);
  var myOptions = {
    zoom: 16, // initialize zoom level - the max value is 21
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
          marker = createMarker(legs[i].start_location,"midpoint","","green");
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
