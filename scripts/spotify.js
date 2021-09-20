const SpotifyWebApi = require("spotify-web-api-node");
const spotifyCreds = require("./utils/spotify_creds");
const stoarge = require("electron-json-storage");

const spotifyApi = new SpotifyWebApi({
  clientId: spotifyCreds.CLIENT_ID,
  redirectUri: spotifyCreds.REDIRECT_URL,
  clientSecret: spotifyCreds.CLIENT_SECRET,
});
const createLink = () => {
  const SCOPES = [
    "playlist-read-collaborative",
    "playlist-read-private",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
  ];

  return spotifyApi.createAuthorizeURL(SCOPES, "test");
};

const connect = (access) => {
  let tokenExperition;
  if (access) {
    // Retrieve an access token and a refresh token
    spotifyApi.authorizationCodeGrant(access).then(
      function (data) {
        console.log("The refresh token is " + data.body["refresh_token"]);

        // Set the access token on the API object to use it in later calls
        spotifyApi.setAccessToken(data.body["access_token"]);
        spotifyApi.setRefreshToken(data.body["refresh_token"]);
        stoarge.set("spotify", { token: data.body["refresh_token"] });
        // tokenExperition = data.body["expires_in"];
        // setInterval(() => {
        //   spotifyApi.refreshAccessToken().then((data) => {
        //     tokenExperition =
        //       data.body["expires_in"];
        //   }, tokenExperition - 1000);
        // });
      },
      function (err) {
        console.log("Problem loging to spotify", err.message);
      }
    );
  } else {
    const refresh_token = stoarge.getSync("spotify")["token"];
    if (refresh_token) {
      spotifyApi.setRefreshToken(refresh_token);
      spotifyApi.refreshAccessToken().then((data) => {
        tokenExperition = data.body["expires_in"];
      });
    }
  }
};

const getPlaylists = () => {
  spotifyApi.getUserPlaylists().then((data) => {
    return data.body.items.map((playlist) => {
      return { id: playlist.id, name: playlist.name };
    });
  });
};
module.exports = {
  createLink,
  getPlaylists,
  connect,
};
