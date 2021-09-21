/**
 * ---------------------------------------------------------
 *                  MAIN CALLS
 * ---------------------------------------------------------
 */

window.api.receive(
  "add-song-to-list",
  /**
   * Handles the listings of the songs
   * creates a list of songs and appends addes it to the document
   * @param {object} song
   * @param {string} song.artist - song artist
   * @param {string} song.album - song album
   * @param {string} song.title - song name
   * @param {string} song.id - song id in DB
   * @param {string} song.path - song path to play from
   * @param {string} song.cover - album cover
   */
  (song) => {
    const songWrapper = document.createElement("li");
    songWrapper.classList = ["songWrapper"];

    songWrapper.id = song.id;
    const coverImage = document.createElement("img");
    coverImage.src = `data:image/png;base64,${song.cover}`;
    coverImage.width = 20;
    const songDetailsWrapper = document.createElement("div");

    const songName = document.createElement("span");
    songName.innerHTML = song.title;

    const songArtist = document.createElement("span");
    songArtist.innerHTML = song.artist;

    songWrapper.appendChild(coverImage);

    songDetailsWrapper.appendChild(songName);
    songDetailsWrapper.appendChild(songArtist);

    songWrapper.appendChild(songDetailsWrapper);

    songWrapper.addEventListener("click", (el) => {
      const player = document.getElementById("audio_player");
      const source = document.getElementById("audio_player_source");
      source.src = song.path;
      player.load();
      player.play();
    });
    document.getElementById("songs-list").appendChild(songWrapper);
  }
);

window.api.receive(
  "playlists-list",
  /**
   * Displays all the user palylists
   *
   * @param {Array} data
   * @param {string} data.name  Name Of The playlist
   * @param {string} data.id Playlist Id
   */
  (data) => {
    const $ul = document.getElementById("playlists-list");
    data.forEach((playlist) => {
      const $li = document.createElement("li");
      $li.innerHTML = playlist.name;
      $li.id = playlist.id;
      $li.onclick = () => {
        window.api.send("get-playlist-songs", playlist.id);
      };
      $ul.appendChild($li);
    });
  }
);
/**
 * ---------------------------------------------------------
 *                END OF MAIN CALLS
 * ---------------------------------------------------------
 */
const $ = document.querySelector.bind(document);

$("#add-path").onclick = () => {
  window.api.send("add-path");
};
$("#login-spotify").onclick = () => {
  window.api.send("login-spotify");
};
$("#show-playlists").onclick = () => {
  window.api.send("get-playlists");
};
