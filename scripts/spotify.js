const SpotifyWebApi = require("spotify-web-api-node");
const spotifyCreds = require("./spotify_creds");
// credentials are optional
var spotifyApi = new SpotifyWebApi({
  clientId: spotifyCreds.CLIENT_ID,
  clientSecret: spotifyCreds.CLIENT_SECRET,
  redirectUri: spotifyCreds.REDIRECT_URL,
});
