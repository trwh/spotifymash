const express = require('express');
const bodyParser = require('body-parser');
const SpotifyWebApi = require('spotify-web-api-node');
require('dotenv').config();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
  res.render('index', {artist1ResultName: null, artist2ResultName: null});
})

app.post('/', function (req, res) {
  let artist1Search = req.body.artist1Search;
  let artist2Search = req.body.artist2Search;
  let artist1ResultName = null;
  let artist1ResultPopularity = null;
  let artist2ResultName = null;
  let artist2ResultPopularity = null;

  spotifyApi.searchArtists(artist1Search)
  .then(function(data) {
    // console.log(JSON.stringify(data));
    if(data.body.artists.items.length >= 1) {
        artist1ResultName = data.body.artists.items[0].name;
        artist1ResultPopularity = data.body.artists.items[0].popularity;
      }
  }, function(err) {
    console.error(err);

  }).then(function() {
    spotifyApi.searchArtists(artist2Search)
    .then(function(data) {
      if(data.body.artists.items.length >= 1) {
          artist2ResultName = data.body.artists.items[0].name;
          artist2ResultPopularity = data.body.artists.items[0].popularity;
        }
      res.render('index', {
        artist1ResultName: artist1ResultName,
        artist1ResultPopularity: artist1ResultPopularity,
        artist2ResultName: artist2ResultName,
        artist2ResultPopularity: artist2ResultPopularity
        });
    }, function(err) {
      console.error(err);
    });
  });

})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
})

authenticateSpotify();

function authenticateSpotify() {
  spotifyApi.clientCredentialsGrant().then(
    function(data) {
      spotifyApi.setAccessToken(data.body['access_token']);
      console.log('The access token is ' + spotifyApi.getAccessToken());
      let tokenValidityInMilliseconds = data.body.expires_in * 1000;
      setTimeout(authenticateSpotify, tokenValidityInMilliseconds);
    },
    function(err) {
      console.log('Something went wrong when retrieving an access token', err);
      setTimeout(authenticateSpotify, 60000);
    }
  );
}
