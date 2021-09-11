` TODO
  --------------
  3) ASYNC the file playing 
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
const addPath = () => {
  dialog.showOpenDialog({ properties: ["openDirectory"] }).then((result) => {
    (async () => {
      for await (const f of listFiles(result.filePaths[0])) {
        await mm.parseFile(f).then(async (metadata) => {
          const song = {
            title: metadata.common.title,
            artist: metadata.common.artist,
            album: metadata.common.album,
            id: uuid.v4(),
            date: metadata.common.date,
            path: f,
            spotify_id: "",
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
app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  win.loadFile("index.html");
  win.webContents.openDevTools();

  ipcMain.on("add-path", () => {
    addPath();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
