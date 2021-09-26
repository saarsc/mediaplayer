const SpotifyWebApi = require("spotify-web-api-node");
const spotifyCreds = require("./utils/spotify_creds");
const stoarge = require("electron-json-storage");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
// General Spotify object
const spotifyApi = new SpotifyWebApi({
  clientId: spotifyCreds.CLIENT_ID,
  redirectUri: spotifyCreds.REDIRECT_URL,
  clientSecret: spotifyCreds.CLIENT_SECRET,
});
/**
 *
 * @returns {sting} Authntication link for spotify
 */
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
/**
 * Initalzing the spotifyApi object uppon new login using access token or using the refresh token on load
 *
 * @param {string} access - Optional acess token returned from user authnticating to spotify
 */
const connect = (access) => {
  if (access) {
    // Retrieve an access token and a refresh token
    spotifyApi.authorizationCodeGrant(access).then(
      function (data) {
        console.log("The refresh token is " + data.body["refresh_token"]);

        // Set the access token on the API object to use it in later calls
        spotifyApi.setAccessToken(data.body["access_token"]);
        spotifyApi.setRefreshToken(data.body["refresh_token"]);
        stoarge.set("spotify", { token: data.body["refresh_token"] });
      },
      function (err) {
        console.log("Problem loging to spotify", err.message);
      }
    );
  } else {
    // In the case login was already made just use the refresh tokeb
    const refresh_token = stoarge.getSync("spotify")["token"];
    if (refresh_token) {
      spotifyApi.setRefreshToken(refresh_token);
      spotifyApi.refreshAccessToken().then((data) => {
        tokenExperition = data.body["expires_in"];
        spotifyApi.setAccessToken(data.body["access_token"]);
      });
    }
  }
};
/**
 * Lists all user playlists
 *
 * @returns {Array[{id:string, name:string}]} List of playlists objects
 */
const getPlaylists = async () => {
  return spotifyApi.getUserPlaylists().then(
    (data) => {
      return data.body.items.map((playlist) => {
        return { id: playlist.id, name: playlist.name };
      });
    },
    (err) => {
      console.log("Problem fetching playlists", err.message);
    }
  );
};
/**
 * Lists all the songs in a playlist
 *
 * @param {String} id Playlist id
 * @param {Number} offset Optional - Offset from where to grab the songs. Used when looking if new songs were added
 * @returns {Array} Array of objects containing the playlists songs info
 */
const listPlayListSongs = async (id, offset) => {
  let songs = [];
  if (!offset) {
    offset = 0;
  }
  let totalSongs;
  do {
    await spotifyApi
      .getPlaylistTracks(id, { offset: offset })
      .then(async (data) => {
        await Promise.all(
          data.body.items.map(async (song) => {
            await new Promise(async (resolve) => {
              const info = song.track;
              const parsedSong = {
                artist: info.artists[0].name,
                id: info.id,
                title: info.name,
                path: info.href,
                album: info.album.name,
                cover: await fetch(info.album.images[0].url).then((r) =>
                  r.buffer()
                ),
              };
              songs.push(parsedSong);
              resolve(parsedSong);
            });
          })
        );
        totalSongs = data.body.total;
      });
    offset += 100;
  } while (offset < totalSongs);

  return songs;
};
const listDevices = async () => {
  return await spotifyApi.getMyDevices().then((data) => {
    return data.body.devices.map((device) => {
      return { name: device.name, id: device.id };
    });
  });
};

module.exports = {
  createLink,
  getPlaylists,
  connect,
  listPlayListSongs,
};
