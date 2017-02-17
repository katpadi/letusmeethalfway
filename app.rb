# app.rb
require "bundler/setup"
require "sinatra"
require 'geokit'
require 'google_places'

API_KEY = ['AIzaSyBQCZh5D8tkwTnFY03tGXc1ftk0_E0hYbQ', 'AIzaSyAbX_t_Y7kRDRPL4qLVH-Yb5qsosq8p3r0', 'AIzaSyCmXhxEx6PVkEo96gHlUJPtRrBqkGiG3FI']
def search_spots(point_a, point_b)
  mid = midpoint(point_a, point_b)

  @google_place_client = GooglePlaces::Client.new(API_KEY.sample)
  @google_place_client.spots(mid.lat, mid.lng, :types => ['restaurant','food'])
end

def midpoint(a, b)
  geocoded_a = Geokit::Geocoders::GoogleGeocoder.geocode(a)
  geocoded_b = Geokit::Geocoders::GoogleGeocoder.geocode(b)
  # TODO: Check valid geocoded data....
  geocoded_a.midpoint_to(geocoded_b)
end

get '/' do
  haml :index
end

post '/find' do
  spots = search_spots(params["address_a"], params["address_b"])
  haml :result, locals: { spots: spots, point_a: params["address_a"], point_b: params["address_b"] }
end
