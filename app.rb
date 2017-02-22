# app.rb
require "bundler/setup"
require "sinatra"
require 'geokit'
require 'google_places'

API_KEY = ['AIzaSyBQCZh5D8tkwTnFY03tGXc1ftk0_E0hYbQ', 'AIzaSyAbX_t_Y7kRDRPL4qLVH-Yb5qsosq8p3r0', 'AIzaSyCmXhxEx6PVkEo96gHlUJPtRrBqkGiG3FI']

def search_spots(client, point_a, point_b)
  # geocoded_a = Geokit::Geocoders::GoogleGeocoder.geocode(point_a)
  # geocoded_b = Geokit::Geocoders::GoogleGeocoder.geocode(point_b)
  # halfway = geocoded_a.midpoint_to(geocoded_b)
  client.spots(40.1770759802915, -74.231825)
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

get '/map' do
  haml :map
end

get '/autocomplete.json' do
  if params[:term]
    @client = GooglePlaces::Client.new(API_KEY.sample)
    @places = @client.predictions_by_input(params[:term])
    @places = organize(@places)
    @places
  end
end

post '/find' do
  client = GooglePlaces::Client.new(API_KEY.sample)
  place1 = client.spot(params["place"])
  place2 = client.spot(params["place2"])
  puts place1.formatted_address
  spots = search_spots(client, place1.formatted_address, place2.formatted_address)
  haml :result, locals: { spots: spots, point_a: place1, point_b: place2, lat: 40.1770759802915, lng: -74.231825 }
end
