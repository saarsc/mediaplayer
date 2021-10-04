let isPlaying = false;
const $ = document.querySelector.bind(document);
let timer;

const initSong = (path, artist, cover, title) => {
  isPlaying = false;
  let audio = $("#music");
  if (!audio) {
    audio = new Audio();
    audio.id = "music";
    document.body.appendChild(audio);
  }
  if (path.startsWith("http")) {
    // HANDLE SPOTIFY
  } else {
    audio.src = path;
    const progressBar = $("#length");
    progressBar.style.transition = "none";
    progressBar.style.width = "0%";
    audio.currentTime = 0;
    $(".music-player__title").innerHTML = title;
    $(".music-player__author").innerHTML = artist;
    $(".cover").src = `data:image/png;base64,${cover}`;

    audio.addEventListener("loadedmetadata", () => {
      let leftMinute = Math.floor(audio.duration / 60);
      let leftSecond = Math.floor(audio.duration % 60);
      $(".music-time__current").innerHTML = "00:00";
      $(".music-time__last").innerHTML =
        ("0" + leftMinute).substr(-2) + ":" + ("0" + leftSecond).substr(-2);
      progressBar.style.transition = "";
    });
    audio.onended = () => {
      window.api.send("next-song");
    };
    play();
  }
};

const play = () => {
  if (!isPlaying) {
    isPlaying = true;
    $("#music").play();
    $(".play").innerHTML = "pause";
    timer = setInterval(changeBar, 500);
  } else {
    $("#music").pause();
    $(".play").innerHTML = "play_arrow";
    isPlaying = false;
    clearInterval(timer);
  }
};
const changeBar = () => {
  const audio = $("#music");
  const percentage = (audio.currentTime / audio.duration).toFixed(3);
  $("#length").style.transition = "";

  //set current time
  const minute = Math.floor(audio.currentTime / 60);
  const second = Math.floor(audio.currentTime % 60);
  const leftTime = audio.duration - audio.currentTime;
  $(".music-time__current").innerHTML =
    ("0" + minute).substr(-2) + ":" + ("0" + second).substr(-2);

  //set left time
  var leftMinute = Math.floor(leftTime / 60);
  var leftSecond = Math.floor(leftTime % 60);

  $(".music-time__last").innerHTML =
    ("0" + leftMinute).substr(-2) + ":" + ("0" + leftSecond).substr(-2);

  //set time bar
  $("#length").style.width = percentage * 100 + "%";
};
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
      let $el = el.target;
      if ($el.tagName.toLowerCase() !== "li") {
        $el.parentElement.tagName.toLowerCase() === "li"
          ? ($el = $el.parentElement)
          : ($el = $el.parentElement.parentElement);
      }
      $el.classList.toggle("active");
      initSong(song.path, song.artist, song.cover, song.title);
      window.api.send("selected-song", song.id);
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

window.api.receive("song-info", (song) => {
  initSong(song.path, song.artist, song.cover, song.title);
});
/**
 * ---------------------------------------------------------
 *                END OF MAIN CALLS
 * ---------------------------------------------------------
 */
/**
 * ---------------------------------------------------------
 *                MEDIA CONTROLS
 * ---------------------------------------------------------
 */
$("#play").onclick = () => {
  play();
};
$("#next").onclick = () => {
  window.api.send("next-song");
};
$("#prev").onclick = () => {
  window.api.send("prev-song");
};
$("#shuffle").onclick = () => {
  const el = $("#shuffle span");
  let state;
  if (el.innerHTML === "shuffle") {
    el.innerHTML = "shuffle_on";
    state = true;
  } else {
    el.innerHTML = "shuffle";
    state = false;
  }
  const active_id = $(".active").id;
  window.api.send("toggle-shuffle", [state, active_id]);
};
/**
 * ---------------------------------------------------------
 *                END OF MEDIA CONTROLS
 * ---------------------------------------------------------
 */
$("#add-path").onclick = () => {
  window.api.send("add-path");
};
$("#login-spotify").onclick = () => {
  window.api.send("login-spotify");
};
$("#show-playlists").onclick = () => {
  window.api.send("get-playlists");
};
