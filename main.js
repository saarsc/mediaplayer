` TODO
  --------------
  4) UI UI UI 
  5) Spotify integration
  6) FS events listeners (https://www.npmjs.com/package/chokidar ?) to see when files are added / changed / removed
  7) UPNP support for speakers:
    a) Discovery : Kinda Working
    b) Actions: not working
  8) Add spotify song length to db to  prevent extra rquests to the API 
  9) handle changing from local file to spotify and back 
`;
const { app, BrowserWindow, dialog, ipcMain, session } = require("electron");
const fs = require("fs");

const path = require("path");

const mm = require("music-metadata");
const uuid = require("uuid");

let win;
const dbmanager = require("./scripts/utils/db_manager");

const upnp_discovery = require("node-upnp-utils");

const spotify = require("./scripts/spotify");
const storage = require("electron-json-storage");
// try {
// 	require('electron-reloader')(module);
// } catch {}
/**
 * Generator to list all audio files in a given path
 *
 * @param {string} dir - local folder path
 */
async function* listFiles(dir) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* listFiles(res);
    } else {
      const ext = path.extname(res).toLowerCase();
      if (ext === ".flac" || ext === ".mp3") {
        yield res;
      }
    }
  }
}
/**
 * Adds a source folder of songs
 *
 */
const addPath = () => {
  dialog.showOpenDialog({ properties: ["openDirectory"] }).then((result) => {
    // Lists the files in the subdirectories
    (async () => {
      for await (const f of listFiles(result.filePaths[0])) {
        await mm.parseFile(f).then(async (metadata) => {
          const song = {
            title: metadata.common.title.trim(),
            artist: metadata.common.artist.trim(),
            album: metadata.common.album.trim(),
            id: uuid.v4(),
            date: metadata.common.date,
            path: f,
            cover: metadata.common.picture[0].data,
          };
          for await (const s of dbmanager.writeToDB(song)) {
            win.webContents.send("add-song-to-list", s);
          }
        });
      }
    })();
  });
};
/**
 * When the program launches load all the songs from the DB
 */
async function loadSongs() {
  for await (const song of dbmanager.getAllSongs()) {
    win.webContents.send("add-song-to-list", song);
  }
}

const deviceDiscovery = () => {
  upnp_discovery.on("added", (device) => {
    // This callback function will be called whenever an device is found.
    console.log(device["address"]);
    console.log(device["description"]["device"]["friendlyName"]);
    console.log(device["headers"]["LOCATION"]);
    console.log(device["headers"]["USN"]);
    console.log("------------------------------------");
  });
  upnp_discovery.startDiscovery();

  // Stop the discovery process in 15 seconds
  setTimeout(() => {
    upnp_discovery.stopDiscovery(() => {
      console.log("Stopped the discovery process.");
      process.exit();
    });
  }, 15000);
};

/**
 * Handles the login process to spotify
 *
 */
ipcMain.on("login-spotify", () => {
  const spotifyAuth = new BrowserWindow({
    width: 800,
    height: 800,
    parent: win,
  });
  const filter = {
    urls: ["http://localhost:8080/*"],
  };
  // Grabs the access code from the redirect
  session.defaultSession.webRequest.onBeforeRequest(filter, (details) => {
    const url = new URL(details.url);

    spotify.connect(url.searchParams.get("code"));
    spotifyAuth.close();
  });

  spotifyAuth.loadURL(spotify.createLink());
  spotifyAuth.show();
});

/**
 * ---------------------------------------------------------
 *                  RENDERER CALLS
 * ---------------------------------------------------------
 */
/**
 * Handles the add folder call
 */
ipcMain.on("add-path", () => {
  addPath();
});
/**
 * Handles the list playlists call
 */
ipcMain.on("get-playlists", async () => {
  win.webContents.send("playlists-list", await spotify.getPlaylists());
});
/**
 * Handles the list playlists songs call
 */
ipcMain.on("get-playlist-songs", async (_, id) => {
  const songs = await spotify.listPlayListSongs(id);
  for (const song of songs) {
    for await (const s of dbmanager.writeToDB(song)) {
      win.webContents.send("add-song-to-list", s);
    }
  }
});
/**
 * ---------------------------------------------------------
 *                 END OF RENDERER CALLS
 * ---------------------------------------------------------
 */

app.whenReady().then(async () => {
  win = new BrowserWindow({
    width: 1000,
    height: 1000,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  win.webContents.openDevTools();
  await win.loadFile("index.html");
  await dbmanager.loadDB();
  loadSongs();
  // spotify.connect();
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
