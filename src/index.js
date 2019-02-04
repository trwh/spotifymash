const express = require('express');
const bodyParser = require('body-parser');
const SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ARTIST_LIST_RELATIVE_FILE_PATH = "../data/artists - 4-2-2019,17-9-32.json";
const artistList = require(ARTIST_LIST_RELATIVE_FILE_PATH);
const ARTIST_LIST_INPUT_FULL_FILE_PATH = path.join(__dirname, '..', 'data', 'artists-input.json');
const ARTIST_MINIMUM_POPULARITY = 70;

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
  res.render('index', {artist1Name: null, artist2Name: null});
})

app.post('/', function (req, res) {
  let artist1Name = null;
  let artist1Popularity = null;
  let artist2Name = null;
  let artist2Popularity = null;
  let fightResult = null;

  let artist1 = getRandomArtist(artistList);
  let artist2 = getRandomArtist(artistList);

  while (checkArtistsAreTheSame(artist1, artist2)) {
    artist2 = getRandomArtist(artistList);
  }

  spotifyApi.getArtist(artist1.id)
  .then(function(data) {
    // console.log(JSON.stringify(data));
    artist1 = data.body;
  }, function(err) {
    console.error(err);

  }).then(function() {
    spotifyApi.getArtist(artist2.id)
    .then(function(data) {
      artist2 = data.body;

      // API calls done
      let resultText = generateResultText(artist1, artist2);
      res.render('index', {
        resultText: resultText,
        artist1Name: artist1.name,
        artist1Popularity: artist1.popularity,
        artist2Name: artist2.name,
        artist2Popularity: artist2.popularity,
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
      let tokenValidityInMilliseconds = ((data.body.expires_in - 10) * 1000);
      setTimeout(authenticateSpotify, tokenValidityInMilliseconds);
    },
    function(err) {
      console.log('Something went wrong when retrieving an access token', err);
      setTimeout(authenticateSpotify, 60000);
    }
  );
}

function getRandomArtist(list) {
  let lengthOfList = list.body.artists.items.length;
  return list.body.artists.items[generateRandomNumber(0, lengthOfList)];
}

function checkArtistsAreTheSame(artist1, artist2) {
  return (artist1.id == artist2.id) ? true : false;
}

function generateRandomNumber(minValue, maxValue) {
  let randomNumber = Math.random() * (maxValue - minValue) + minValue;
  return Math.floor(randomNumber);
}

function checkForDraw(artist1, artist2) {
  return (artist1.popularity == artist2.popularity) ? true : false;
}

function findWinningArtist(artist1, artist2) {
  return (artist1.popularity > artist2.popularity) ? artist1 : artist2;
}

function findLosingArtist(artist1, artist2) {
  return (artist1.popularity < artist2.popularity) ? artist1 : artist2;
}

function generateResultText(artist1, artist2) {
  let resultText = null;

  if (checkForDraw(artist1, artist2)) {
    resultText = "Wow! We have a draw! What are the odds of that?";
    return resultText;
  }

  let winningArtist = findWinningArtist(artist1, artist2);
  let losingArtist = findLosingArtist(artist1, artist2);
  resultText = winningArtist.name + " wins! They beat " + losingArtist.name + ".";
  return resultText;
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

    // This search string yields at least one potential artist match.
    if (data.body.artists.items.length >= 1) {
      let artistsReturned = data.body.artists.items;
      artistsReturned.forEach( function(artist){
        if (artist.popularity >= ARTIST_MINIMUM_POPULARITY) {
          console.log("Searched for: " + searchStrings[currentSearchStringIndex] + ", got: " + artist.name + ", popularity " + artist.popularity + ".");
          temporaryArtistList.body.artists.items.push(artist);
          console.log(temporaryArtistList.body.artists.items.length + " artists on list.");
        }
      });
    } else {
      console.log("Searched for: " + searchStrings[currentSearchStringIndex] + " and found no results.");
    }

    // Regardless of the number of matches, once this Spotify API call is finished, make another.
    nextSearchStringIndex = currentSearchStringIndex + 1;
    if (nextSearchStringIndex < searchStrings.length) {
      addArtistsFoundFromSpotifyApiToList(temporaryArtistList, searchStrings, nextSearchStringIndex);
    } else {
      console.log("Finished processing list, writing out artists file...");
      writeJsonFileSync(getNewArtistsFilePath(), temporaryArtistList);
    }

  }, function(err) {
    console.error(err);
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