$(document).ready(function(){

  if($("#googlemaps").length > 0) {
    var latLng = new google.maps.LatLng(14.5747264,121.0489297);
    var center = new google.maps.LatLng(14.577417, 121.052320);
    var mapOptions = {
        zoom: 16, // initialize zoom level - the max value is 21
        streetViewControl: false, // hide the yellow Street View pegman
        scaleControl: false, // allow users to zoom the Google Map
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        center: center
    };

    map = new google.maps.Map(document.getElementById('googlemaps'), mapOptions);

    // Show the default red marker at the location
    marker = new google.maps.Marker({
        position: latLng,
        map: map,
        draggable: false,
        animation: google.maps.Animation.BOUNCE
    });
  }


  $(".location-select").select2({
      placeholder: "Select a place...",
      allowClear: true,
      minimumInputLength: 1,
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
});

