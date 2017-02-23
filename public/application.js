$(document).ready(function(){
  $(".location-select").select2({
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
