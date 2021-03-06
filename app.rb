# app.rb
require "bundler/setup"
require "sinatra"
require 'google_places'

def api_key_lottery
  ['AIzaSyCjv31Tjen7UEZFDDAUapKdBBlyFK5NKhU', 'AIzaSyCul6M_Lg-ESIom6yzNPxsqHvXApidvMLI', 'AIzaSyCmXhxEx6PVkEo96gHlUJPtRrBqkGiG3FI'].sample
end

def organize(places)
  formatted_places = []
  places.each do |place|
    formatted_places << { description: place.description, place_id: place.place_id }
  end
  formatted_places.to_json
end

def spots_json(spots)
  coords = []
  spots.each do |spot|
    coords << { lat: spot.lat, lng: spot.lng, name: spot.name, icon: spot.icon }
  end
  coords.to_json
end

get '/' do
  haml :index
end

get '/autocomplete.json' do
  if params[:term]
    @client = GooglePlaces::Client.new(api_key_lottery)
    @places = @client.predictions_by_input(params[:term])
    @places = organize(@places)
    @places
  end
end

post '/spots' do
  client = GooglePlaces::Client.new(api_key_lottery)
  place1 = client.spot(params['place1'])
  place2 = client.spot(params['place2'])
  lat = params['midPointLat']
  lng = params['midPointLng']
  spots = client.spots(lat, lng, radius: 500, detail: true, types: ['bar','cafe','restaurant','shopping_mall'])
  haml :result, locals: { s: spots_json(spots), spots: spots, point_a: place1, point_b: place2, lat: lat, lng: lng }
end
