$(document).ready(function(){
  $('.map')
    .gmap3({
      center:[48.8620722, 2.352047],
      zoom:4
    })
    .marker([
      {position:[48.8620722, 2.352047]},
      {address:"86000 Poitiers, France"},
      {address:"66000 Perpignan, France", icon: "http://maps.google.com/mapfiles/marker_grey.png"}
    ])
    .on('click', function (marker) {
      marker.setIcon('http://maps.google.com/mapfiles/marker_green.png');
    });

});

