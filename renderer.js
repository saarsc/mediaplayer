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
  songWrapper.addEventListener("click", () => {
    var audio = new Audio(song.path);
    audio.play();
  });
  document.getElementById("songs-list").appendChild(songWrapper);
});
const $ = document.querySelectorAll;
