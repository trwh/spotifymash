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
  res.render('index', {artist1: null, artist2: null});
})

app.post('/', function (req, res) {
  let artist1 = req.body.artist1;

  spotifyApi.searchArtists(artist1)
  .then(function(data) {
    // console.log(JSON.stringify(data));
    if(data.body.artists.items[0].name)
      {
        res.render('index', {artist1: data.body.artists.items[0].name});
      } else {
        res.render('index', {artist1: 'No match found!'});
      }
  }, function(err) {
    console.error(err);
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
      // onceAuthenticatedDo();
    },
    function(err) {
      console.log('Something went wrong when retrieving an access token', err);
    }
  );
}

// function onceAuthenticatedDo() {

//   spotifyApi.getArtistAlbums('06HL4z0CvFAxyc27GXpf02').then(
//     function(data) {
//       console.log('Artist albums', data.body);
//     },
//     function(err) {
//       console.error(err);
//     }
//   );

// }
