` TODO
  --------------
  4) UI UI UI 
  5) Spotify integration
  6) FS events listeners (https://www.npmjs.com/package/chokidar ?)
  7) UPNP support for speakers

`;
const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("fs");

const path = require("path");

const mm = require("music-metadata");
const uuid = require("uuid");

let win;
const dbmanager = require("./scripts/db_manager");

const upnp_discovery = require("node-upnp-utils");
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
    (async () => {
      for await (const f of listFiles(result.filePaths[0])) {
        await mm.parseFile(f).then(async (metadata) => {
          /**
           *  @type {{title:string,artist:string,album:string,}}
           */
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
app.whenReady().then(async () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  win.webContents.openDevTools();
  await dbmanager.loadDB();
  win.loadFile("index.html");
  loadSongs();
  ipcMain.on("add-path", () => {
    addPath();
  });
  deviceDiscovery()
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
