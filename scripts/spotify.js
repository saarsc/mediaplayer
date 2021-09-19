const SpotifyWebApi = require("spotify-web-api-node");
const spotifyCreds = require("./utils/spotify_creds");


const spotifyApi = new SpotifyWebApi({
  clientId: spotifyCreds.CLIENT_ID,
  redirectUri: spotifyCreds.REDIRECT_URL,
});
const createLink =()=>{
  const SCOPES = [
    "playlist-read-collaborative",
    "playlist-read-private",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
  ];
  
  return spotifyApi.createAuthorizeURL(SCOPES, "test");
}


// spotifyApi.clientCredentialsGrant().then(
//   function (data) {
//     console.log("The access token is " + data.body["access_token"]);
//     spotifyApi.setAccessToken(data.body["access_token"]);
//     getPlaylists();
//   },
//   function (err) {
//     console.log("Something went wrong!", err);
//   }
// );
const getPlaylists = () => {
  spotifyApi.getUserPlaylists(spotifyApi.getAccessToken()).then((data) => {
    console.log(data.body);
  });
};
module.exports = {
  createLink
}