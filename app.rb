# app.rb
require "bundler/setup"
require "sinatra"
require 'geokit'
require 'google_places'

def api_key_lottery
  ['AIzaSyCLtJtmtmFTFK2nU60mAglHda7tNes3Bfw', 'AIzaSyAtv8Ke-EvwRv50LfZkUsyExN9fP6rVggY', 'AIzaSyCmXhxEx6PVkEo96gHlUJPtRrBqkGiG3FI'].sample
end

def organize(places)
  formatted_places = []
  places.each do |place|
    formatted_places << { description: place.description, place_id: place.place_id }
  end
  formatted_places.to_json
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

post '/find' do
  client = GooglePlaces::Client.new(api_key_lottery)
  place1 = client.spot(params['place1'])
  place2 = client.spot(params['place2'])
  geo1 = Geokit::Geocoders::GoogleGeocoder.geocode(place1.vicinity)
  geo2 = Geokit::Geocoders::GoogleGeocoder.geocode(place2.vicinity)
  halfway = geo1.midpoint_to(geo2)
  spots = client.spots(halfway.lat, halfway.lng, radius: 500, detail: true, types: ['museum','amusement_park','bar','cafe','restaurant','park','shopping_mall','art_gallery'])
  haml :result, locals: { spots: spots, point_a: place1, point_b: place2, lat: halfway.lat, lng: halfway.lng }
end

