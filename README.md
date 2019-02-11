# [Spotifymash](https://spotifymash.com)
A [Facemash](https://en.wikipedia.org/wiki/History_of_Facebook)-style battle between two artists on Spotify, ranked by their popularity as defined by the [Spotify Web API](https://developer.spotify.com/documentation/web-api/).

Spotifymash keeps a list of artists to rank, based on my own (varied!!) music collection, see `/data/artists-input-trwh.json`. Live popularity data is fetched from the Spotify API, authenticated via [Client Credentials Flow](https://developer.spotify.com/documentation/general/guides/authorization-guide/#client-credentials-flow) so that the user doesn't necessarily have to be a Spotify subscriber (free or paid) themselves.

### Built With

* [Node.js](https://nodejs.org/en/), [Express.js](https://expressjs.com/).
* [jQuery](https://jquery.com/) - Client-side scripting, used for UI manipulation.
* [spotify-web-api-node](https://rometools.github.io/rome/) - Node module to make using the Spotify Web API easier.
* [EJS](https://github.com/thelinmichael/spotify-web-api-node) - View templating with embedded JavaScript.
* [js-cookie](https://github.com/js-cookie/js-cookie) - Plain JavaScript API for handling browser cookies.

### Installation

```
npm install
cp .env.example .env
```
Visit https://developer.spotify.com/dashboard/applications to obtain a client ID and secret, and populate the `.env`.
```
npm start
```
Visit http://localhost:8081 to view Spotifymash!

### Deploy to production

This project has been deployed in AWS using Elastic Beanstalk, you'll find the correct `npm start` script in `package.json` in the `production` branch to install and launch the project using PM2. Both the development (`master`) and the `production` branch have Express set to listen on TCP/8081 for compatibility with the NGINX proxy EB deploys. There is configuration in `.ebextensions` to enable HTTPS with an AWS-provided cert (replace the ARN in `securelistener-alb.config` with your own) and also to enable NGINX to serve the `public` directory directly.

### Artist List

The app relies on a prepopulated list of artists in the `/data` folder to pick pairs from to display. The `artists-input` JSON files are arrays of strings to search the Spotify API for, the results of which build the `artists` JSON files. The files to use in Spotifymash are specified near the top of `/src/index.js`. You only need `ARTIST_LIST_RELATIVE_FILE_PATH` for normal operation, which by default points at a list based on my music collection.

If you want to create your own artist list, you'll need to create an `artists-input` JSON file, refer to it in `ARTIST_LIST_INPUT_FULL_FILE_PATH` and call the `populateArtistList` function once `authenticateSpotify` has had a chance to run (a second or so, say). For example, add the following to the end of `/src/index.js` and call `npm start`,

```
setTimeout(populateArtistList, 1000);
```

Then you can refer to the uniquely-named `artists` JSON file created in `/data` in `ARTIST_LIST_RELATIVE_FILE_PATH` to use your own artist list.

## License

This project is licensed under the terms of the GNU GPLv3 license.
