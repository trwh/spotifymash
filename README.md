# [Spotifymash](https://spotifymash.com)
A [Facemash](https://en.wikipedia.org/wiki/History_of_Facebook)-style battle between two artists on Spotify, ranked by their popularity as defined by the [Spotify Web API](https://developer.spotify.com/documentation/web-api/).

Spotifymash keeps a list of artists to rank, based on my own (varied!!) music collection, see `/data/artists-input-trwh.json`. Live popularity data is fetched from the Spotify API, authenticated via [Client Credentials Flow](https://developer.spotify.com/documentation/general/guides/authorization-guide/#client-credentials-flow) so that the user doesn't necessarily have to be a Spotify subscriber (free or paid) themselves.

### Built With

* [Node.js](https://nodejs.org/en/), [Express.js](https://expressjs.com/).
* [jQuery](https://jquery.com/) - Client-side scripting, used for UI manipulation.
* [spotify-web-api-node](https://rometools.github.io/rome/) - Node module to make using the Spotify Web API easier.
* [EJS](https://github.com/thelinmichael/spotify-web-api-node) - View templating with embedded JavaScript.
* [js-cookie](https://github.com/js-cookie/js-cookie) - Plain JavaScript API for handling browser cookies.
* [greenlock-express](https://www.npmjs.com/package/greenlock-express) - Node module that automates fetching and renewing Let's Encrypt certificates.

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

There are two branches to help with deployment of this project.

#### `production` - AWS Elastic Beanstalk

This project has been deployed in AWS using Elastic Beanstalk, you'll find the correct `npm start` script in `package.json` in the `production` branch to install and launch the project using PM2. Both the development (`master`) and the `production` branch have Express set to listen on TCP/8081 for compatibility with the NGINX proxy EB deploys. There is configuration in `.ebextensions` to enable HTTPS with an AWS-provided cert (replace the ARN in `securelistener-alb.config` with your own) and also to enable NGINX to serve the `public` directory directly.

#### `greenlock` - Debian / Raspian

![Raspberry Pi 3B and Ubiquiti networking gear](https://trwh.co.uk/file/raspi.jpg)

At the time of writing (January 2021) Spotifymash is hosted from a Raspberry Pi model 3B running Raspian Buster and Node 14. I've created a branch `greenlock` with some tweaks needed for compatibility with the Node module `greenlock-express` which completely automates fetching and updating digital certificates from Let's Encrypt for HTTPS. I've also merged the PM2 config from the main `production` branch. To get the code from this branch working familiarise yourself with the [walkthrough](https://git.rootprojects.org/root/greenlock-express.js/src/branch/master/WALKTHROUGH.md) and then having followed the process listed above under Installation, check out the `greenlock` branch and follow these steps (filling in the details where needed),

```
npm install
sudo setcap 'cap_net_bind_service=+ep' $(which node)
npx greenlock init --config-dir ./greenlock.d --maintainer-email 'you@example.com'
npx greenlock add --subject yourdomain.com --altnames yourdomain.com,www.yourdomain.com
```
You can delete the automatically-generated files in the root of the project, `app.js` and `server.js` since there are ones already in `src/`. Add your email address to `src/server.js`.
```
sudo setcap 'cap_net_bind_service=+ep' $(which node)
npm start
```
Note that `npm start -- --staging` uses the Let's Encrypt staging environment if you want to test without requesting real certificates and risking hitting the rate limit. You'll need to use the start script specified in `package.json` from `master` to do this (e.g. don't launch PM2 for testing).

I suggest launching the server in a window manager like [Screen](https://www.gnu.org/software/screen/) so you can log out of the machine and still see the console output and terminate the app. Screen should be available to install via most Linux package managers.

### Artist List

The app relies on a prepopulated list of artists in the `/data` folder to pick pairs from to display. The `artists-input` JSON files are arrays of strings to search the Spotify API for, the results of which build the `artists` JSON files. The files to use in Spotifymash are specified near the top of `/src/index.js`. You only need `ARTIST_LIST_RELATIVE_FILE_PATH` for normal operation, which by default points at a list based on my music collection.

If you want to create your own artist list, you'll need to create an `artists-input` JSON file, refer to it in `ARTIST_LIST_INPUT_FULL_FILE_PATH` and call the `populateArtistList` function once `authenticateSpotify` has had a chance to run (a second or so, say). For example, add the following to the end of `/src/index.js` and call `npm start`,

```
setTimeout(populateArtistList, 1000);
```

Then you can refer to the uniquely-named `artists` JSON file created in `/data` in `ARTIST_LIST_RELATIVE_FILE_PATH` to use your own artist list.

## License

This project is licensed under the terms of the GNU GPLv3 license.
