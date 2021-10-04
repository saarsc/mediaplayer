const { contextBridge, ipcRenderer } = require("electron");

window.addEventListener("DOMContentLoaded", () => {
  // RUN LOADING OLD DATA
});

contextBridge.exposeInMainWorld("api", {
  send: (channel, data) => {
    // whitelist channels
    let validChannels = [
      "add-path",
      "login-spotify",
      "get-playlists",
      "get-playlist-songs",
      "selected-song",
      "next-song",
      "prev-song",
      "toggle-shuffle",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    let validChannels = [
      "add-song-to-list",
      "spotify-link",
      "playlists-list",
      "song-info",
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
});
