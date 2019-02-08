const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ARTIST_LIST_RELATIVE_FILE_PATH = "../data/artists - 5-2-2019,10-12-55.json";
const artistList = require(ARTIST_LIST_RELATIVE_FILE_PATH);
const ARTIST_LIST_INPUT_FULL_FILE_PATH = path.join(__dirname, '..', 'data', 'artists-input-test.json');
const ARTIST_MINIMUM_POPULARITY = 60;

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', function (req, res) {
  let artistsFromDatabase = getPairOfUniqueRandomArtists(artistList);
  let artistsFromLiveAPI = [];

  spotifyApi.getArtist(artistsFromDatabase[0].id)
  .then(function(data) {
    // console.log(JSON.stringify(data));
    artistsFromLiveAPI[0] = data.body;
  }, function(err) {
    console.error(err);

  }).then(function() {
    spotifyApi.getArtist(artistsFromDatabase[1].id)
    .then(function(data) {
      // console.log(JSON.stringify(data));
      artistsFromLiveAPI[1] = data.body;

      // API calls done
      res.render('index', {
          artist1Name: artistsFromLiveAPI[0].name,
          artist1ImageUrl: artistsFromLiveAPI[0].images[0].url,
          artist1Popularity: artistsFromLiveAPI[0].popularity,
          artist2Name: artistsFromLiveAPI[1].name,
          artist2ImageUrl: artistsFromLiveAPI[1].images[0].url,
          artist2Popularity: artistsFromLiveAPI[1].popularity
        });

    }, function(err) {
      console.error(err);
    });
  });

})

app.listen(8081, function () {
  console.log('Spotifymash listening on port 8081!');
})

authenticateSpotify();

function authenticateSpotify() {
  spotifyApi.clientCredentialsGrant().then(
    function(data) {
      spotifyApi.setAccessToken(data.body['access_token']);
      console.log('The access token is ' + spotifyApi.getAccessToken());
      let tokenValidityInMilliseconds = ((data.body.expires_in - 10) * 1000);
      setTimeout(authenticateSpotify, tokenValidityInMilliseconds);
    },
    function(err) {
      console.log('Something went wrong when retrieving an access token', err);
      setTimeout(authenticateSpotify, 60000);
    }
  );
}

function generateRandomNumber(minValue, maxValue) {
  let randomNumber = Math.random() * (maxValue - minValue) + minValue;
  return Math.floor(randomNumber);
}

function artistsAreTheSame(artist1, artist2) {
  return (artist1.id == artist2.id) ? true : false;
}

function artistHasImage(artist) {
  return (artist.images.length >= 1) ? true : false;
}

function getRandomArtistThatHasImage(list) {
  let artist = null;
  let lengthOfList = list.body.artists.items.length;

  do {
    artist = list.body.artists.items[generateRandomNumber(0, lengthOfList)];
  } while (!artistHasImage(artist));

  return artist;
}

function getPairOfUniqueRandomArtists(list) {
  let artist1 = getRandomArtistThatHasImage(list);
  let artist2 = getRandomArtistThatHasImage(list);

  while (artistsAreTheSame(artist1, artist2)) {
    artist2 = getRandomArtistThatHasImage(list);
  }

  return([artist1, artist2]);
}

// ***
// Functions to populate artists.json via Spotify APIs
// ***

function getDateTimeString() {
  var currentDate = new Date();
  var dateTimeString =
                    currentDate.getDate() + "-"
                  + (currentDate.getMonth()+1)  + "-"
                  + currentDate.getFullYear() + ","
                  + currentDate.getHours() + "-"
                  + currentDate.getMinutes() + "-"
                  + currentDate.getSeconds();
  return dateTimeString;
}

function getNewArtistsFilePath() {
  let artistsFileName = "artists - " + getDateTimeString() + ".json";
  let artistsFilePath = path.join(__dirname, '..', 'data', artistsFileName);
  return artistsFilePath;
}

function writeJsonFileSync(filePath, JsonObject) {
  let data = JSON.stringify(JsonObject);
  fs.writeFileSync(filePath, data, 'utf8');
}

function readJsonFileSync(filePath) {
  let data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

function addArtistsFoundFromSpotifyApiToList(temporaryArtistList, searchStrings, currentSearchStringIndex) {
  spotifyApi.searchArtists(searchStrings[currentSearchStringIndex])
  .then(function(data) {

    if (data.body.artists.items.length >= 1) {
      let artistReturned = data.body.artists.items[0];
      if (artistReturned.popularity >= ARTIST_MINIMUM_POPULARITY) {
        temporaryArtistList.body.artists.items.push(artistReturned);
        console.log(temporaryArtistList.body.artists.items.length + " artists on list. Adding " + artistReturned.name + ", popularity " + artistReturned.popularity + ".");
      } else {
        console.log(temporaryArtistList.body.artists.items.length + " artists on list. " + artistReturned.name + ", popularity " + artist.popularity + " is not popular enough to add.");
      }
    } else {
      console.log(temporaryArtistList.body.artists.items.length + " artists on list. " + searchStrings[currentSearchStringIndex] + " had no results.");
    }

  }, function(err) {
    console.error(err);
  }).catch(function() {
    // Dummy catch block to enable then.
  }).then(function() {
    let nextSearchStringIndex = currentSearchStringIndex + 1;
    if (nextSearchStringIndex < searchStrings.length) {
      addArtistsFoundFromSpotifyApiToList(temporaryArtistList, searchStrings, nextSearchStringIndex);
    } else {
      console.log("Finished processing list, writing out artists file...");
      writeJsonFileSync(getNewArtistsFilePath(), temporaryArtistList);
    }
  });
}

function populateArtistList() {
  let temporaryArtistList = {
    "body": {
      "artists": {
        "items": []
      }
    }
  };
  let artistSearchStrings = readJsonFileSync(ARTIST_LIST_INPUT_FULL_FILE_PATH);
  let nextSearchStringToTry = 0;

  addArtistsFoundFromSpotifyApiToList(
    temporaryArtistList,
    artistSearchStrings,
    nextSearchStringToTry
  );
}

// Call to launch artist list population once we're sure we've authenticated to the Spotify API.
// setTimeout(populateArtistList, 1000);