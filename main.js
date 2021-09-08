
const { app, BrowserWindow, dialog } = require("electron");
const fs = require("fs");

const path = require("path");

const mm = require("music-metadata");
const uuid = require("uuid");

const { Low, JSONFile } = require("esm")(module)("lowdb");

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

const writeToDB = async (song) => {
  const file = join(__dirname, "db.json");
  const adapter = new JSONFile(file);
  const db = new Low(adapter);

  await db.read();

  db.data ||= {
    title: [],
    artist: [],
    album: [],
    id: [],
    cover: [],
    date: [],
    path: [],
    spotifyId: [],
  };
  if (!db.data.path.find((path) => song.path === path)) {
    db.data.push(song);
    db.write();
  }
};

app.whenReady().then(() => {
  const win = new BrowserWindow({
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
  //   win.webContents.openDevTools();
  dialog.showOpenDialog({ properties: ["openDirectory"] }).then((result) => {
    (async () => {
      for await (const f of listFiles(result.filePaths[0])) {
        await mm.parseFile(f).then((metadata) => {
          const song = {
            title: metadata.common.title,
            artist: metadata.common.artist,
            album: metadata.common.album,
            id: uuid.v4(),
            cover: metadata.common.picture[0].data.toString("base64"),
            date: metadata.common.date,
            path: f,
            spotifyId: "",
          };
          writeToDB(song);
          win.webContents.send("add-song-to-list", song);
        });
      }
    })();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
