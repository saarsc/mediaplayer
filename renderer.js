
window.api.receive("add-song-to-list", (song) => {
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
});
// window.api.receive("spotify-link", (link) => {
//   debugger;
//   document.getElementById("login-spotify").href = link;
// });

const $ = document.querySelectorAll;

document.getElementById("add-path").onclick = () => {
  window.api.send("add-path");
};
document.getElementById("login-spotify").onclick = ()=>{
  window.api.send("login-spotify")
}